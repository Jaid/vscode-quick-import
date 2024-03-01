import * as vscode from 'vscode'

import {ImportBuilder} from '../ImportBuilder.js'
import {outputChannel} from '../outputChannel.js'

export const id = `quick-import.addImport`

type Options = ImportBuilder['options']

export const addImport = async (options: Options = {}) => {
  outputChannel.appendLine(`addImport`)
  const importBuilder = new ImportBuilder(options)
  const insertion = await importBuilder.buildInteractive()
  const edit = insertion?.toWorkspaceEdit()
  if (edit === undefined) {
    return
  }
  await vscode.workspace.applyEdit(edit)
}
