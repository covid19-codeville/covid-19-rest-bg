const Redis = require('ioredis')

const db = new Redis(`redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)

module.exports = {
  db
}