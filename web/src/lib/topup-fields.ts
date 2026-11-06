/**
 * Field configuration helper for direct top-up products.
 * Vouchers (gift cards, codes) do NOT require any account reference.
 * Only explicit direct_topup products or Telegram services require an account ID.
 */

export interface TopupFieldConfig {
  isTopup: boolean;
  isTelegram: boolean;
  label: string;
  placeholder: string;
  hint: string;
  error: string;
  buttonPrompt: string;
}

export function getTopupConfig(
  productName: string,
  productType?: string,
  ru = false
): TopupFieldConfig {
  const lower = (productName || '').toLowerCase();
  const isExplicitTopup = productType === 'direct_topup';
  const isTelegram = lower.includes('telegram');

  // If explicitly a voucher and not Telegram, it is never a topup
  if (productType === 'voucher' && !isTelegram && !isExplicitTopup) {
    return {
      isTopup: false,
      isTelegram: false,
      label: '',
      placeholder: '',
      hint: '',
      error: '',
      buttonPrompt: '',
    };
  }

  // Not a topup unless direct_topup or telegram
  if (!isExplicitTopup && !isTelegram) {
    return {
      isTopup: false,
      isTelegram: false,
      label: '',
      placeholder: '',
      hint: '',
      error: '',
      buttonPrompt: '',
    };
  }

  // 1. Telegram (Stars, Premium, TON)
  if (isTelegram) {
    return {
      isTopup: true,
      isTelegram: true,
      label: ru
        ? 'Telegram username (@username) для зачисления:'
        : 'Telegram username (@username) for delivery:',
      placeholder: '@username',
      hint: ru
        ? 'Звёзды или подписка будут зачислены напрямую на указанный Telegram-аккаунт.'
        : 'Stars or subscription will be credited directly to this Telegram account.',
      error: ru
        ? 'Укажите Telegram @username получателя перед оплатой.'
        : 'Please enter Telegram @username before paying.',
      buttonPrompt: ru ? 'введите @username выше' : 'enter @username above',
    };
  }

  // 2. Steam Wallet Top Up / Direct Topup
  if (lower.includes('steam')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Steam Login (логин аккаунта для входа, не никнейм):'
        : 'Steam Account Login (used for login, not display nickname):',
      placeholder: 'steam_login',
      hint: ru
        ? 'Средства будут зачислены напрямую на баланс указанного аккаунта Steam.'
        : 'Funds will be deposited directly into the specified Steam account wallet.',
      error: ru
        ? 'Укажите точный логин аккаунта Steam перед оплатой.'
        : 'Please enter your Steam account login before paying.',
      buttonPrompt: ru ? 'введите Steam логин выше' : 'enter Steam login above',
    };
  }

  // 3. PUBG Mobile
  if (lower.includes('pubg')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'PUBG Mobile Player ID (числовой ID игрока):'
        : 'PUBG Mobile Player ID (Character ID):',
      placeholder: '5123456789',
      hint: ru
        ? 'UC будут начислены напрямую на указанный Character ID игрока.'
        : 'UC will be credited directly to your Player Character ID.',
      error: ru
        ? 'Укажите числовой Player ID в PUBG Mobile перед оплатой.'
        : 'Please enter your PUBG Mobile Player ID before paying.',
      buttonPrompt: ru ? 'введите Player ID выше' : 'enter Player ID above',
    };
  }

  // 4. Free Fire
  if (lower.includes('free fire') || lower.includes('freefire')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Free Fire Player ID (UID игрока):'
        : 'Free Fire Player ID (UID):',
      placeholder: '123456789',
      hint: ru
        ? 'Алмазы будут зачислены напрямую на указанный UID игрока.'
        : 'Diamonds will be credited directly to your Free Fire UID.',
      error: ru
        ? 'Укажите Free Fire Player ID перед оплатой.'
        : 'Please enter your Free Fire Player ID before paying.',
      buttonPrompt: ru ? 'введите UID выше' : 'enter UID above',
    };
  }

  // 5. Mobile Legends / MLBB
  if (lower.includes('mobile legends') || lower.includes('mlbb')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Mobile Legends User ID & Zone ID:'
        : 'Mobile Legends User ID & Zone ID:',
      placeholder: '12345678 (1234)',
      hint: ru
        ? 'Алмазы будут зачислены напрямую на ваш аккаунт MLBB (укажите User ID и Zone ID в скобках).'
        : 'Diamonds will be credited directly to your MLBB account (specify User ID and Zone ID).',
      error: ru
        ? 'Укажите Mobile Legends User ID перед оплатой.'
        : 'Please enter your Mobile Legends User ID before paying.',
      buttonPrompt: ru ? 'введите User ID выше' : 'enter User ID above',
    };
  }

  // 6. Honor of Kings
  if (lower.includes('honor of kings')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Honor of Kings Player UID:'
        : 'Honor of Kings Player UID:',
      placeholder: '1234567890',
      hint: ru
        ? 'Токены будут зачислены напрямую на указанный UID игрока в Honor of Kings.'
        : 'Tokens will be deposited directly to your Honor of Kings Player UID.',
      error: ru
        ? 'Укажите Honor of Kings Player UID перед оплатой.'
        : 'Please enter your Honor of Kings Player UID before paying.',
      buttonPrompt: ru ? 'введите UID выше' : 'enter UID above',
    };
  }

  // 7. Arena Breakout
  if (lower.includes('arena breakout')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Arena Breakout Player ID:'
        : 'Arena Breakout Player ID:',
      placeholder: '123456789',
      hint: ru
        ? 'Облигации будут зачислены напрямую на ваш игровой ID в Arena Breakout.'
        : 'Bonds will be credited directly to your Arena Breakout Player ID.',
      error: ru
        ? 'Укажите Arena Breakout Player ID перед оплатой.'
        : 'Please enter your Arena Breakout Player ID before paying.',
      buttonPrompt: ru ? 'введите Player ID выше' : 'enter Player ID above',
    };
  }

  // 8. Hoyoverse (Zenless Zone Zero, Genshin Impact, Honkai: Star Rail)
  if (lower.includes('zenless') || lower.includes('genshin') || lower.includes('honkai')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'UID игрока (In-Game UID):'
        : 'Player In-Game UID:',
      placeholder: '701234567',
      hint: ru
        ? 'Игровая валюта будет доставлена напрямую на указанный игровой UID.'
        : 'In-game currency will be delivered directly to this Player UID.',
      error: ru
        ? 'Укажите UID игрока перед оплатой.'
        : 'Please enter your Player UID before paying.',
      buttonPrompt: ru ? 'введите UID выше' : 'enter UID above',
    };
  }

  // 9. Wuthering Waves
  if (lower.includes('wuthering waves')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Wuthering Waves UID игрока:'
        : 'Wuthering Waves Player UID:',
      placeholder: '150123456',
      hint: ru
        ? 'Lunite будут зачислены напрямую на указанный игровой UID.'
        : 'Lunite will be credited directly to your Player UID.',
      error: ru
        ? 'Укажите Wuthering Waves UID перед оплатой.'
        : 'Please enter your Wuthering Waves UID before paying.',
      buttonPrompt: ru ? 'введите UID выше' : 'enter UID above',
    };
  }

  // 10. Blood Strike
  if (lower.includes('blood strike')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Blood Strike User ID:'
        : 'Blood Strike User ID:',
      placeholder: '12345678',
      hint: ru
        ? 'Золото будет зачислено напрямую на указанный Blood Strike User ID.'
        : 'Gold will be credited directly to your Blood Strike User ID.',
      error: ru
        ? 'Укажите Blood Strike User ID перед оплатой.'
        : 'Please enter your Blood Strike User ID before paying.',
      buttonPrompt: ru ? 'введите User ID выше' : 'enter User ID above',
    };
  }

  // 11. Bigo Live
  if (lower.includes('bigo')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Bigo Live ID:'
        : 'Bigo Live ID:',
      placeholder: '12345678',
      hint: ru
        ? 'Алмазы будут зачислены напрямую на ваш профиль Bigo Live.'
        : 'Diamonds will be credited directly to your Bigo Live account ID.',
      error: ru
        ? 'Укажите Bigo Live ID перед оплатой.'
        : 'Please enter your Bigo Live ID before paying.',
      buttonPrompt: ru ? 'введите Bigo ID выше' : 'enter Bigo ID above',
    };
  }

  // 12. Razer Gold
  if (lower.includes('razer')) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Razer Gold Wallet Email или User ID:'
        : 'Razer Gold Wallet Email or User ID:',
      placeholder: 'user@example.com',
      hint: ru
        ? 'Баланс будет пополнен на указанный аккаунт кошелька Razer Gold.'
        : 'Funds will be deposited into your Razer Gold Wallet account.',
      error: ru
        ? 'Укажите Email или User ID кошелька Razer Gold перед оплатой.'
        : 'Please enter your Razer Gold Wallet Email or User ID before paying.',
      buttonPrompt: ru ? 'введите Razer Email/ID выше' : 'enter Razer Email/ID above',
    };
  }

  // 13. Mobile Telco (Airtime / Bundles)
  if (
    lower.includes('airtel') ||
    lower.includes('africell') ||
    lower.includes('telecom') ||
    lower.includes('vodafone') ||
    lower.includes('mtn') ||
    lower.includes('9mobile') ||
    lower.includes('orange') ||
    lower.includes('etisalat') ||
    lower.includes('zain') ||
    lower.includes('viettel') ||
    lower.includes('vinaphone') ||
    lower.includes('digi') ||
    lower.includes('celcom') ||
    lower.includes('maxis') ||
    lower.includes('tim ') ||
    lower.includes('vivo') ||
    lower.includes('claro')
  ) {
    return {
      isTopup: true,
      isTelegram: false,
      label: ru
        ? 'Номер телефона для пополнения (с кодом страны):'
        : 'Phone number for mobile top-up (with country code):',
      placeholder: '+1234567890',
      hint: ru
        ? 'Баланс или пакет будет зачислен напрямую на этот номер телефона.'
        : 'Airtime or bundle will be credited directly to this phone number.',
      error: ru
        ? 'Укажите номер телефона получателя перед оплатой.'
        : 'Please enter recipient phone number before paying.',
      buttonPrompt: ru ? 'введите номер выше' : 'enter phone number above',
    };
  }

  // 14. Generic Direct Topup
  return {
    isTopup: true,
    isTelegram: false,
    label: ru
      ? 'Player ID / ID аккаунта получателя:'
      : 'Recipient Player ID / Account ID:',
    placeholder: ru ? 'ID аккаунта или логин игрока' : 'Account ID or Player ID',
    hint: ru
      ? 'Пополнение будет зачислено напрямую на указанный аккаунт.'
      : 'Top-up will be credited directly to this account.',
    error: ru
      ? 'Укажите ID аккаунта или логин получателя перед оплатой.'
      : 'Please enter recipient Account ID before paying.',
    buttonPrompt: ru ? 'введите ID аккаунта выше' : 'enter Account ID above',
  };
}
