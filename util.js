const fetch = require('node-fetch')
const cheerio = require('cheerio')
const parsers = require('./parsers')

const downloadPage = (url) => {
  return fetch(url)
    .then(response => response.text())
}

const parsePage = (markup) => {
  return new Promise((resolve, reject) => {
    const $ = cheerio.load(markup)
    if ($) {
      resolve($)
    }
    else {
      reject(new Error('Cheerio error'))
    }
  })
}

// const runParser = ($, parser) => {
//   return parsers[parser]($)
// }

// const makeParserIterator = () => {
//   let available = Object.keys(parsers)
//   let parser = available.shift()

//   return $ => {
//     let result = runParser($, parser)

//     while (result.error && available.length > 0) {
//       parser = available.shift()
//       result = runParser($, parser)
//     }

//     return result
//   }
// }

const runParsers = (sentry = null) => {
  let available = Object.keys(parsers)

  const run = () => {
    const parserName = available.shift()
    if (parserName) {
      const parser = parsers[parserName]

      return downloadPage(parser.url)
        .then(parsePage)
        .then(parser.run(sentry))
        .catch(err => {
          return available.length > 0 ? run() : sentry.captureException(err)
        })
    }
    else {
      return new Promise.reject()
    }
  }

  return run()
}

module.exports = {
  runParsers
}