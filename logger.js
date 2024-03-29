const Sentry = require('@sentry/node')
const winston = require('winston')

let logger = null

// if (process.env.NODE_ENV !== 'development') {
//   Sentry.init({
//     dsn: process.env.SENTRY_DSN,
//     environment: process.env.SENTRY_ENVIRONMENT
//   })

//   logger = Sentry
// }
// else {
  const winstonLogger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'DD.MM.YYYY HH:mm:ss'
      }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: 'combined.log' })
    ]
  })

  logger = {
    captureException: (err) => {
      if (err instanceof Error) {
        winstonLogger.error(err.message)
      }
      else {
        winstonLogger.error(err)
      }
    }
  }
// }

module.exports = logger
