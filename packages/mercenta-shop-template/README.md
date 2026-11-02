# Mercenta Telegram Storefront Starter

## Что готово

Собственный Telegram-бот с вашим названием и описанием, аккуратными сообщениями в стиле Mercenta, RU/EN, меню команд и кнопками каталога, кошелька, покупок и поддержки. Long polling и SQLite работают на вашем VPS без Redis, webhook, домена для самого бота и платных SDK.

**Это storefront starter, а не готовый независимый платёжный сервис.** По умолчанию покупатель открывает официальный Mini App Mercenta. Оплата, кошелёк и выдача в нём принадлежат Mercenta, а не владельцу этого бота. Шаблон не добавляет вашу наценку, не принимает Stars/криптоплатежи в чате, не закупает товары по merchant API и не гарантирует доход. Старые фиктивные платежи и случайные коды удалены.

Для собственного checkout нужны отдельно подтверждённые merchant API, правила расчётов, проверка оплаты, идемпотентные заказы и выдача. Не включайте приём средств, пока они не подключены и не проверены.

## Быстрый старт без Node.js

Требуется Python 3.10+ с SQLite и интернет-доступ к Telegram. Внешних Python-зависимостей нет.

1. Создайте **собственного** бота через BotFather. Никогда не используйте токен официального бота Mercenta.
2. Скопируйте каталог шаблона или распакуйте `mercenta-shop-template.zip`.
3. Отредактируйте `shop.config.json`: название, описание на двух языках, поддержку и HTTPS URL Mini App.
4. Проверьте конфигурацию и тесты:

```bash
python3 bot.py --config shop.config.json --check
python3 -m unittest discover -p test_bot.py
```

5. Передайте `TELEGRAM_BOT_TOKEN` безопасно через окружение или credential вашего менеджера процессов. `.env.example` содержит только имена переменных и **не загружается автоматически**.
6. Запустите:

```bash
TELEGRAM_STATE_PATH=data/bot.sqlite3 python3 bot.py --config shop.config.json
```

Если у бота установлен webhook, процесс откажется стартовать. Выберите только один транспорт. Шаблон не удаляет webhook самостоятельно.

## Настройка бренда

- `name`: до 80 символов; отображается в сообщениях и меню.
- `tagline.ru`, `tagline.en`: описание магазина, до 240 символов.
- `support`: email или `@telegram_username`, показывается в помощи.
- `miniAppUrl`: HTTPS-адрес вашего приложения либо официальный Mini App. Параметры `lang` и `section` добавляются к нему автоматически.
- `theme`: фирменная палитра для разработчика вашего Mini App. **Обычные Telegram chat-кнопки не поддерживают CSS**; эти цвета не меняют тему клиента Telegram и не перекрашивают чужой сайт.

Сохранена визуальная структура официального бота: один главный переход, два коротких ряда вторичных действий, отдельный экран языка, обновление сообщения вместо лишнего спама. Динамический текст экранируется для Telegram HTML.

Если удобнее интерактивная настройка, установите Node.js 22+:

```bash
npm install
npm run setup
npm run build
npm start
```

Wizard меняет только публичный конфиг, не спрашивает и не сохраняет токен. Для другого имени Python задайте `PYTHON=python3`. Пакет запускается отдельно от основного репозитория.

## VPS и автозапуск

Пример `mercenta-shop.service` запускает отдельного ограниченного пользователя через systemd. Разместите публичные файлы в `/opt/mercenta-shop`, проверьте пути в unit. Для systemd с encrypted credentials:

```bash
sudo install -d -m 700 /etc/credstore.encrypted
read -r -s -p 'Bot token: ' BOT_TOKEN; printf '\n'
printf '%s' "$BOT_TOKEN" | sudo systemd-creds encrypt --with-key=host --name=bot-token - /etc/credstore.encrypted/mercenta-shop-token
unset BOT_TOKEN
sudo chmod 600 /etc/credstore.encrypted/mercenta-shop-token
sudo install -m 644 mercenta-shop.service /etc/systemd/system/mercenta-shop.service
sudo systemctl daemon-reload
sudo systemctl enable --now mercenta-shop
sudo systemctl status mercenta-shop
```

Host-encrypted credentials защищают от случайного чтения, но не от root на сервере. Не вставляйте токен в Git, публичный конфиг, логи или аргументы процесса. Для старого systemd используйте защищённый менеджер секретов процесса; не делайте файл публичным.

## Данные и эксплуатация

SQLite хранит выбранный язык и offset Telegram; приватные ключи и коды товаров не хранятся. Сделайте резервную копию базы через SQLite backup либо остановите службу перед копированием базы с WAL. Не запускайте два polling-процесса с одним токеном. После остановки процесс получает только ещё не подтверждённые обновления.

Telegram не предоставляет exactly-once для sendMessage: авария между отправкой и сохранением offset может повторить сообщение. Шаблон **никогда не списывает деньги**. Ошибки доставки и недоступности логируются без токена и содержимого сообщений.

## English

A standalone, rebrandable Telegram storefront using Python 3.10+, SQLite and long polling. Configure `shop.config.json`, validate with `python3 bot.py --config shop.config.json --check`, provide your own `TELEGRAM_BOT_TOKEN` through the process environment/systemd credential, then run the bot. No third-party Python packages, Redis or paid hosting integration are required; your VPS and Telegram API limits still apply.

This is **not an independent merchant checkout**. Buttons open the configured Mini App; the default is the official Mercenta app. Custom margins, Stars invoices, crypto collection and wholesale procurement are not implemented. Never collect customer funds by treating a callback as payment evidence. No activation codes are fabricated.

RU/EN preferences and update offsets persist in SQLite. Back up your configuration and database. Use one polling process per token, keep credentials out of source control, and test every configured Mini App destination before publishing your bot.
