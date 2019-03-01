const request = require('request-promise')


module.exports = async (username) => {
  const tgstat = await request(`${process.env.TGSTAT_URI}/channels/stat?channelId=${username}&token=${process.env.TGSTAT_TOKEN}`, { json: true })

  if (tgstat.status === 'ok') {
    const channel = tgstat.response

    return channel
  }
  else if (tgstat.error === 'channel_not_found') {
    return { status: 'error', error: 'stock not found' }
  }
  else if (tgstat.error) {
    return { status: 'error', error: tgstat.error }
  }

  return { status: 'error', error: 'error' }
}
