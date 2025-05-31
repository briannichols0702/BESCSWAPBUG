require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;

const bot = new TelegramBot(token, { polling: true });

// Start command
bot.onText(/\/start/, (msg) => {
  const startMessage = `🚨 *BESCswap & BESCbridge Bug Report Bot* 🚨

Please report all issues directly here.

When submitting a report, include:

• Your wallet address
• Transaction hash (TXN)
• If it's a Solana → VSC bridge issue:
  - Solana wallet address
  - Transaction hash
  - Amount sent
  - VSC wallet address to receive BUSDC
• Any error codes or messages (if applicable)

Providing full info helps us resolve your issue quickly.

👇 Please select which area your issue relates to:`;

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🟣 BESCSWAP', callback_data: 'swap_issue' }],
        [{ text: '🟠 BESCbridge', callback_data: 'bridge_issue' }],
        [{ text: '🔧 Other', callback_data: 'other_issue' }],
      ]
    }
  };

  bot.sendMessage(msg.chat.id, startMessage, options);
});

// Handle button clicks
bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const selection = callbackQuery.data;

  let responseText = "";

  if (selection === 'swap_issue') responseText = "You selected *BESCSWAP*. Please describe your issue below:";
  if (selection === 'bridge_issue') responseText = "You selected *BESCbridge*. Please describe your issue below:";
  if (selection === 'other_issue') responseText = "You selected *Other*. Please describe your issue below:";

  bot.sendMessage(msg.chat.id, responseText, { parse_mode: 'Markdown' });
  bot.answerCallbackQuery(callbackQuery.id);
});

// Handle reports (text and photo support)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Ignore command triggers
  if (msg.text && msg.text.startsWith('/')) return;

  let report = `📝 *New BESC Report*\n\n`;
  report += `👤 From: [${msg.from.first_name || 'User'}](tg://user?id=${msg.from.id})\n`;
  report += `Username: @${msg.from.username || 'N/A'}\n\n`;

  if (msg.text) {
    report += `*Report:*\n${msg.text}`;
  }

  if (msg.photo) {
    // Handle photo attachments
    const photoId = msg.photo[msg.photo.length - 1].file_id;
    bot.sendPhoto(REPORT_CHANNEL_ID, photoId, {
      caption: report,
      parse_mode: 'Markdown'
    });
  } else {
    bot.sendMessage(REPORT_CHANNEL_ID, report, { parse_mode: 'Markdown' });
  }

  bot.sendMessage(chatId, "✅ Report submitted. Thank you for your help.");
});
