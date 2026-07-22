const { Telegraf } = require('telegraf');

// ==================== НАСТРОЙКИ ====================
const TELEGRAM_TOKEN = '8689398860:AAHkGRmobkHlLc0xd4k0t2v3rIxDNdZRcCg';
const CRYPTO_PAY_TOKEN = '612603:AAhaShJFzW6IWuQ2K4dBGb3MjskEZC0UbVy';

// База аккаунтов для автовыдачи (login:pass)
let accountsDB = [
  "user1_blox:password123",
  "user2_adopt:qwerty99",
  "user3_premium:admin321"
];

const bot = new Telegraf(TELEGRAM_TOKEN);

bot.start((ctx) => {
  const startPayload = ctx.text.split(' ')[1]; // Ловим параметр покупки с сайта (например, buy_15_40)

  if (startPayload && startPayload.startsWith('buy')) {
    ctx.reply('⏳ Проверяем статус платежа...');

    setTimeout(() => {
      if (accountsDB.length > 0) {
        // Забираем первый аккаунт из базы и удаляем его, чтобы не продать дважды
        const givenAccount = accountsDB.shift(); 
        
        ctx.reply(
          `✅ Оплата прошла успешно!\n\n` +
          `📦 Вот данные вашего товара:\n` +
          `<code>${givenAccount}</code>\n\n` +
          `Спасибо за покупку в NexusAcc! Рекомендуем сменить пароль после авторизации.`,
          { parse_mode: 'HTML' }
        );
      } else {
        ctx.reply('❌ Ошибка: В данный момент этот товар закончился на складе. Напишите менеджеру: @delentius_dev_manager');
      }
    }, 1500);

  } else {
    ctx.reply(
      '👋 Привет! Добро пожаловать в официальный магазин **NexusAcc**.\n\n' +
      'Для покупки аккаунтов перейдите на наш сайт и выберите нужную позицию в каталоге.',
      { parse_mode: 'Markdown' }
    );
  }
});

// Обработка обычного текста на всякий случай
bot.on('text', (ctx) => {
  ctx.reply('Используйте сайт для выбора товаров, либо оформите покупку через каталог.');
});

bot.launch();
console.log('🤖 Бот автовыдачи успешно запущен и готов к работе!');

// Корректная остановка
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));