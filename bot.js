const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

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

// Функция создания реального инвойса в CryptoBot
async function createCryptoInvoice(amountUsd, chatId) {
  try {
    const response = await axios.post(
      'https://pay.crypt.bot/api/createInvoice',
      {
        asset: 'USDT',
        amount: amountUsd.toString(),
        description: 'Оплата аккаунта Roblox в NexusAcc',
        payload: chatId.toString()
      },
      {
        headers: {
          'Crypto-Pay-API-Token': CRYPTO_PAY_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.ok) {
      return {
        payUrl: response.data.result.pay_url,
        invoiceId: response.data.result.invoice_id
      };
    }
  } catch (error) {
    console.error('Ошибка создания инвойса:', error.response?.data || error.message);
  }
  return null;
}

// Функция проверки статуса счета через API CryptoBot
async function checkInvoicePaid(invoiceId) {
  try {
    const response = await axios.post(
      'https://pay.crypt.bot/api/getInvoices',
      { invoice_ids: [invoiceId] },
      {
        headers: {
          'Crypto-Pay-API-Token': CRYPTO_PAY_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.ok && response.data.result.items.length > 0) {
      const invoice = response.data.result.items[0];
      // Возвращает true, если статус 'paid' (оплачено)
      return invoice.status === 'paid';
    }
  } catch (error) {
    console.error('Ошибка проверки статуса счета:', error.response?.data || error.message);
  }
  return false;
}

bot.start(async (ctx) => {
  const startPayload = ctx.text.split(' ')[1]; 

  if (startPayload && startPayload.startsWith('buy')) {
    const parts = startPayload.split('_');
    let usdAmount = 1.00;
    
    if (parts.length >= 3) {
      usdAmount = parseFloat(`${parts[1]}.${parts[2]}`);
    } else if (parts.length === 2 && !isNaN(parts[1])) {
      usdAmount = parseFloat(parts[1]);
    }

    ctx.reply('⏳ Создаем защищенный платежный счет...');

    const invoiceData = await createCryptoInvoice(usdAmount, ctx.chat.id);

    if (invoiceData) {
      const { payUrl, invoiceId } = invoiceData;

      ctx.reply(
        `🛍️ **Счет на оплату создан!**\n\n` +
        `Сумма: <code>$${usdAmount.toFixed(2)} USDT</code>\n\n` +
        `Оплатите счет по кнопке ниже. После перевода нажмите **«Проверить оплату»**.\n` +
        `*(ID счета: ${invoiceId}*)`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.url('💳 Оплатить счет', payUrl)],
            [Markup.button.callback(`🔄 Проверить оплату_${invoiceId}`, `check_${invoiceId}`)]
          ])
        }
      );
    } else {
      ctx.reply('❌ Ошибка связи с платежным шлюзом. Обратитесь к менеджеру: @delentius_dev_manager');
    }

  } else {
    ctx.reply(
      '👋 Привет! Магазин **NexusAcc**.\n\n' +
      'Для покупки используйте сайт.',
      { parse_mode: 'Markdown' }
    );
  }
});

// СТРОГАЯ ПРОВЕРКА ОПЛАТЫ ЧЕРЕЗ API
bot.action(/^check_(.+)$/, async (ctx) => {
  const invoiceId = ctx.match[1];
  await ctx.answerCbQuery('Запрос к CryptoBot...');

  // Реально идем в API CryptoBot и проверяем статус
  const isPaid = await checkInvoicePaid(invoiceId);

  if (isPaid) {
    // Если реально оплачено — отдаем аккаунт
    if (accountsDB.length > 0) {
      const givenAccount = accountsDB.shift();
      await ctx.editMessageText(
        `✅ **Оплата успешно получена!**\n\n` +
        `📦 Ваши данные:\n` +
        `<code>${givenAccount}</code>`,
        { parse_mode: 'HTML' }
      );
    } else {
      await ctx.editMessageText('❌ Оплата прошла, но товар закончился на складе! Напишите администратору.');
    }
  } else {
    // ЕСЛИ НЕ ОПЛАЧЕНО — КАНАЛЬЯ, НИХРЕНА НЕ ВЫДАЕМ
    await ctx.answerCbQuery('❌ Счет еще не оплачен! Переведите средства для получения товара.', { show_alert: true });
  }
});

bot.launch();
console.log('🤖 Бот со строгой проверкой CryptoBot запущен!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));