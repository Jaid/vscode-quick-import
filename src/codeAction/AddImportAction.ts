import * as lodash from 'lodash-es'
import * as vscode from 'vscode'
import {logExecutionTime} from 'zeug'

import {addImport} from '~/src/command/addImport.js'
import {ImportBuilder} from '~/src/ImportBuilder.js'
import {outputChannel} from '~/src/outputChannel.js'

const relevantDiagnosticsPatterns = [
  {
    source: `ts`,
    code: 2304,
  },
]

export class AddImportAction implements vscode.CodeActionProvider {
  static readonly documentSelector: vscode.DocumentSelector = [
    {language: `typescript`},
    {language: `javascript`},
    {language: `typescriptreact`},
    {language: `javascriptreact`},
  ]
  static readonly providerMetadata = {
    providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
  }
  @logExecutionTime({
    log: message => outputChannel.appendLine(message),
  })
  public provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): Array<vscode.CodeAction> | undefined {
    try {
      const relevantDiagnostic = context.diagnostics.find(diagnostic => {
        for (const relevantDiagnosticsPattern of relevantDiagnosticsPatterns) {
          if (lodash.isMatch(diagnostic, relevantDiagnosticsPattern)) {
            return true
          }
        }
        return false
      })
      if (!relevantDiagnostic) {
        return
      }
      const name = document.getText(relevantDiagnostic.range)
      const title = ImportBuilder.renderImportStatement(name)
      const fix = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix)
      const options: Parameters<typeof addImport>[0] = {
        document,
        range: relevantDiagnostic.range,
        name,
        interactive: false,
      }
      fix.diagnostics = [relevantDiagnostic]
      fix.command = {
        title,
        command: addImport.id,
        arguments: [options],
      }
      outputChannel.appendLine(`Created fix “${title}” for problem “${relevantDiagnostic.message}”`)
      return [fix]
    } catch (error) {
      outputChannel.appendLine(`provideCodeActions error: ${error}`)
      throw error
    }
  }
}
