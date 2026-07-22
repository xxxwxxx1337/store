const { Telegraf } = require('telegraf');
const axios = require('axios');

// ================= НАСТРОЙКИ =================
const TELEGRAM_TOKEN = '8689398860:AAHkGRmobkHlLc0xd4k0t2v3rIxDNdZRcCg';
const CRYPTO_PAY_TOKEN = '612603:AAhaShJFzW6IWuQ2K4dBGb3MjskEZC0UbVy';

// База аккаунтов (login:pass)
let accountsDB = [
    "user1_blox:password123",
    "user2_adopt:qwerty99",
    "user3_premium:admin321"
];

const bot = new Telegraf(TELEGRAM_TOKEN);
const CRYPTO_API_URL = 'https://pay.crypt.bot/api';

console.log('✅ Бот Delentius Store успешно запущен и ждет заказы...');

// Обработка команды /start с динамической суммой (например: /start buy_15_50)
bot.start(async (ctx) => {
    const payload = ctx.payload; // Получаем то, что передал сайт после start=

    if (payload && payload.startsWith('buy_')) {
        // Достаем сумму из ссылки (превращаем '15_50' в '15.50')
        const amountStr = payload.replace('buy_', '').replace('_', '.');
        const amountToPay = parseFloat(amountStr);

        if (isNaN(amountToPay) || amountToPay <= 0) {
            return ctx.reply("❌ Ошибка: неверная сумма заказа.");
        }

        console.log(`🛒 Новый заказ! Сумма к оплате: ${amountToPay.toFixed(2)} USDT`);
        
        if (accountsDB.length === 0) {
            return ctx.reply("❌ Извини, аккаунты временно закончились. Обратись к администратору.");
        }

        await ctx.reply(`⏳ Генерирую счет на сумму **${amountToPay.toFixed(2)} USDT**...`, { parse_mode: 'Markdown' });

        try {
            // Создаем инвойс в CryptoBot с точной суммой из корзины сайта
            const response = await axios.post(`${CRYPTO_API_URL}/createInvoice`, {
                asset: 'USDT',
                amount: amountToPay.toFixed(2),
                description: 'Покупка Premium Roblox Аккаунтов (login:pass)',
                expires_in: 600 // Счет активен 10 минут
            }, {
                headers: { 'Crypto-Pay-API-Token': CRYPTO_PAY_TOKEN }
            });

            const invoice = response.data.result;
            console.log(`✅ Счет создан! ID инвойса: ${invoice.invoice_id}`);

            // Отправляем клиенту кнопку на оплату
            await ctx.reply(`✅ <b>Счет успешно создан!</b>\n\nСумма к оплате: <b>${amountToPay.toFixed(2)} USDT</b>\nКак только оплатишь, бот автоматически пришлет твои данные.`, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "💳 Оплатить счет", url: invoice.pay_url }]
                    ]
                }
            });

            // Запускаем проверку статуса оплаты
            checkPaymentStatus(ctx, invoice.invoice_id);

        } catch (error) {
            console.log("🚨 ОШИБКА СОЗДАНИЯ СЧЕТА:", error.response ? error.response.data : error.message);
            ctx.reply("❌ Ошибка при создании счета в платежном шлюзе.");
        }
    } else {
        ctx.reply("👋 Привет! Перейди на наш сайт, чтобы собрать корзину и оформить заказ.");
    }
});

// Функция проверки статуса оплаты
function checkPaymentStatus(ctx, invoiceId) {
    let attempts = 0;
    
    const interval = setInterval(async () => {
        attempts++;
        
        try {
            const res = await axios.get(`${CRYPTO_API_URL}/getInvoices?invoice_ids=${invoiceId}`, {
                headers: { 'Crypto-Pay-API-Token': CRYPTO_PAY_TOKEN }
            });

            const invoiceData = res.data.result.items[0];

            if (invoiceData.status === 'paid') {
                clearInterval(interval);
                
                // Забираем аккаунт из базы
                const account = accountsDB.shift(); 
                
                ctx.reply(`🎉 <b>Оплата получена! Успешная сделка.</b>\n\nТвои данные от аккаунта:\n<code>${account}</code>\n\nСпасибо за покупку в Delentius Store!`, { parse_mode: 'HTML' });
            } 
            else if (invoiceData.status === 'expired' || attempts > 120) {
                // Если прошло 10 минут (120 попыток по 5 сек)
                clearInterval(interval);
                ctx.reply("⏰ Время на оплату счета истекло. Если хочешь купить — сформируй новый заказ на сайте.");
            }

        } catch (error) {
            console.error("Ошибка при проверке инвойса:", error.message);
        }
    }, 5000); // Проверка каждые 5 секунд
}

// Запуск бота
bot.launch();
console.log('🤖 Бот работает в фоновом режиме...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));