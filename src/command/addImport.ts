import type {ImportPreset} from '../map.js'

import * as lodash from 'lodash-es'
import * as vscode from 'vscode'
import {renderHandlebars} from 'zeug'

import {map} from '../map.js'

const findCurrentToken = (document: vscode.TextDocument, range: vscode.Range) => {
  if (!range.isEmpty) {
    return document.getText(range)
  }
  // const wordRange = document.getWordRangeAtPosition(range.start)
  // if (!wordRange) {
  //   return
  // }
  // return document.getText(wordRange)
}
/**
 * Get the first code line of the document, skipping any lines that start with a comment
*/
const getFirstCodeLine = (document: vscode.TextDocument) => {
  const isCommentLineRegex = /^\s*(\/[*/].*)?$/
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i)
    if (isCommentLineRegex.test(line.text)) {
      continue
    }
    return line
  }
}
const getFirstImportLine = (document: vscode.TextDocument) => {
  const isImportLineRegex = /^\s*import\s/
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i)
    if (isImportLineRegex.test(line.text)) {
      return line
    }
  }
}

export const addImport = async () => {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }
  const document = editor.document
  let line = getFirstImportLine(document)
  if (line === undefined) {
    line = getFirstCodeLine(document)
    if (line === undefined) {
      return
    }
  }
  let name = findCurrentToken(document, editor.selection)
  if (!name) {
    name = await vscode.window.showInputBox({
      prompt: `Enter the name of the variable to import:`,
    })
    if (!name) {
      return
    }
  }
  const importPresetBase: ImportPreset = map[name] ?? {}
  const importPreset = {
    import: name,
    package: lodash.kebabCase(name),
    isNamespace: false,
    isNamed: false,
    isType: false,
    ...importPresetBase,
  } as ImportPreset
  const handlebarsTemplate = `import {{#if isType}}type {{{braceSpace}}{{import}}{{{braceSpace}}}{{else}}{{#if isNamespace}}* as {{import}}{{else}}{{#if isNamed}}{{{{braceSpace}}{{import}}{{{braceSpace}}}{{else}}{{import}}{{/if}}{{/if}}{{/if}} from '{{package}}'{{newLine}}`
  const newLine = document.eol === vscode.EndOfLine.LF ? `\n` : `\r\n`
  const context = {
    ...importPreset,
    newLine,
    braceSpace: ` `,
  }
  const importStatement = renderHandlebars(handlebarsTemplate, context)
  await editor.edit(editBuilder => {
    // @ts-expect-error
    editBuilder.insert(line.range.start, importStatement)
  })
}
