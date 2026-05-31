require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const REPORT_CHANNEL_ID = process.env.REPORT_CHANNEL_ID;

if (!BOT_TOKEN) throw new Error('Missing BOT_TOKEN');
if (!REPORT_CHANNEL_ID) throw new Error('Missing REPORT_CHANNEL_ID');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const BOT_NAME = 'BESC ECO Bug Bot';
const userSessions = new Map();

function escapeMd(text = '') {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

function nowUtc() {
  return new Date().toISOString();
}

const categories = {
  swap_issue: {
    title: 'BESCSWAP',
    emoji: '🟣',
    prompt: `Please provide:
• Wallet address
• Token pair
• Amount
• Transaction hash
• Error message
• Screenshot or screen recording`,
  },
  bridge_bsc_wbnb: {
    title: 'BSC WBNB ↔ BESC Hyper Chain WBNB',
    emoji: '🟡',
    prompt: `Please provide:
• Direction: BSC → BESC or BESC → BSC
• BSC wallet address
• BESC Hyper Chain wallet address
• Transaction hash
• Amount of WBNB
• Time submitted
• Screenshot if available`,
  },
  bridge_xrp_wxrp: {
    title: 'XRP ↔ BESC Hyper Chain WXRP',
    emoji: '🔵',
    prompt: `Please provide:
• Direction: XRP → BESC or BESC → XRP
• XRP wallet address
• BESC Hyper Chain wallet address
• XRP transaction hash
• Destination tag, if used
• Amount of XRP / WXRP
• Screenshot if available`,
  },
  bridge_solana_wsol: {
    title: 'Solana ↔ BESC Hyper Chain WSOL',
    emoji: '🟢',
    prompt: `Please provide:
• Direction: Solana → BESC or BESC → Solana
• Solana wallet address
• BESC Hyper Chain wallet address
• Solana transaction signature
• Amount of SOL / WSOL
• Screenshot if available`,
  },
  bridge_other: {
    title: 'Other BESCbridge Issue',
    emoji: '🌉',
    prompt: `Please provide:
• Source chain
• Destination chain
• Sending wallet
• Receiving wallet
• Asset
• Amount
• Transaction hash
• Error message
• Screenshot if available`,
  },
  other_issue: {
    title: 'Other Issue',
    emoji: '🔧',
    prompt: `Please describe the issue clearly and include:
• Wallet address
• Transaction hash, if relevant
• Device/browser
• Error message
• Screenshot if available`,
  },
};

bot.onText(/\/start/, async (msg) => {
  userSessions.delete(msg.chat.id);

  const text = `🚨 *${BOT_NAME}* 🚨

Official BESC issue reporting assistant.

Use this bot for:
• Bridge delays
• Failed or stuck transactions
• Missing wrapped assets
• Swap errors
• Wallet or UI issues
• Incorrect balances
• Screenshots or proof submission

Supported bridge routes:
• BSC WBNB ↔ BESC Hyper Chain WBNB
• XRP ↔ BESC Hyper Chain WXRP
• Solana ↔ BESC Hyper Chain WSOL

Select the exact product area below.`;

  await bot.sendMessage(msg.chat.id, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🟣 BESCSWAP', callback_data: 'swap_issue' }],
        [{ text: '🟡 BSC WBNB ↔ BESC Hyper', callback_data: 'bridge_bsc_wbnb' }],
        [{ text: '🔵 XRP ↔ BESC Hyper WXRP', callback_data: 'bridge_xrp_wxrp' }],
        [{ text: '🟢 Solana ↔ BESC Hyper WSOL', callback_data: 'bridge_solana_wsol' }],
        [{ text: '🌉 Other Bridge Issue', callback_data: 'bridge_other' }],
        [{ text: '🔧 Other Issue', callback_data: 'other_issue' }],
      ],
    },
  });
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const category = categories[query.data];

  if (!category) {
    await bot.answerCallbackQuery(query.id);
    return;
  }

  userSessions.set(chatId, {
    categoryKey: query.data,
    categoryTitle: category.title,
    selectedAt: nowUtc(),
  });

  await bot.sendMessage(
    chatId,
    `${category.emoji} *${category.title}*

${category.prompt}

You can send text, screenshots, documents, or videos.`,
    { parse_mode: 'Markdown' }
  );

  await bot.answerCallbackQuery(query.id, {
    text: `${category.title} selected`,
  });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text?.startsWith('/')) return;

  const session = userSessions.get(chatId);
  const categoryTitle = session?.categoryTitle || 'Uncategorized Report';

  const fromName = escapeMd(
    [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ') || 'User'
  );

  const username = msg.from.username ? `@${escapeMd(msg.from.username)}` : 'N/A';

  let report = `🚨 *New BESC exo Bug Report*

*Category:* ${escapeMd(categoryTitle)}
*Submitted:* \`${nowUtc()}\`

*User:*
[${fromName}](tg://user?id=${msg.from.id})
Username: ${username}
Telegram ID: \`${msg.from.id}\`
Chat ID: \`${chatId}\`

`;

  if (msg.text) {
    report += `*Report Details:*
${escapeMd(msg.text)}`;
  } else if (msg.caption) {
    report += `*Caption:*
${escapeMd(msg.caption)}`;
  } else {
    report += `_Attachment submitted without written details._`;
  }

  try {
    if (msg.photo) {
      await bot.sendPhoto(REPORT_CHANNEL_ID, msg.photo.at(-1).file_id, {
        caption: report,
        parse_mode: 'Markdown',
      });
    } else if (msg.document) {
      await bot.sendDocument(REPORT_CHANNEL_ID, msg.document.file_id, {
        caption: report,
        parse_mode: 'Markdown',
      });
    } else if (msg.video) {
      await bot.sendVideo(REPORT_CHANNEL_ID, msg.video.file_id, {
        caption: report,
        parse_mode: 'Markdown',
      });
    } else {
      await bot.sendMessage(REPORT_CHANNEL_ID, report, {
        parse_mode: 'Markdown',
      });
    }

    await bot.sendMessage(
      chatId,
      `✅ Your report has been submitted.

BESC support has received your ${categoryTitle} issue. Please keep this chat available in case more information is needed.`
    );
  } catch (err) {
    console.error('Failed to forward report:', err);

    await bot.sendMessage(
      chatId,
      '❌ Report submission failed. Please try again or contact BESC support directly.'
    );
  }
});
