import fs from 'fs-extra'
import {globby} from 'globby'
import readFileYaml from 'read-file-yaml'

const presetsFolder = `presets`
const files = await globby(`*.yml`, {cwd: presetsFolder})
const javascriptOutput = {}
const typescriptOutput = {}
for (const file of files) {
  const presets = await readFileYaml.default(`${presetsFolder}/${file}`)
  for (const [name, preset] of Object.entries(presets)) {
    if (preset.type === `type` || file === `typescript.yml`) {
      typescriptOutput[name] = preset
    } else {
      javascriptOutput[name] = preset
    }
  }
}
Object.assign(typescriptOutput, javascriptOutput)
const outputs = {
  javascript: javascriptOutput,
  typescript: typescriptOutput,
}
for (const [type, output] of Object.entries(outputs)) {
  const outputFile = `out/presets/${type}.json`
  await fs.outputJson(outputFile, output, {spaces: 2})
}
