const request = require('request-promise')


module.exports = async (channelId) => {
  const proxy = await request(`http://sw.lyo.su/madeline/?peer=${channelId.toLowerCase()}`)
  const channel = JSON.parse(proxy)
  let totalMessage = 0
  let totalViews = 0

  await channel.forEach((message, i) => {
    if (i > 5) {
      if (message.views) {
        totalMessage++
        totalViews += message.views
      }
    }
  })

  const viewsAvg = totalViews / totalMessage

  return viewsAvg
}
