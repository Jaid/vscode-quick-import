import * as vscode from 'vscode'

import {AddImportAction} from 'src/codeAction/AddImportAction.js'
import {addImport} from 'src/command/addImport.js'
import {extensionConfig} from 'src/Configuration.js'
import {outputChannel} from 'src/outputChannel.js'

export const activate = (context: vscode.ExtensionContext) => {
  const disposable = vscode.commands.registerCommand(addImport.id, addImport)
  const actionsProvider = vscode.languages.registerCodeActionsProvider(AddImportAction.documentSelector, new AddImportAction, AddImportAction.providerMetadata)
  const configurationListener = extensionConfig.makeListener()
  context.subscriptions.push(configurationListener)
  context.subscriptions.push(disposable)
  context.subscriptions.push(actionsProvider)
  if (context.extensionMode === vscode.ExtensionMode.Development) {
    outputChannel.appendLine(`quick-import extension activated with ${context.subscriptions.length} subscriptions`)
    outputChannel.show()
  }
}
