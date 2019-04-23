const parser = require('axios').default.create({
  baseURL: 'https://sw.lyo.su/channel',
})


module.exports = async (peer) => {
  const result = await parser.get(`?peer=${peer}`)
  const channel = result.data

  return channel
}
