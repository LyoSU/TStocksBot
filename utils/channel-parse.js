const tdl = require('axios').default.create({
  baseURL: process.env.WEBTDL_URI,
})


async function tdlSend(method, parm) {
  const result = await tdl.post(`/${method}`, parm)

  return result.data
}


module.exports = async (peer) => {
  await tdlSend('searchPublicChats', {
    query: peer,
  })

  const chat = await tdlSend('searchPublicChat', {
    username: peer,
  })

  const chatInfo = await tdlSend('getSupergroup', {
    supergroup_id: chat.type.supergroup_id,
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

  return { chat, chatInfo, messages }
}
