import type {ImportPreset} from './map.js'
import type Handlebars from 'handlebars'
import type {InputOptions} from 'zeug/types'

import * as lodash from 'lodash-es'
import {memoize} from 'memoize-cache-decorator'
import * as vscode from 'vscode'
import {logExecutionTime} from 'zeug'

import {findCurrentToken, getFirstCodeLine, getFirstImportLine} from '~/lib/documentUtil.js'
import {askForInput} from '~/lib/vscodeUtil.js'
import {extensionConfig} from '~/src/Configuration.js'
import {ImportInsertion} from '~/src/ImportInsertion.js'
import {outputChannel} from '~/src/outputChannel.js'

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
  static renderImportStatement(importPresetOrName: ImportPreset | string) {
    const importPreset = typeof importPresetOrName === `string` ? ImportBuilder.#createImportPreset(importPresetOrName) : importPresetOrName
    const context = {
      ...importPreset,
      isType: importPreset.type === `type`,
      isNamespace: importPreset.type === `namespace`,
      isNamed: importPreset.type === `named`,
      isDefault: importPreset.type === `default` || importPreset.type === undefined,
    }
    const render = extensionConfig.getHandlebarsRenderer()
    return render(context)
  }
  static #createImportPreset(name: string, importPackage?: string) {
    const shortcut = extensionConfig.presets[name]
    const importPreset: ImportPreset = {
      import: name,
      package: importPackage ?? lodash.kebabCase(name),
      type: `default`,
      ...shortcut,
    }
    return importPreset
  }
  options: Options['merged']
  renderTemplate: Handlebars.TemplateDelegate
  constructor(options: Options['parameter']) {
    this.options = {
      ...defaultOptions,
      ...options,
    }
  }
  @memoize()
  get document(): vscode.TextDocument | undefined {
    return this.options.document ?? vscode.window.activeTextEditor?.document
  }
  @memoize()
  get line(): vscode.TextLine {
    const document = this.document!
    const positionPreference = extensionConfig.insertPosition
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
  @logExecutionTime({
    log: message => outputChannel.appendLine(message),
  })
  build(): ImportInsertion | undefined {
    if (this.document === undefined) {
      return
    }
    const name = this.options.name ?? findCurrentToken(this.document, this.options.range)
    if (!name) {
      return
    }
    const importPackage = this.options.importPackage
    const importPreset = ImportBuilder.#createImportPreset(name, importPackage)
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
  @logExecutionTime({
    log: message => outputChannel.appendLine(message),
  })
  async buildInteractive(): Promise<ImportInsertion | undefined> {
    if (this.document === undefined) {
      return undefined
    }
    const name = this.options.name ?? findCurrentToken(this.document, this.options.range) ?? await this.#askForName()
    if (!name) {
      return
    }
    const definedShortcut = extensionConfig.presets[name]
    const isKnownShortcut = definedShortcut !== undefined
    let importPackage = this.options.importPackage
    if (!importPackage) {
      if (isKnownShortcut) {
        importPackage = definedShortcut.package
      } else {
        importPackage = await this.#askForPackage(name)
      }
    }
    const importPreset = ImportBuilder.#createImportPreset(name, importPackage)
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
  #getInsertionPosition(): vscode.Position {
    const line = this.line
    return line.range.start
  }
  #renderImportStatement(importPreset: ImportPreset) {
    let newLine: string | undefined
    if (this.document !== undefined) {
      newLine = this.document.eol === vscode.EndOfLine.LF ? `\n` : `\r\n`
    }
    const context = {
      ...importPreset,
      newLine,
      isType: importPreset.type === `type`,
      isNamespace: importPreset.type === `namespace`,
      isNamed: importPreset.type === `named`,
      isDefault: importPreset.type === `default` || importPreset.type === undefined,
    }
    const render = extensionConfig.getHandlebarsRenderer()
    return render(context)
  }
}
