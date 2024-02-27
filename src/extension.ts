import * as vscode from 'vscode'

import {addImport} from './command/addImport.js'

export const activate = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand(`quick-import.addImport`, addImport)
  context.subscriptions.push(disposable)
}
