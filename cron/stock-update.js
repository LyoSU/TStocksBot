const { CronJob } = require('cron')
const {
  db,
} = require('../database')


db.Stock.update('telegram')

module.exports = () => {
  const job = new CronJob('0 */5 * * * *', (async () => {
    const stocks = await db.Stock.find()

    stocks.forEach(async (stock, index) => {
      console.log(`cron update stock ${stock.username}`)
      await setTimeout(async () => {
        const result = await db.Stock.update(stock.username)

        if (result.status === 'error') console.log(`error: ${result.error}`)
      }, (index * (1000 * 15)))
    })
  }))

  job.start()
}
