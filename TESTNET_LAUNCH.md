# Mercenta — минимальный запуск Arc Testnet

## Что реализовано

- Подписанный вход через кошелёк; приватная история по владельцу аккаунта.
- Отдельные показатели: USDC в кошельке, доступный и зарезервированный баланс аккаунта.
- Deposit intent -> прямая Arc-транзакция -> проверка успешного канонического receipt, отправителя, получателя, актива, суммы и двух подтверждений -> неизменяемый журнал.
- Общая защита от повторного использования receipt в пополнениях и старом per-order payment потоке.
- Dashboard: 7/30 дней, all time/custom UTC dates, Shop/Direct Top-Up, top services, recent activity.
- Funds, Orders, Transactions: фильтры, пагинация, CSV.
- API Access: ключ показан один раз, сервер хранит хэш; scopes, срок 1–90 дней, отзыв, last-used.
- Shop: пять институциональных test-продуктов; атомарный резерв/списание; максимум 10 test USDC на заказ; только симулированная поставка.
- Переписанная публичная документация без private supplier/model routing labels.

## Что нужно от владельца проекта

1. Публичный адрес operator-owned Arc Testnet кошелька-получателя. Настроить `MERCHANT_WALLET` в backend environment. Не присылать приватный ключ, seed phrase или provider credentials в чат. Нулевой адрес и self-transfer не допускаются.
2. Кошелёк тестировщика с test USDC, Arc Testnet chain ID 5042002, RPC https://testnet.arc.network. Оставить test USDC на gas.
3. Подтвердить правильное написание домена: проект использует mercenta.xyz; перед публикацией уточнить альтернативное написание mercente.xyz.
4. Хостинг/DNS/TLS для app и docs; приватный backend, persistent SQLite volume, backups, мониторинг и проверенный канал поддержки.

## Локальные процессы

- Web: http://localhost:3011/app
- Docs: http://localhost:3012/docs
- Backend: loopback port 3013
- Web `BACKEND_URL=http://127.0.0.1:3013`; одинаковый сильный `BACKEND_PROXY_SECRET` у web/backend; постоянный сильный `ARC_SESSION_SECRET` у web.
- Backend: `PORT=3013`, `HOST=127.0.0.1`, `ARC_RPC_URL=https://testnet.arc.network`.

## Приёмка реального testnet-пути

Connect wallet -> подписать вход -> Funds -> создать intent -> отправить test USDC -> дождаться >=2 подтверждений -> Verify & credit -> увидеть account balance -> Shop -> подтвердить test order <=10 USDC -> проверить списание, Orders/Transactions и CSV -> проверить API key scope/expiry/revoke.

Unit/integration тесты с синтетическим receipt не заменяют эту проверку настоящей Arc-транзакцией. Никакие synthetic seed funds не начисляются в рабочую базу.

## Не включено

- Cross-chain funding: нужен проверенный CCTP/Bridge или Gateway маршрут и однозначная атрибуция Arc destination receipt аккаунту. Source-chain hash не подходит прямому Arc verifier.
- Onramp funding: Circle onboarding, поддерживаемый network/fiat flow, validated hosted session и достоверное destination settlement. Browser event не является основанием для credit. Не принимать реальные деньги за testnet assets.
- Реальные подарочные коды/Direct Top-Up: test USDC не оплачивает поставщика; до отдельной реальной расчётной модели поставка только simulated.
- Выводы, refund execution, unattended deposit recovery и публичный production SLA.
- Mainnet, реальная доходность Earn и реальные займы Borrow.

## Публикация docs

Локальная сборка не меняет публичный домен. После деплоя удалить/инвалидировать старые CDN/cache outputs. Аудит текущих исходников и bundles не очищает старую историю Git и ранее опубликованные артефакты. Эти поверхности проверяются отдельно.
