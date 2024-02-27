type DefaultImport = {
  isNamed?: false
  isNamespace?: false
  isType?: false
}
type NamedImport = {
  isNamed: true
  isNamespace?: false
  isType?: false
}
type NamespaceImport = {
  isNamed?: false
  isNamespace: true
  isType?: false
}
type TypeImport = {
  isNamed?: true
  isNamespace?: false
  isType: true
}

export type ImportPreset = {
  import?: string
  package?: string
} & (DefaultImport | NamedImport | NamespaceImport | TypeImport)
type ImportMap = Record<string, ImportPreset>

export const map: ImportMap = {
  lodash: {
    package: `lodash-es`,
    isNamespace: true,
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
    isNamed: true,
  },
  shellQuote: {
    isNamespace: true,
  },
  simpleGit: {
    isNamed: true,
  },
  fileURLToPath: {
    package: `node:url`,
    isNamed: true,
  },
  globby: {
    isNamed: true,
  },
  mapObject: {
    package: `map-obj`,
  },
  mapObjectSkip: {
    package: `map-obj`,
    isNamed: true,
  },
  XOR: {
    package: `ts-xor`,
    isType: true,
  },
  PackageJson: {
    package: `type-fest`,
    isType: true,
  },
  vscode: {
    isNamespace: true,
  },
  pathEqual: {
    isNamed: true,
  },
}
