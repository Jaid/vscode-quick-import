export type ImportPreset = {
  import?: string
  package?: string
  type?: 'default' | 'named' | 'namespace' | 'type'
}
type ImportMap = Record<string, ImportPreset>

export const map: ImportMap = {
  lodash: {
    package: `lodash-es`,
    type: `namespace`,
  },
  fs: {
    package: `fs-extra`,
  },
  path: {
    package: `zeug/path`,
  },
  os: {
    package: `node:os`,
  },
  child_process: {
    package: `node:child_process`,
  },
  $: {
    package: `execa`,
    type: `named`,
  },
  shellQuote: {
    type: `namespace`,
  },
  simpleGit: {
  },
  fileURLToPath: {
    package: `node:url`,
    type: `named`,
  },
  globby: {
    type: `named`,
  },
  mapObject: {
    package: `map-obj`,
  },
  mapObjectSkip: {
    package: `map-obj`,
    type: `named`,
  },
  XOR: {
    package: `ts-xor`,
  },
  PackageJson: {
    package: `type-fest`,
    type: `type`,
  },
  vscode: {
    type: `namespace`,
  },
  pathEqual: {
    type: `named`,
  },
}
