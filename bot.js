require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Welcome to the *BESCswap Bug Report Bot*!

BESCswap is a full-featured DEX, and we’re grateful you're helping improve it.

Please describe the issue you found — include:
• What feature/page it affects (e.g. Swap, LPs, Lottery, Farm)
• What the problem is
• What device/browser you used (if relevant)

You can just reply below to begin.`
  , { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Ignore commands or non-private chats
  if (msg.text && msg.text.startsWith('/')) return;
  if (msg.chat.type !== 'private') return;

  const report = `
*New BESCswap Bug Report*

From: [${msg.from.first_name || 'User'}](tg://user?id=${msg.from.id})
Username: @${msg.from.username || 'N/A'}

*Report:*
${msg.text}
`;

  bot.sendMessage(REPORT_CHANNEL_ID, report, { parse_mode: 'Markdown' });
  bot.sendMessage(chatId, "✅ Bug submitted. Thank you for helping improve BESCswap.");
});
