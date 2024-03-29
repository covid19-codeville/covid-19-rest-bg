const URL = 'https://www.worldometers.info/coronavirus/'

const TOTAL_FIELD_NAME = 'Total:'

const COUNTRY_TABLE_SELECTOR = '#main_table_countries_today'

const COUNTRY_TABLE_COLUMNS = [
  {
    key: 'country',
    checker: 'Country'
  },
  {
    key: 'casesTotal',
    checker: 'Total.*Cases',
    type: Number
  },
  {
    key: 'casesNew',
    checker: 'New.*Cases',
    type: Number
  },
  {
    key: 'deathsTotal',
    checker: 'Total.*Deaths',
    type: Number
  },
  {
    key: 'deathsNew',
    checker: 'New.*Deaths',
    type: Number
  },
  {
    key: 'recoveredTotal',
    checker: 'Total.*Recovered',
    type: Number
  },
  {
    key: 'activeCases',
    checker: 'Active.*Cases',
    type: Number
  },
  {
    key: 'activeSerious',
    checker: 'Serious.*Critical',
    type: Number
  }
]

const normalizeWorldOfMetersNumber = (number) => {
  return parseInt(number.replace(/\D*/g, ''))
}

const worldometers = ($, sentry = null) => {
  const data = {
    active: {
      cases: NaN,
      mild: NaN,
      serious: NaN
    },
    closed: {
      cases: NaN,
      deaths: NaN,
      recovered: NaN
    },
    countries: []
  }

  // 1: показатели из виджетов
  $('.panel.panel-default').each((_, panel) => {
    const $panel = $(panel)
    const $el = $panel.find('.number-table-main')
    const title = $panel.find('.panel-title').text()

    if (/Active Cases/i.test(title)) {
      data.active.cases = normalizeWorldOfMetersNumber($el.text())
    }
    else if (/Closed Cases/i.test(title)) {
      data.closed.cases = normalizeWorldOfMetersNumber($el.text())
    }

    $panel.find('.panel_flip .number-table').each((_, elem) => {
      const checker = $(elem).closest('div').text()
      const $el = $(elem)

      if (/in Mild*/i.test(checker)) {
        data.active.mild = normalizeWorldOfMetersNumber($el.text())
      }
      else if (/Serious*/i.test(checker)) {
        data.active.serious = normalizeWorldOfMetersNumber($el.text())
      }
      else if (/Recovered*/i.test(checker)) {
        data.closed.recovered = normalizeWorldOfMetersNumber($el.text())
      }
      else if (/Deaths*/i.test(checker)) {
        data.closed.deaths = normalizeWorldOfMetersNumber($el.text())
      }
    })
  })

  const tableTitles = []
  const tableData = []
  // 2: Показатели по странам
  const tableEl = $(COUNTRY_TABLE_SELECTOR)
  let rowCountChecker = 0

  if (tableEl.length > 0) {
    tableEl.find('thead th').each((index, th) => {
      const $th = $(th).text()

      if (index < COUNTRY_TABLE_COLUMNS.length - 1) {
        const checker = new RegExp(COUNTRY_TABLE_COLUMNS[index].checker)
        if (checker.test($th)) {
          tableTitles.push($th)
        }
      }
    })

    // все колонки на месте
    tableEl.find('tbody tr').each((_, tr) => {
      const $tr = $(tr)
      const countryData = {}
      rowCountChecker++

      $tr.find('td').each((index, td) => {
        const $td = $(td)

        if (index < COUNTRY_TABLE_COLUMNS.length - 1) {
          const key = COUNTRY_TABLE_COLUMNS[index].key
          switch (COUNTRY_TABLE_COLUMNS[index].type) {
            case Number:
              countryData[key] = normalizeWorldOfMetersNumber($td.text()) || 0
              break
            default:
              countryData[key] = $td.text().replace(/^\s+(.*)\s+$/, '$1')
              break
          }
        }
      })

      // нам не нужны данные из total
      if (countryData[COUNTRY_TABLE_COLUMNS[0].key].localeCompare(TOTAL_FIELD_NAME) !== 0) {
        // валидируем данные по стране
        const total = countryData['casesTotal']
        const checkTotal = ['deathsTotal', 'recoveredTotal', 'activeCases'].reduce((prev, key) => prev + countryData[key], 0)

        if (total === checkTotal) {
          tableData.push(countryData)
        }
        else {
          sentry.captureException(new Error(`Country ${countryData.country} contains wrong data!`))
          rowCountChecker--
        }
      }
      else {
        rowCountChecker--
      }
    })
  }
  else if (sentry) {
    sentry.captureException(new Error('Cities table not found! Please check markup and update selectors!'))
  }

  data.countries = tableData

  // validate results:
  const isValid = [
    (data.active.cases === data.active.mild + data.active.serious),
    (data.closed.cases === data.closed.recovered + data.closed.deaths),
    data.countries.length === rowCountChecker
  ]

  if (isValid.every(elem => elem)) {
    return data
  }
  else {
    if (sentry) {
      const err = JSON.stringify({
        ...['ActiveCases', 'ClosedCases', 'CountriesLength'].map((name, index) => ({
          [name]: isValid[index]
        })),
        active: data.active,
        closed: data.closed,
        countriesLen: data.countries.length,
        countriesCntr: rowCountChecker
      })
      sentry.captureException(new Error(err))
    }
    return Promise.reject({
      error: true,
      message: 'Not equal!'
    })
  }
}

module.exports = {
  run: sentry => $ => worldometers($, sentry),
  url: URL
}