import * as vscode from 'vscode'

import {getLineSeparator} from '~/lib/documentUtil.js'

type Options = {
  document: vscode.TextDocument
  importStatement: string
  insertionPosition: vscode.Position
}

export class ImportInsertion {
  #options: Options
  constructor(options: Options) {
    this.#options = options
  }
  get document() {
    return this.#options.document
  }
  get importStatement() {
    return this.#options.importStatement
  }
  get insertionPosition() {
    return this.#options.insertionPosition
  }
  toWorkspaceEdit() {
    const edit = new vscode.WorkspaceEdit
    const line = this.importStatement + getLineSeparator(this.document)
    edit.insert(this.document.uri, this.insertionPosition, line)
    return edit
  }
}
