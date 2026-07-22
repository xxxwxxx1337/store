// ==========================================
        // ЛОГИКА ОПЛАТЫ И МОДАЛЬНОГО ОКНА (ОБНОВЛЕННАЯ)
        // ==========================================
        const modalOverlay = document.getElementById('paymentModal');
        const btnCloseModal = document.getElementById('btnCloseModal');
        const btnAdminTestPay = document.getElementById('btnAdminTestPay');

        // Открытие модального окна при клике "Купить сейчас"
        this.DOM.btnBuyNow.addEventListener('click', () => {
            modalOverlay.classList.add('show');
        });

        // Закрытие крестиком
        btnCloseModal.addEventListener('click', () => {
            modalOverlay.classList.remove('show');
        });

        // Закрытие при клике мимо окна
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('show');
            }
        });

        // Тестовая выдача товара (Для админа)
        btnAdminTestPay.addEventListener('click', () => {
            // Закрываем окно
            modalOverlay.classList.remove('show');
            
            // Запускаем имитацию обработки
            const btn = this.DOM.btnBuyNow;
            btn.textContent = 'Проверка платежа...';
            btn.style.opacity = '0.7';
            btn.disabled = true;

            setTimeout(() => {
                btn.textContent = 'Купить сейчас';
                btn.style.opacity = '1';
                btn.disabled = false;

                const purchase = this.dispenseAccount(); // Забираем 1 аккаунт из базы

                if (purchase.success) {
                    this.DOM.purchasedData.textContent = purchase.data;
                    this.DOM.checkoutResult.style.display = 'block'; // Показываем данные
                    this.showToast('Новая продажа: +150₽', 'success');
                    this.drawChart(); 
                } else {
                    this.showToast(purchase.message, 'error');
                }
            }, 800);
        });
        // ==========================================