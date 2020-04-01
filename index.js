require('dotenv').config()

const cron = require('cron')
const { runParser } = require('./util')
const { stop_koronavirus_rf, worldofmeters } = require('./parsers')
const { saveStopKoronavirusRFToDB, saveWorldofmetersToDB } = require('./storage')
const Sentry = require('./logger')

const job = new cron.CronJob('0 */1 * * *', () => {
  runParser(worldofmeters, Sentry)
    .then(saveWorldofmetersToDB(Sentry))
    .catch(Sentry.captureException)

  runParser(stop_koronavirus_rf, Sentry)
    .then(saveStopKoronavirusRFToDB(Sentry))
    .catch(Sentry.captureException)
})

job.start()