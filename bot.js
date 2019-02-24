const Telegraf = require('telegraf')


const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('text', (ctx) => ctx.reply('Hello'))

bot.launch()
