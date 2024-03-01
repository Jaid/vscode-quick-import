import type {ImportInsertion} from '~/src/ImportInsertion.js'

import * as vscode from 'vscode'

import {ImportBuilder} from '../ImportBuilder.js'

export const id = `quick-import.addImport`

type Options = ImportBuilder['options'] & {
  interactive?: boolean
}

export const addImport = async (options: Options = {}) => {
  const importBuilder = new ImportBuilder(options)
  let insertion: ImportInsertion | undefined
  if (options.interactive) {
    insertion = await importBuilder.buildInteractive()
  } else {
    insertion = importBuilder.build()
  }
  const edit = insertion?.toWorkspaceEdit()
  if (edit === undefined) {
    return
  }
  await vscode.workspace.applyEdit(edit)
}
