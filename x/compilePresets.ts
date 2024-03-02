import fs from 'fs-extra'
import {globby} from 'globby'
import readFileYaml from 'read-file-yaml'

const presetsFolder = `presets`
const files = await globby(`*.yml`, {cwd: presetsFolder})
const output = {}
for (const file of files) {
  const presets = await readFileYaml.default(`${presetsFolder}/${file}`)
  for (const [name, preset] of Object.entries(presets)) {
    output[name] = preset
  }
}
const outputFile = `out/presets/presets.json`
await fs.outputJson(outputFile, output, {spaces: 2})
