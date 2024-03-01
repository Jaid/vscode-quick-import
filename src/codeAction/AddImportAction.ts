import * as lodash from 'lodash-es'
import * as vscode from 'vscode'
import {logExecutionTime} from 'zeug'

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
    log: ms => outputChannel.appendLine(`addImport took ${ms}ms`),
  })
  public async provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): Promise<Array<vscode.CodeAction> | undefined> {
    const relevantDiagnostic = context.diagnostics.find(diagnostic => {
      for (const relevantDiagnosticsPattern of relevantDiagnosticsPatterns) {
        if (lodash.isMatch(diagnostic, relevantDiagnosticsPattern)) {
          outputChannel.appendLine(`found relevant diagnostic: ${JSON.stringify(diagnostic)}`)
          return true
        }
      }
      return false
    })
    if (!relevantDiagnostic) {
      return
    }
    const duplicateFix = await this.createFix(document, relevantDiagnostic)
    if (!duplicateFix) {
      return
    }
    return [duplicateFix]
  }
  private async createFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): Promise<vscode.CodeAction | undefined> {
    const text = document.getText(diagnostic.range)
    const importBuilder = new ImportBuilder({
      document,
      range: diagnostic.range,
      name: text,
    })
    const importInsertion = importBuilder.build()
    if (importInsertion === undefined) {
      return
    }
    const fix = new vscode.CodeAction(importInsertion.importStatement, vscode.CodeActionKind.QuickFix)
    fix.diagnostics = [diagnostic]
    fix.edit = new vscode.WorkspaceEdit
    fix.edit.insert(importInsertion.document.uri, importInsertion.insertionPosition, importInsertion.importStatement)
    return fix
  }
}
