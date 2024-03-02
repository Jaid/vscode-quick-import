import {memoize} from 'memoize-cache-decorator'
import * as vscode from 'vscode'
import {makeHandlebarsRenderer} from 'zeug'

import {outputChannel} from '~/src/outputChannel.js'

export type ImportPreset = {
  import?: string
  package?: string
  type?: 'default' | 'named' | 'namespace' | 'type'
}
type Presets = Record<string, ImportPreset>

class Configuration {
  config: vscode.WorkspaceConfiguration
  constructor() {
    this.refresh()
  }
  get braceSpace() {
    const braceSpace = this.config.get<boolean | string>(`braceSpace`, ` `)
    if (braceSpace === true) {
      return ` `
    }
    if (braceSpace === false) {
      return ``
    }
    return braceSpace
  }
  get insertPosition() {
    const positionPreference = this.config.get<'firstCodeLine' | 'optimal' | 'top'>(`insertionPosition`, `optimal`)
    return positionPreference
  }
  get presets() {
    return this.config.get<Presets>(`presets`, {
      lodash: {
        type: `namespace`,
        package: `lodash-es`,
      },
      react: {
        package: `react`,
      },
      $: {
        package: `execa`,
        type: `named`,
      },
      vscode: {
        type: `namespace`,
      },
    })
  }
  get quoteSymbol() {
    const quoteSymbol = this.config.get<string>(`quoteSymbol`, `'`)
    return quoteSymbol
  }
  get template() {
    return this.config.get<string>(`template`, `import {{#if isType}}type {{inBraces import}}{{else if isNamed}}{{inBraces import}}{{else if isNamespace}}* as {{import}}{{else}}{{import}}{{/if}} from {{inQuotes package}}`)
  }
  @memoize()
  getHandlebarsRenderer() {
    const quoteSymbol = this.quoteSymbol
    const braceSpace = this.braceSpace
    const renderer = makeHandlebarsRenderer(this.template, {
      inQuotes: (input: string) => {
        return `${quoteSymbol}${input}${quoteSymbol}`
      },
      inBraces: (input: string) => {
        return `{${braceSpace}${input}${braceSpace}}`
      },
      trim: (input: string) => {
        return input.trim()
      },
    })
    return renderer
  }
  makeListener() {
    const handle = (...args) => {
      outputChannel.appendLine(`Configuration changed`)
      this.refresh()
    }
    const configurationListener = vscode.workspace.onDidChangeConfiguration(handle)
    return configurationListener
  }
  refresh() {
    this.config = vscode.workspace.getConfiguration(`quick-import`)
  }
}

export const extensionConfig = new Configuration
