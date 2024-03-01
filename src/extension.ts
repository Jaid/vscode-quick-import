import * as vscode from 'vscode'

import {AddImportAction} from './codeAction/AddImportAction.js'
import * as addImportCommand from './command/addImport.js'
import {outputChannel} from './outputChannel.js'

export const activate = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand(addImportCommand.id, addImportCommand.addImport)
  const actionsProvider = vscode.languages.registerCodeActionsProvider(AddImportAction.documentSelector, new AddImportAction, AddImportAction.providerMetadata)
  context.subscriptions.push(disposable)
  context.subscriptions.push(actionsProvider)
  if (context.extensionMode === vscode.ExtensionMode.Development) {
    outputChannel.appendLine(`quick-import extension activated with ${context.subscriptions.length} subscriptions`)
    outputChannel.show()
  }
}
