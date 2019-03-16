const { CronJob } = require('cron')
const {
  Stock,
} = require('../database/models/')


module.exports = () => {
  const job = new CronJob('0 */5 * * * *', (async () => {
    const stocks = await Stock.find()

    stocks.forEach(async (stock, index) => {
      console.log(`cron update stock ${stock.username}`)
      await setTimeout(async () => {
        const result = await Stock.update(stock.username)

        if (result.status === 'error') console.log(`error: ${result.error}`)
      }, index * 3000)
    })
  }))

  job.start()
}
