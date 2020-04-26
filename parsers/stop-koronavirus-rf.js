const URL = 'https://xn--80aesfpebagmfblc0a.xn--p1ai/'

const normalizeNumber = (number) => {
  return parseInt(number.replace(/\D*/g, ''))
}

const validateAll = data => {
  let hasError = false

  const [hasTotalsErr, totals] = validateTotals(data.totals)
  const [hasAreasErr, areas] = validateAreas(data.areas)
  const [hasDigitsErr, digits] = validateDigits(data)

  if ([hasAreasErr, hasDigitsErr, hasTotalsErr].some(v => v)) {
    hasError = true
  }

  return {
    hasError,
    totals,
    areas,
    digits
  }
}

const validateTotals = (totals, err = []) => {
  Object.keys(totals).forEach(key => {
    if (isNaN(totals[key])) {
      err.push(key)
    }
  })

  return [err.length !== 0, err]
}

const validateAreas = (areas) => {
  if (areas.length === 0) {
    return [false, 'no areas parsed!']
  }

  const errors = {}

  areas.forEach(area => {
    const { name, ...toValidate } = area
    const [hasError, err] = validateTotals(toValidate)

    if (hasError) {
      errors[name] = err
    }
  })

  return [Object.keys(errors).length !== 0, errors]
}

const validateDigits = (data) => {
  const checkFields = {
    cases: data.totals.cases,
    recovered: data.totals.recovered,
    deaths: data.totals.deaths
  }

  const resultFields = data.areas.reduce((checker, area) => {
    Object.keys(checker).forEach(field => {
      checker[field] -= area[field]
    })
    return checker
  }, checkFields)

  const isValid = Object.values(resultFields).every(val => val === 0)

  return [!isValid, resultFields]
}

function stop_koronavirus_rf ($, sentry = null) {
  const data = {
    totals: {
      cases: 0,
      casesNew: 0,
      recovered: 0,
      recoveredNew: 0,
      deaths: 0,
      deathsNew: 0,
      daily: 0
    },
    areas: []
  }

  // 1. общие показатели:
  $('.cv-countdown .cv-countdown__item').each((_, item) => {
    const $item = $(item)
    const $el = $item.find('.cv-countdown__item-value span')
    const checker = $item.find('.cv-countdown__item-label').text()

    if (/.*сутки.*/i.test(checker)) {
      data.totals.daily = normalizeNumber($el.text())
    }
    else if (/.*Общее.*/i.test(checker)) {
      data.totals.cases = normalizeNumber($el.text())
    }
    else if (/.*выздоровел.*/i.test(checker)) {
      data.totals.recovered = normalizeNumber($el.text())
    }
    else if (/.*умер.*/i.test(checker)) {
      data.totals.deaths = normalizeNumber($el.text())
    }
  })

  // 2. Общие показатели прироста
  $('.d-map__counter > div').each((_, mapCounter) => {
    const $mapCounter = $(mapCounter)
    const $el = $mapCounter.find('h3 > sup')
    const checker = $mapCounter.find('h3 + span').text()

    if (/.*заболевани.*/i.test(checker)) {
      data.totals.casesNew = normalizeNumber($el.text())
    }
    else if (/.*выздоровел.*/i.test(checker)) {
      data.totals.recoveredNew = normalizeNumber($el.text())
    }
    else if (/.*умер.*/i.test(checker)) {
      data.totals.deathsNew = normalizeNumber($el.text())
    }
  })

  // 3. Области
  $('.d-map__list table tr').each((_, areaTr) => {
    const $areaTr = $(areaTr)
    const areaName = $areaTr.find('th').text().trim()
    const areaObject = {
      name: areaName,
      cases: 0,
      recovered: 0,
      deaths: 0
    }

    $areaTr.find('td').each((_, areaTd) => {
      const $areaTd = $(areaTd)
      const areaNumber = $areaTd.text()

      if ($areaTd.children('.d-map__indicator_sick').length > 0) {
        areaObject.cases = normalizeNumber(areaNumber)
      }
      else if ($areaTd.children('.d-map__indicator_healed').length > 0) {
        areaObject.recovered = normalizeNumber(areaNumber)
      }
      else if ($areaTd.children('.d-map__indicator_die').length > 0) {
        areaObject.deaths = normalizeNumber(areaNumber)
      }
      else {
        console.error('Показатель не распознан!')
      }
    })

    data.areas.push(areaObject)
  })

  const errors = validateAll(data)
console.log(data, errors)
  if (!errors.hasError) {
    return data
  }
  else {
    const errorJSON = JSON.stringify(errors)

    if (sentry) {
      sentry.captureException(new Error(errorJSON))
    }

    return Promise.reject({
      error: true,
      message: errorJSON
    })
  }
}

module.exports = {
  run: sentry => $ => stop_koronavirus_rf($, sentry),
  url: URL
}