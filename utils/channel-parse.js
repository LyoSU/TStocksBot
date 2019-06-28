const parser = require('axios').default.create({
  baseURL: process.env.PARSER_URI,
})


module.exports = async (peer) => {
  const result = await parser.get(`?peer=${peer}`)
  const channel = result.data

  return channel
}
