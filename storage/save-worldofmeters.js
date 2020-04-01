const { db } = require('../db')

function saveWorldofmetersToDB (data, sentry) {
  if (data.active && data.closed && data.countries) {
    const updated = Date.now()

    const pipeline = db.pipeline()
    pipeline.zadd('cv19:data', updated, JSON.stringify({
      active: data.active,
      closed: data.closed,
      updated
    }))
    pipeline.zadd('cv19:countries', updated, JSON.stringify({
      countries: data.countries,
      updated
    }))

    return pipeline.exec()
  }
  else {
    return Promise.reject(`data.active: ${data.active ? 1 : 0}, data.closed: ${data.closed ? 1 : 0}, countries len: ${data.countries.length}`)
  }
}

module.exports = sentry => data => saveWorldofmetersToDB(data, sentry)