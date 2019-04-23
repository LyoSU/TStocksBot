const { CronJob } = require('cron')
const {
  db,
} = require('../database')


db.Stock.update('telegram')

module.exports = async () => {
  const job = new CronJob('0 */1 * * * *', (async () => {
    const stocks = await db.Stock.find({ updatable: true })

    for (let index = 0; index < stocks.length; index++) {
      const stock = stocks[index]

      await setTimeout(async () => {
        console.log(`cron update stock ${stock.username}`)
        db.Stock.update(stock.username)
      }, (1000 * 10))
    }
  }))

  job.start()
}
