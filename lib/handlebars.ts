import {makeHandlebarsWithHelpers} from 'zeug'

export const handlebars = makeHandlebarsWithHelpers({
  inQuotes: (input: string) => {
    // const quoteSymbol = config.get<string>(`quoteSymbol`, `'`)
    const quoteSymbol = `'`
    return `${quoteSymbol}${input}${quoteSymbol}`
  },
  inBraces: (input: string) => {
    // const braceSpace = getBraceSpace()
    const braceSpace = ` `
    return `{${braceSpace}${input}${braceSpace}`
  },
  trim: (input: string) => {
    return input.trim()
  },
})
