const path = require('path')
const Telegraf = require('telegraf')
const Redis = require('ioredis')
const RedisSession = require('telegraf-session-redis')
const rateLimit = require('telegraf-ratelimit')
const I18n = require('telegraf-i18n')
const {
  db,
} = require('./database')
const {
  userUpdate,
} = require('./middlewares')
const {
  handleHelp,
  handleProfile,
  handleStock,
  handleChannels,
  handlePortfolio,
  handleTop,
} = require('./handlers')
const cron = require('./cron')


const {
  match,
} = I18n

global.gameConfig = {
  sellFee: 0.25,
}

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

const redis = new Redis({ keyPrefix: `${process.env.REDIS_PREFIX}:` })

const session = new RedisSession({
  store: {
    prefix: `${process.env.REDIS_PREFIX}:session:`,
  },
})

bot.use(session)

bot.context.redis = redis
bot.context.db = db

const i18n = new I18n({
  directory: path.resolve(__dirname, 'locales'),
  defaultLanguage: 'ru',
})

bot.use(i18n.middleware())

const moneyLimitConfig = rateLimit({
  window: 1000,
  limit: 1,
})

bot.use(async (ctx, next) => {
  ctx.ms = new Date()
  await userUpdate(ctx)
  await next(ctx)
  const ms = new Date() - ctx.ms

  console.log('Response time %sms', ms)
})

bot.hears(['/profile', match('profile.btn.profile')], handleProfile)
bot.hears((['/portfolio', match('profile.btn.portfolio')]), handlePortfolio)
bot.hears(['/channels', match('profile.btn.channels')], handleChannels)
bot.hears((['/top', match('profile.btn.top')]), handleTop)

bot.hears(/(?:\$(\w{2,32})|(?:(?:t\.me)\/|(\/s_|@))(\w{2,32}))/, handleStock)

bot.action(/stock:(.*)/, rateLimit(moneyLimitConfig), handleStock)

bot.on('text', handleHelp)

bot.catch((error) => {
  console.log('Ooops', error)
})

bot.launch()

console.log('bot start')

cron()
