const request = require('request-promise')
const cheerio = require('cheerio')


module.exports = async (channelId) => {
  const tme = await request(`https://t.me/${channelId}`)
  const body = cheerio.load(tme)
  const members = parseInt(body('.tgme_page_extra').text().replace(/ /g, ''), 10)

  return members
}
