require('dotenv').config()

const cron = require('cron')
const { db } = require('./db')
const { runParsers } = require('./util')
/*
data format:
{
  cases: Number,
  deaths: Number,
  recovered: Number,
  active: {
    cases: Number,
    mild: Number,
    serious: Number
  },
  closed: active,
  countries: [
    {
      country: 'China',
      cases: {
        total: Number,
        new: Number
      }
      deaths: cases,
      recovered: number,
      active: {
        cases: number,
        serious: number
      }
    }
  ]
}
*/

const saveToDB = (data) => {
  return db.zadd(`cv19`, Date.now(), JSON.stringify(data))
}

const job = new cron.CronJob('* * * * *', () => {
  runParsers()
    .then(saveToDB)
    .catch(console.error)
})

job.start()