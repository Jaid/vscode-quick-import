import * as vscode from 'vscode'

/**
 * Get the first code line of the document, skipping any lines that start with a comment
*/
export const getFirstCodeLine = (document: vscode.TextDocument) => {
  const isNotCodeLineRegex = /^\s*(\/[*/].*)?$/
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i)
    if (isNotCodeLineRegex.test(line.text)) {
      continue
    }
    return line
  }
}
export const getFirstImportLine = (document: vscode.TextDocument) => {
  const isImportLineRegex = /^\s*import\s/
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i)
    if (isImportLineRegex.test(line.text)) {
      return line
    }
  }
}

export const findCurrentToken = (document: vscode.TextDocument, range?: vscode.Range) => {
  let givenRange = range
  if (givenRange === undefined) {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      return
    }
    givenRange = editor.selection
    if (givenRange === undefined) {
      return
    }
  }
  if (!range!.isEmpty) {
    return document.getText(range)
  }
  // const wordRange = document.getWordRangeAtPosition(range.start)
  // if (!wordRange) {
  //   return
  // }
  // return document.getText(wordRange)
}

export const getLineSeparator = (document: vscode.TextDocument) => {
  const eol = document.eol === vscode.EndOfLine.LF ? `\n` : `\r\n`
  return eol
}
