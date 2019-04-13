const { CronJob } = require('cron')
const Redis = require('ioredis')
const {
  db,
} = require('../database')
const {
  userName,
} = require.main.require('./utils')

const redis = new Redis({ keyPrefix: `${process.env.REDIS_PREFIX}:` })

module.exports = async () => {
  const job = new CronJob('0 */1 * * * *', (async () => {
    const topUser = []
    const allUser = await db.User.find()

    for (let index = 0; index < allUser.length; index++) {
      const user = allUser[index]
      const portfolioValue = await db.Portfolio.getValue(user)

      topUser.push({
        id: user.id,
        name: userName(user),
        capital: user.balance + portfolioValue.cost,
      })
    }

    topUser.sort((a, b) => b.capital - a.capital)

    redis.set('topUser', JSON.stringify(topUser.slice(0, 10)))
  }))

  job.start()
}
