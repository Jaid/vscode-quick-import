import * as vscode from 'vscode'

export const askForInput = async (message: string, defaultValue?: string) => {
  const showInputBoxOptions: vscode.InputBoxOptions = {
    prompt: message,
  }
  if (defaultValue) {
    showInputBoxOptions.value = defaultValue
    showInputBoxOptions.valueSelection = undefined
  }
  const value = await vscode.window.showInputBox(showInputBoxOptions)
  return value
}
