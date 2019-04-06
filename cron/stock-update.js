const { CronJob } = require('cron')
const {
  db,
} = require('../database')


db.Stock.update('telegram')

module.exports = () => {
  const job = new CronJob('0 * * * * *', (async () => {
    const stocks = await db.Stock.find()

    stocks.forEach(async (stock, index) => {
      console.log(`cron update stock ${stock.username}`)
      await setTimeout(async () => {
        db.Stock.update(stock.username)
      }, (index * 500))
    })
  }))

  job.start()
}
