require('dotenv').config()

const cron = require('cron')
const { db } = require('./db')
const { runParsers } = require('./util')
const Sentry = require('@sentry/node')

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT
})

const saveToDB = (data) => {
  if (data.active && data.closed && data.countries) {
    const id = Date.now()
    const pipeline = db.pipeline()
    pipeline.zadd('cv19:data', id, JSON.stringify({
      active: data.active,
      closed: data.closed
    }))
    pipeline.zadd('cv19:countries', id, JSON.stringify(data.countries))
    pipeline.exec((err, result) => {
      if (err) {
        console.error(err)
      }
      else {
        result.map(([err, result]) => {
          if (err) {
            console.error(err)
          }
          else {
            console.log(result)
          }
        })
      }
    })
  }
}

const job = new cron.CronJob('0 */2 * * *', () => {
  runParsers(Sentry)
    .then(saveToDB)
    .catch(console.error)
})

job.start()