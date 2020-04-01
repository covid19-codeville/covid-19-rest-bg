const Sentry = require('@sentry/node')
const winston = require('winston')

let logger = null

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT
  })

  logger = Sentry
}
else {
  const winstonLogger = winston.createLogger({
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'combined.log' })
    ]
  })

  logger = {
    captureException: winstonLogger.error.bind(winstonLogger)
  }
}

module.exports = logger
