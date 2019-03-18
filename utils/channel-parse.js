const request = require('request-promise')


module.exports = async (peer) => {
  const parser = await request(`http://sw.lyo.su/channel/?peer=${peer}`)
  const channel = JSON.parse(parser)

  return channel
}
