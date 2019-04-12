const cronStockUpdate = require('./stock')
const topUpdate = require('./top')


module.exports = async () => {
  cronStockUpdate()
  topUpdate()
}
