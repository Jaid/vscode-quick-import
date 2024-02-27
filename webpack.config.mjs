import {fileURLToPath} from 'node:url'

import * as path from 'zeug/path'
import fs from 'fs-extra'
import * as lodash from 'lodash-es'

class EmitPackageJsonPlugin {
  constructor(pkg) {
    this.pkg = pkg
  }
  apply(compiler) {
    compiler.hooks.emit.tap(`EmitPackageJsonPlugin`, (compilation) => {
      const relevantPkg = lodash.pick(this.pkg, [`repository`, `homepage`, `version`, `description`, `engines`, `categories`, `displayName`, "activationEvents", "contributes"])
      const id = this.pkg.name.replace(/^vscode-/, ``)
      const outPkg = {
        ...relevantPkg,
        name: id,
        main: `index.js`,
        engines: {
          vscode: `^1.81.0`,
        },
        publisher: `jaidchen`
      }
      const content = JSON.stringify(outPkg)
      compilation.assets[`package.json`] = {
        source: () => content,
        size: () => content.length,
      }
    })
  }
}

const pkg = await fs.readJson(`package.json`)

const dirName = path.dirname(fileURLToPath(import.meta.url))
/**
 * @type {import('webpack').Configuration}
 */
const extensionConfig = {
  target: `node`,
  mode: `none`,
  entry: `./out/ts/src/extension.js`,
  output: {
    path: path.resolve(dirName, `out/webpack`),
    filename: `index.js`,
    libraryTarget: `commonjs2`,
  },
  externals: {
    vscode: `commonjs vscode`,
  },
  devtool: `inline-source-map`,
  plugins: [
    new EmitPackageJsonPlugin(pkg)
  ]
}
export default extensionConfig
