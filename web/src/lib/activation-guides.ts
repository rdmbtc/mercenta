/**
 * Mercenta Institutional Activation Guides
 * Deterministic redemption and activation instructions for all product classes and brands.
 * Strictly compliant with Rule 5 (no upstream vendor names ever disclosed).
 */

export interface ActivationGuide {
  brand: string;
  category: string;
  titleEn: string;
  titleRu: string;
  stepsEn: string[];
  stepsRu: string[];
  redeemUrl?: string;
  noteEn?: string;
  noteRu?: string;
}

export const ACTIVATION_GUIDES: Record<string, ActivationGuide> = {
  steam: {
    brand: 'Valve / Steam',
    category: 'Gaming Keys & Platform Vouchers',
    titleEn: 'Steam Wallet & Game Activation Guide',
    titleRu: 'Инструкция по активации Steam',
    redeemUrl: 'https://store.steampowered.com/account/registerkey',
    stepsEn: [
      'Open the Steam desktop client or visit store.steampowered.com/account/registerkey.',
      'Sign in to your Steam account.',
      'Enter the delivered digital code into the "Product Code" field and click Continue.',
      'Funds or games are instantly bound to your Steam library/wallet.',
    ],
    stepsRu: [
      'Откройте клиент Steam на ПК или перейдите на store.steampowered.com/account/registerkey.',
      'Войдите в свой аккаунт Steam.',
      'Введите полученный цифровой код в поле «Ключ продукта» и нажмите «Продолжить».',
      'Средства или игра будут мгновенно зачислены в вашу библиотеку или на баланс Steam Wallet.',
    ],
    noteEn: 'Make sure your Steam account currency/region matches the voucher region (e.g., US / Global).',
    noteRu: 'Убедитесь, что регион/валюта аккаунта Steam соответствуют региону ваучера (например, US / Global).',
  },

  playstation: {
    brand: 'Sony PlayStation',
    category: 'Gaming Keys & Platform Vouchers',
    titleEn: 'PlayStation Network Voucher Activation Guide',
    titleRu: 'Инструкция по активации PlayStation Network',
    redeemUrl: 'https://store.playstation.com',
    stepsEn: [
      'Open PlayStation Store on your PS5/PS4 console or visit store.playstation.com in your browser.',
      'Sign in with your PlayStation Network ID.',
      'Click your profile avatar at the top and select "Redeem Code".',
      'Enter the 12-digit digital voucher code and select "Redeem".',
    ],
    stepsRu: [
      'Откройте PlayStation Store на PS5/PS4 или перейдите на store.playstation.com в браузере.',
      'Войдите в свой аккаунт PlayStation Network.',
      'Нажмите на аватар профиля вверху экрана и выберите «Погашение кодов» (Redeem Code).',
      'Введите 12-значный цифровой код ваучера и подтвердите активацию.',
    ],
    noteEn: 'PSN voucher codes are strictly region-locked. Redeem on an account matching the voucher country.',
    noteRu: 'Коды PSN имеют строгую региональную привязку. Активируйте на аккаунте нужного региона.',
  },

  xbox: {
    brand: 'Microsoft Xbox',
    category: 'Gaming Keys & Platform Vouchers',
    titleEn: 'Microsoft / Xbox Digital Code Activation Guide',
    titleRu: 'Инструкция по активации Xbox / Microsoft',
    redeemUrl: 'https://redeem.microsoft.com',
    stepsEn: [
      'Go to redeem.microsoft.com or open the Store on your Xbox console.',
      'Sign in with your Microsoft / Xbox account.',
      'Enter the 25-character digital code (format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX).',
      'Click Next and confirm to activate your game, add-on, or Game Pass subscription.',
    ],
    stepsRu: [
      'Перейдите на redeem.microsoft.com или откройте Microsoft Store на консоли Xbox.',
      'Войдите в свою учетную запись Microsoft / Xbox.',
      'Введите 25-значный цифровой код (формат: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX).',
      'Нажмите «Далее» и подтвердите активацию игры, дополнения или подписки Game Pass.',
    ],
    noteEn: 'Applies to Microsoft Flight Simulator 2024, Xbox Game Pass, and Windows digital titles.',
    noteRu: 'Применяется для Microsoft Flight Simulator 2024, Xbox Game Pass и цифровых ключей Windows.',
  },

  roblox: {
    brand: 'Roblox Corporation',
    category: 'Gaming Keys & Platform Vouchers',
    titleEn: 'Roblox Gift Card & Robux Activation Guide',
    titleRu: 'Инструкция по активации Roblox',
    redeemUrl: 'https://www.roblox.com/redeem',
    stepsEn: [
      'Visit roblox.com/redeem in your browser.',
      'Log into your Roblox account.',
      'Enter the digital PIN code into the box and click "Redeem".',
      'Your Robux balance or virtual item will be credited immediately to your inventory.',
    ],
    stepsRu: [
      'Перейдите на roblox.com/redeem в браузере.',
      'Войдите в свой аккаунт Roblox.',
      'Введите цифровой PIN-код в поле ввода и нажмите «Активировать» (Redeem).',
      'Баланс Robux или виртуальный предмет мгновенно зачислятся на ваш аккаунт.',
    ],
  },

  valorant: {
    brand: 'Riot Games',
    category: 'Gaming Keys & Platform Vouchers',
    titleEn: 'Valorant Riot Points (VP) Activation Guide',
    titleRu: 'Инструкция по активации Valorant VP',
    redeemUrl: 'https://riotgames.com',
    stepsEn: [
      'Launch Valorant and log in with your Riot Games account.',
      'Click the Valorant Points (VP) icon located in the upper right next to the Store tab.',
      'Select "Prepaid Cards & Codes" as payment method.',
      'Enter your digital code and click "Submit". VP will be added immediately.',
    ],
    stepsRu: [
      'Запустите клиент Valorant и войдите в учетную запись Riot Games.',
      'Нажмите на значок Valorant Points (VP) в правом верхнем углу рядом с вкладкой «Магазин».',
      'Выберите способ оплаты «Предоплаченные карты и коды».',
      'Введите полученный цифровой код и нажмите «Отправить». VP начислятся мгновенно.',
    ],
    noteEn: 'Ensure your Riot Games client region matches the voucher territory.',
    noteRu: 'Убедитесь, что регион учетной записи Riot Games соответствует региону ваучера.',
  },

  nintendo: {
    brand: 'Nintendo',
    category: 'Gaming Keys & Platform Vouchers',
    titleEn: 'Nintendo eShop Digital Card Activation Guide',
    titleRu: 'Инструкция по активации Nintendo eShop',
    redeemUrl: 'https://ec.nintendo.com/redeem',
    stepsEn: [
      'Open the Nintendo eShop on your Nintendo Switch console or visit ec.nintendo.com/redeem in your browser.',
      'Sign in to your Nintendo Account.',
      'Select "Enter Code" (or Redeem Code) from the menu.',
      'Enter the 16-character alphanumeric download code and confirm activation.',
    ],
    stepsRu: [
      'Откройте Nintendo eShop на консоли Nintendo Switch или перейдите на ec.nintendo.com/redeem.',
      'Войдите в свою учетную запись Nintendo Account.',
      'Выберите пункт «Ввести код» (Redeem Code) в левом меню.',
      'Введите 16-значный код загрузки и подтвердите получение средств.',
    ],
    noteEn: 'Make sure your Nintendo Account country setting matches the currency of the eShop card.',
    noteRu: 'Убедитесь, что страна в настройках Nintendo Account совпадает с регионом карты eShop.',
  },

  battlenet: {
    brand: 'Blizzard / Battle.net',
    category: 'Gaming Keys & Platform Vouchers',
    titleEn: 'Blizzard Battle.net Code Activation Guide',
    titleRu: 'Инструкция по активации Blizzard Battle.net',
    redeemUrl: 'https://battle.net/redeem',
    stepsEn: [
      'Log in to account.battle.net or open the Battle.net desktop application.',
      'Go to the Account Overview tab or click Redeem a Code.',
      'Enter the digital code into the "Redeem a Code" box and click Continue.',
      'Your Battle.net balance, game time, or digital goods will be credited immediately.',
    ],
    stepsRu: [
      'Войдите на account.battle.net или откройте приложение Battle.net на компьютере.',
      'Перейдите в раздел «Обзор учетной записи» и найдите «Использовать код».',
      'Введите цифровой код в соответствующее поле и нажмите «Использовать код».',
      'Средства кошелька, игровое время или игра будут зачислены мгновенно.',
    ],
    noteEn: 'Battle.net codes are currency and region specific.',
    noteRu: 'Коды Battle.net привязаны к валюте и региону учетной записи.',
  },

  apple: {
    brand: 'Apple',
    category: 'Streaming & Media Subscriptions',
    titleEn: 'Apple Gift Card & App Store Activation Guide',
    titleRu: 'Инструкция по активации Apple / App Store',
    redeemUrl: 'https://appstore.com/redeem',
    stepsEn: [
      'Open the App Store on your iPhone, iPad, or Mac.',
      'Tap your profile photo or the sign-in button at the top of the screen.',
      'Tap "Redeem Gift Card or Code".',
      'Enter the 16-digit digital code and tap Redeem.',
    ],
    stepsRu: [
      'Откройте App Store на iPhone, iPad или Mac.',
      'Нажмите на фото профиля или кнопку входа вверху экрана.',
      'Выберите «Погасить подарочную карту или код».',
      'Введите 16-значный цифровой код и нажмите «Погасить».',
    ],
    noteEn: 'Usable across App Store, Apple Music, iCloud+, Apple TV+, and Arcade.',
    noteRu: 'Действует для App Store, Apple Music, iCloud+, Apple TV+ и Arcade.',
  },

  spotify: {
    brand: 'Spotify',
    category: 'Streaming & Media Subscriptions',
    titleEn: 'Spotify Premium Voucher Activation Guide',
    titleRu: 'Инструкция по активации Spotify Premium',
    redeemUrl: 'https://www.spotify.com/redeem',
    stepsEn: [
      'Visit spotify.com/redeem in your web browser.',
      'Log into your Spotify account.',
      'Enter the alphanumeric voucher code and your postal code.',
      'Click Redeem to activate your ad-free Premium subscription.',
    ],
    stepsRu: [
      'Перейдите на страницу spotify.com/redeem в браузере.',
      'Войдите в свой аккаунт Spotify.',
      'Введите код ваучера и почтовый индекс.',
      'Нажмите «Активировать» для подключения подписки Spotify Premium без рекламы.',
    ],
  },

  discord: {
    brand: 'Discord',
    category: 'Streaming & Media Subscriptions',
    titleEn: 'Discord Nitro Code Activation Guide',
    titleRu: 'Инструкция по активации Discord Nitro',
    redeemUrl: 'https://discord.com/billing',
    stepsEn: [
      'Open Discord on desktop or web browser.',
      'Go to User Settings (the gear icon next to your avatar) -> "Gift Inventory".',
      'Paste your digital code into the "Redeem Codes" field and click Redeem.',
      'Your Nitro perks and Server Boosts will activate immediately.',
    ],
    stepsRu: [
      'Откройте Discord в приложении или браузере.',
      'Перейдите в Настройки пользователя (значок шестерёнки) -> «Склад подарков».',
      'Вставьте полученный цифровой код в поле «Активация кодов» и нажмите «Активировать».',
      'Подписка Nitro и бусты сервера станут активны мгновенно.',
    ],
  },

  telegram: {
    brand: 'Telegram',
    category: 'Creator & Game Micro-Donations',
    titleEn: 'Telegram Stars & Premium Delivery Guide',
    titleRu: 'Инструкция по получению Telegram Stars & Premium',
    redeemUrl: 'https://t.me',
    stepsEn: [
      'Telegram Stars: Credited instantly to the recipient @username specified at checkout.',
      'Open Telegram -> Settings -> "My Stars" to inspect your updated balance.',
      'Telegram Premium Gifts: Delivered via an official Telegram gift link or credited directly.',
      'Confirm receipt directly in the official Telegram app on any device.',
    ],
    stepsRu: [
      'Telegram Stars: Зачисляются мгновенно напрямую на указанный при оплате @username.',
      'Откройте Telegram -> Настройки -> «Мои звёзды» для проверки пополненного баланса.',
      'Telegram Premium: Доставляется официальной ссылкой на подарок либо активируется на аккаунт.',
      'Подтверждение зачисления отображается в приложении Telegram на любом устройстве.',
    ],
    noteEn: 'Direct on-chain verified automated credit. No manual code entry required.',
    noteRu: 'Прямое автоматическое зачисление. Ввод ручного кода не требуется.',
  },

  pubg: {
    brand: 'Krafton / Tencent',
    category: 'Creator & Game Micro-Donations',
    titleEn: 'PUBG Mobile Unknown Cash (UC) Activation Guide',
    titleRu: 'Инструкция по активации PUBG Mobile UC',
    redeemUrl: 'https://www.midasbuy.com',
    stepsEn: [
      'Visit midasbuy.com and select PUBG Mobile.',
      'Enter your Player ID (find in your game profile under your nickname).',
      'Select "Redeem Code" and enter your voucher key.',
      'Click Submit; UC will be immediately delivered to your in-game mailbox.',
    ],
    stepsRu: [
      'Перейдите на midasbuy.com и выберите PUBG Mobile.',
      'Введите ваш Player ID (находится в профиле игры под ником).',
      'Выберите «Активировать код» и введите ключ ваучера.',
      'Нажмите «Отправить» — UC сразу же поступят во внутриигровую почту.',
    ],
  },

  freefire: {
    brand: 'Garena Free Fire',
    category: 'Creator & Game Micro-Donations',
    titleEn: 'Garena Free Fire Diamonds Activation Guide',
    titleRu: 'Инструкция по активации Free Fire Diamonds',
    redeemUrl: 'https://reward.ff.garena.com',
    stepsEn: [
      'Visit reward.ff.garena.com or topup.garena.com.',
      'Sign in with the account linked to your Free Fire character (Google, Facebook, VK).',
      'Enter the voucher code in the redemption field.',
      'Click Confirm to receive Diamonds directly to your game wallet.',
    ],
    stepsRu: [
      'Перейдите на reward.ff.garena.com или topup.garena.com.',
      'Войдите через аккаунт, привязанный к персонажу Free Fire (Google, VK, Facebook).',
      'Введите код ваучера в поле активации.',
      'Нажмите «Подтвердить» для зачисления алмазов на игровой баланс.',
    ],
  },

  adobe: {
    brand: 'Adobe',
    category: 'Developer API & Token Bundles',
    titleEn: 'Adobe Creative Cloud & Acrobat AI Assistant Activation Guide',
    titleRu: 'Инструкция по активации Adobe Creative Cloud / AI Assistant',
    redeemUrl: 'https://redeem.adobe.com',
    stepsEn: [
      'Go to redeem.adobe.com in your web browser.',
      'Sign in with your Adobe ID or create a new account.',
      'Enter the 24-character digital code provided with your order.',
      'Click "Redeem code" to bind the subscription to your Adobe account.',
    ],
    stepsRu: [
      'Перейдите на redeem.adobe.com в веб-браузере.',
      'Войдите с помощью Adobe ID или зарегистрируйте новый аккаунт.',
      'Введите 24-значный цифровой код из квитанции заказа.',
      'Нажмите «Активировать код» для привязки подписки к вашему аккаунту Adobe.',
    ],
    noteEn: 'Applicable to Adobe Acrobat AI Assistant, Photoshop, Lightroom, and Creative Cloud plans.',
    noteRu: 'Действует для Adobe Acrobat AI Assistant, Photoshop, Lightroom и подписок Creative Cloud.',
  },

  developer: {
    brand: 'Mercenta Developer Rails',
    category: 'Developer API & Token Bundles',
    titleEn: 'AI Inference Quota & Token Pool Activation Guide',
    titleRu: 'Инструкция по активации пула API токенов',
    redeemUrl: 'https://api.mercenta.xyz',
    stepsEn: [
      'Open the Mercenta Developer Hub at api.mercenta.xyz.',
      'Authenticate with your Arc Web3 wallet or Organization API Key.',
      'Navigate to Balance -> "Redeem Inference Voucher".',
      'Submit the code to instantly allocate high-throughput model inference credits.',
    ],
    stepsRu: [
      'Откройте панель разработчика Mercenta на api.mercenta.xyz.',
      'Авторизуйтесь через кошелек Arc Web3 или ключ организации.',
      'Перейдите в раздел Баланс -> «Активировать ваучер инференса».',
      'Введите код для мгновенного зачисления кредитов инференса моделей.',
    ],
    noteEn: 'API vouchers do not expire and pool across your organization workspace.',
    noteRu: 'Ваучеры API не сгорают и объединяются на уровне пространства вашей организации.',
  },

  compute: {
    brand: 'Mercenta Compute Vault',
    category: 'Cloud Compute & GPU Vouchers',
    titleEn: 'Dedicated H100 / A100 GPU Hour Voucher Activation Guide',
    titleRu: 'Инструкция по активации GPU кластера H100 / A100',
    redeemUrl: 'https://app.mercenta.xyz/app?section=shop',
    stepsEn: [
      'Sign in to the Mercenta Cloud Console with your Arc wallet.',
      'Enter the reservation voucher code in the Compute Provisioning panel.',
      'Select cluster datacenter region and OS image (CUDA 12.4 / Ubuntu 24.04 LTS).',
      'SSH credentials and dedicated endpoints will be provisioned within 60 seconds.',
    ],
    stepsRu: [
      'Войдите в облачную консоль Mercenta через ваш кошелек Arc.',
      'Введите код ваучера резервации в панели Compute Provisioning.',
      'Выберите дата-центр кластера и образ ОС (CUDA 12.4 / Ubuntu 24.04 LTS).',
      'SSH-доступы и выделенные эндпоинты будут развернуты в течение 60 секунд.',
    ],
    noteEn: 'Reservations guarantee 100% bare-metal performance SLA without noisy neighbors.',
    noteRu: 'Резервация гарантирует 100% выделенную мощность без соседней нагрузки.',
  },

  default: {
    brand: 'Digital Goods & Vouchers',
    category: 'Digital Vouchers & Subscriptions',
    titleEn: 'Digital Voucher Activation Guide',
    titleRu: 'Инструкция по активации цифрового товара',
    stepsEn: [
      'Log into your account on the official service website or client application.',
      'Navigate to Billing / Account / Redeem Voucher or Gift Card.',
      'Enter the digital code exactly as displayed on screen or saved in Purchases.',
      'Confirm the activation to receive your subscription, game, or credits instantly.',
    ],
    stepsRu: [
      'Войдите в свой аккаунт на официальном сайте или в приложении сервиса.',
      'Перейдите в раздел Оплата / Аккаунт / Активировать ваучер или подарочную карту.',
      'Введите цифровой код в точности как он указан на экране или в покупках.',
      'Подтвердите активацию для мгновенного получения подписки, игры или баланса.',
    ],
    noteEn: 'Always ensure your account region matches the product region prior to redemption.',
    noteRu: 'Перед активацией убедитесь, что регион аккаунта совпадает с регионом товара.',
  },
};

/**
 * Resolves the deterministic activation guide for any product name, brand, or category.
 */
export function getActivationGuide(productName: string, brandName?: string, category?: string): ActivationGuide {
  const text = `${productName} ${brandName || ''} ${category || ''}`.toLowerCase();

  if (/steam/i.test(text)) return ACTIVATION_GUIDES.steam;
  if (/play\s*station|psn/i.test(text)) return ACTIVATION_GUIDES.playstation;
  if (/xbox|flight\s*simulator|microsoft/i.test(text)) return ACTIVATION_GUIDES.xbox;
  if (/roblox/i.test(text)) return ACTIVATION_GUIDES.roblox;
  if (/valorant|riot|league/i.test(text)) return ACTIVATION_GUIDES.valorant;
  if (/nintendo/i.test(text)) return ACTIVATION_GUIDES.nintendo;
  if (/battle\.?net|blizzard|warcraft|diablo/i.test(text)) return ACTIVATION_GUIDES.battlenet;
  if (/apple|itunes|app\s*store/i.test(text)) return ACTIVATION_GUIDES.apple;
  if (/spotify/i.test(text)) return ACTIVATION_GUIDES.spotify;
  if (/discord/i.test(text)) return ACTIVATION_GUIDES.discord;
  if (/telegram|stars/i.test(text)) return ACTIVATION_GUIDES.telegram;
  if (/pubg/i.test(text)) return ACTIVATION_GUIDES.pubg;
  if (/free\s*fire/i.test(text)) return ACTIVATION_GUIDES.freefire;
  if (/adobe/i.test(text)) return ACTIVATION_GUIDES.adobe;
  if (/token|inference|developer|api/i.test(text)) return ACTIVATION_GUIDES.developer;
  if (/gpu|h100|a100|compute|cluster/i.test(text)) return ACTIVATION_GUIDES.compute;

  return ACTIVATION_GUIDES.default;
}
