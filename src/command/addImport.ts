import type {ImportInsertion} from '~/src/ImportInsertion.js'
import type {InputOptions} from 'zeug/types'

import * as vscode from 'vscode'

import {ImportBuilder} from '../ImportBuilder.js'

type Options = InputOptions<{
  defaultsType: typeof defaultOptions
  optionalOptions: ImportBuilder['options']
}>

const defaultOptions = {
  interactive: true,
}

export const addImport = async (options: Options['parameter'] = defaultOptions) => {
  const mergedOptions: Options['merged'] = {
    ...defaultOptions,
    ...options,
  }
  const importBuilder = new ImportBuilder(mergedOptions)
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

addImport.id = `quick-import.addImport`
