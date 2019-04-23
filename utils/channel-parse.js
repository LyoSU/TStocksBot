const tdl = require('axios').default.create({
  baseURL: process.env.WEBTDL_URI,
})


async function tdlSend(method, parm) {
  const result = await tdl.post(`/${method}`, parm)

  return result.data
}


module.exports = async (peer) => {
  const start = Date.now()

  const chat = await tdlSend('searchPublicChat', {
    username: peer,
  })

  let messages = []
  let fromMessageId = 0
  let left = 100

  while (left > 0) {
    const history = await tdlSend('getChatHistory', {
      chat_id: chat.id,
      from_message_id: fromMessageId,
      offset: 0,
      limit: 100,
    })

    if (history.messages.length === 0) break

    fromMessageId = history.messages[0].id
    left -= history.total_count

    messages = messages.concat(history.messages)
  }

  console.log(messages)

  console.log('Время выполнения = ', Date.now() - start);

  return { chat, messages }
}
