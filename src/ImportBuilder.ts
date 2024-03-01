import type {ImportPreset} from './map.js'
import type Handlebars from 'handlebars'
import type {InputOptions} from 'zeug/types'

import * as lodash from 'lodash-es'
import * as vscode from 'vscode'
import {renderHandlebars} from 'zeug'
import { memoize } from 'memoize-cache-decorator'

import {findCurrentToken, getFirstCodeLine, getFirstImportLine} from '~/lib/documentUtil.js'
import {askForInput} from '~/lib/vscodeUtil.js'

import {ImportInsertion} from './ImportInsertion.js'
import {map} from './map.js'

// https://handlebarsjs.com/playground.html#format=1&currentExample=%7B%22template%22%3A%22import%20%7B%7B%23if%20isType%7D%7Dtype%20%7B%7BinBraces%20import%7D%7D%7B%7Belse%20if%20isNamed%7D%7D%7B%7BinBraces%20import%7D%7D%7B%7Belse%20if%20isNamespace%7D%7D*%20as%20%7B%7Bimport%7D%7D%7B%7Belse%7D%7D%7B%7Bimport%7D%7D%7B%7B%2Fif%7D%7D%20from%20%7B%7BinQuotes%20package%7D%7D%7B%7BnewLine%7D%7D%22%2C%22partials%22%3A%5B%5D%2C%22input%22%3A%22%7B%5Cn%20%20import%3A%20'fs'%2C%5Cn%20%20isNamespace%3A%20true%2C%5Cn%20%20package%3A%20'fs-extra'%5Cn%7D%5Cn%22%2C%22output%22%3A%22import%20*%20as%20fs%20from%20'fs-extra'%22%2C%22preparationScript%22%3A%22Handlebars.registerHelper('inQuotes'%2C%20function%20(input)%20%7B%5Cn%20%20%20%20return%20new%20Handlebars.SafeString(%60'%24%7Binput%7D'%60)%5Cn%7D)%5CnHandlebars.registerHelper('inBraces'%2C%20function%20(input)%20%7B%5Cn%20%20%20%20return%20new%20Handlebars.SafeString(%60%7B%20%24%7Binput%7D%20%7D%60)%5Cn%7D)%5Cn%22%2C%22handlebarsVersion%22%3A%224.7.8%22%7D

const defaultOptions = {}

type Options = InputOptions<{
  defaultsType: typeof defaultOptions
  optionalOptions: {
    document: vscode.TextDocument
    editor: vscode.TextEditor
    importPackage: string
    name: string
    range: vscode.Range
  }
}>

export class ImportBuilder {
  config: vscode.WorkspaceConfiguration
  document?: vscode.TextDocument
  options: Options['merged']
  renderTemplate: Handlebars.TemplateDelegate
  constructor(options: Options['parameter']) {
    this.options = {
      ...defaultOptions,
      ...options,
    }
    this.#init()
  }
  build(): ImportInsertion | undefined {
    if (this.document === undefined) {
      return
    }
    const name = this.options.name ?? findCurrentToken(this.document, this.options.range)
    if (!name) {
      return
    }
    const importPackage = this.options.importPackage
    const importPreset = this.#createImportPreset(name, importPackage)
    const importStatement = this.#renderImportStatement(importPreset)
    return new ImportInsertion({
      importStatement,
      document: this.document,
      insertionPosition: this.#getInsertionPosition(),
    })
  }
  /**
   * Same as {@link ImportBuilder#build}, but prompts the user for input if any required options are missing
   */
  async buildInteractive(): Promise<ImportInsertion | undefined> {
    if (this.document === undefined) {
      return undefined
    }
    const name = this.options.name ?? findCurrentToken(this.document, this.options.range) ?? await this.#askForName()
    if (!name) {
      return
    }
    const importPackage = this.options.importPackage ?? await this.#askForPackage(name)
    const importPreset = this.#createImportPreset(name, importPackage)
    const importStatement = this.#renderImportStatement(importPreset)
    return new ImportInsertion({
      importStatement,
      document: this.document,
      insertionPosition: this.#getInsertionPosition(),
    })
  }
  async #askForName() {
    return askForInput(`Enter the name of the variable to import:`)
  }
  async #askForPackage(importName?: string) {
    const defaultValue = importName ? lodash.kebabCase(importName) : undefined
    return askForInput(`Enter the name of the package to import from:`, defaultValue)
  }
  #chooseLine(): vscode.TextLine {
    const document = this.document!
    const positionPreference = this.config.get<'firstCodeLine' | 'optimal' | 'top'>(`insertionPosition`, `top`)
    let line: vscode.TextLine | undefined
    if (positionPreference === `firstCodeLine`) {
      line = getFirstCodeLine(document)
    } else if (positionPreference === `optimal`) {
      line = getFirstImportLine(document) ?? getFirstCodeLine(document)
    }
    if (line === undefined) {
      line = document.lineAt(0)
    }
    return line
  }
  #createImportPreset(name: string, importPackage?: string) {
    const importPreset: ImportPreset = {
      import: name,
      package: importPackage ?? lodash.kebabCase(name),
      type: `default`,
      ...map[name],
    }
    return importPreset
  }
  #getBraceSpace(): string {
    const braceSpace = this.config.get<boolean | string>(`braceSpace`, ` `)
    if (braceSpace === true) {
      return ` `
    }
    if (braceSpace === false) {
      return ``
    }
    return braceSpace
  }
  #getInsertionPosition(): vscode.Position {
    const line = this.#chooseLine()
    return line.range.start
  }
  #getQuoteSymbol(): string {
    const quoteSymbol = this.config.get<string>(`quoteSymbol`, `'`)
    return quoteSymbol
  }
  #init() {
    this.config = vscode.workspace.getConfiguration(`quick-import`)
    this.document = this.options.document ?? vscode.window.activeTextEditor?.document
  }
  #renderImportStatement(importPreset: ImportPreset) {
    const quoteSymbol = this.#getQuoteSymbol()
    const braceSpace = this.#getBraceSpace()
    const template = this.config.get<string>(`template`, `import {{#if isType}}type {{inBraces import}}{{else if isNamed}}{{inBraces import}}{{else if isNamespace}}* as {{import}}{{else}}{{import}}{{/if}} from {{inQuotes package}}{{newLine}}`)
    const context = {
      ...importPreset,
      newLine: this.document!.eol === vscode.EndOfLine.LF ? `\n` : `\r\n`,
      isType: importPreset.type === `type`,
      isNamespace: importPreset.type === `namespace`,
      isNamed: importPreset.type === `named`,
      isDefault: importPreset.type === `default` || importPreset.type === undefined,
    }
    return renderHandlebars(template, context, {
      inQuotes: (input: string) => {
        return `${quoteSymbol}${input}${quoteSymbol}`
      },
      inBraces: (input: string) => {
        return `{${braceSpace}${input}${braceSpace}`
      },
      trim: (input: string) => {
        return input.trim()
      },
    })
  }
}
