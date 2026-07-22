const { Telegraf } = require('telegraf');
const axios = require('axios');

// ==================== НАСТРОЙКИ ====================
const TELEGRAM_TOKEN = '8689398860:AAHkGRmobkHlLc0xd4k0t2v3rIxDNdZRcCg';
const CRYPTO_PAY_TOKEN = '612603:AAhaShJFzW6IWuQ2K4dBGb3MjskEZC0UbVy';

// База аккаунтов (login:pass)
let accountsDB = [
  "user1_blox:password123",
  "user2_adopt:qwerty99",
  "user3_premium:admin321"
];

const bot = new Telegraf(TELEGRAM_TOKEN);

bot.start((ctx) => {
  ctx.reply('Привет! Бот успешно запущен и работает локально.');
});

// Обработка текстовых сообщений
bot.on('text', (ctx) => {
  ctx.reply(`Ты написал: ${ctx.message.text}`);
});

bot.launch();
console.log('Бот запущен!');

// Корреая остановка
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));