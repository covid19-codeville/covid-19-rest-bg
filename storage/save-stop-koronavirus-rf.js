const { db } = require('../db')

function saveStopKoronavirusRFToDB (data, sentry = null) {
  if (data.totals && data.areas.length > 0) {
    const updated = Date.now()

    const pipeline = db.pipeline()
    pipeline.zadd('cv19:ru_totals', updated, JSON.stringify({
      ...data.totals,
      updated
    }))
    pipeline.zadd('cv19:ru_areas', updated, JSON.stringify({
      areas: data.areas,
      updated
    }))

    return pipeline.exec()
  }
  else {
    return Promise.reject(`is totals: ${data.totals ? 1 : 0}, areas len: ${data.areas.length}`)
  }
}

module.exports = sentry => data => saveStopKoronavirusRFToDB(data, sentry)