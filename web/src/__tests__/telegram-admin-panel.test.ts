import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isTelegramAdmin,
  getAdminNotificationRecipients,
  getStoreOrders,
  getStoreTelemetry,
  getAdminOrderDetail,
  notifyAdminsNewOrder,
  renderAdminDashboardView,
  renderAdminOrdersView,
  renderAdminOrderDetailView,
  renderAdminStatsView,
} from '../lib/telegram-admin';
import { handleBotUpdate, botCommands, renderBotMessage } from '../lib/telegram-bot';
import { getDb, resetDb } from '../lib/db';

describe('Telegram Bot Admin Panel & Order Notifications Matrix', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetDb();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    resetDb();
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Part 1: Admin Authorization & RBAC
  // -------------------------------------------------------------------------
  describe('Admin Authorization & Identification', () => {
    it('fails closed when no admin is configured', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.TELEGRAM_ADMIN_IDS;
      delete process.env.TELEGRAM_ADMIN_ID;
      delete process.env.TELEGRAM_ADMIN_USERNAMES;
      delete process.env.TELEGRAM_ADMIN_CHAT_ID;
      expect(isTelegramAdmin(123456789, 'anyone')).toBe(false);
    });
    it('recognizes admin from TELEGRAM_ADMIN_IDS (single ID)', () => {
      process.env.NODE_ENV = 'production';
      process.env.TELEGRAM_ADMIN_IDS = '123456789';
      expect(isTelegramAdmin(123456789)).toBe(true);
      expect(isTelegramAdmin(999999999)).toBe(false);
    });

    it('recognizes admin from comma-separated TELEGRAM_ADMIN_IDS with whitespace', () => {
      process.env.NODE_ENV = 'production';
      process.env.TELEGRAM_ADMIN_IDS = ' 111111 , 222222 , 333333 ';
      expect(isTelegramAdmin(111111)).toBe(true);
      expect(isTelegramAdmin(222222)).toBe(true);
      expect(isTelegramAdmin(333333)).toBe(true);
      expect(isTelegramAdmin(444444)).toBe(false);
    });

    it('recognizes admin from TELEGRAM_ADMIN_USERNAMES (with and without @, case insensitive)', () => {
      process.env.NODE_ENV = 'production';
      process.env.TELEGRAM_ADMIN_IDS = '';
      process.env.TELEGRAM_ADMIN_USERNAMES = '@MercentaAdmin, ceo_store';

      expect(isTelegramAdmin(999, 'MercentaAdmin')).toBe(true);
      expect(isTelegramAdmin(999, '@mercentaadmin')).toBe(true);
      expect(isTelegramAdmin(999, 'ceo_store')).toBe(true);
      expect(isTelegramAdmin(999, '@CEO_STORE')).toBe(true);
      expect(isTelegramAdmin(999, 'random_user')).toBe(false);
    });

    it('recognizes admin from TELEGRAM_ADMIN_CHAT_ID', () => {
      process.env.NODE_ENV = 'production';
      process.env.TELEGRAM_ADMIN_CHAT_ID = '-100987654321';
      expect(isTelegramAdmin(-100987654321)).toBe(true);
      expect(isTelegramAdmin(12345)).toBe(false);
    });

    it('aggregates unique notification recipients from all env vars', () => {
      process.env.TELEGRAM_ADMIN_IDS = '101, 102, 103';
      process.env.TELEGRAM_ADMIN_CHAT_ID = '103, 104';
      const recipients = getAdminNotificationRecipients();
      expect(recipients).toContain('101');
      expect(recipients).toContain('102');
      expect(recipients).toContain('103');
    });
  });

  // -------------------------------------------------------------------------
  // Part 2: SQLite Store Orders & Telemetry
  // -------------------------------------------------------------------------
  describe('Authoritative Store Order History & Telemetry', () => {
    it('returns empty telemetry when database has zero orders', () => {
      const telemetry = getStoreTelemetry();
      expect(telemetry.totalOrders).toBe(0);
      expect(telemetry.fulfilledOrders).toBe(0);
      expect(telemetry.totalVolumeUsdcFormatted).toBe('0.000000');
    });

    it('inserts and retrieves orders with precise 6-decimal USDC scaling', () => {
      const db = getDb();
      const now = Date.now();
      db.prepare(
        'INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, payment_tx_hash, delivery_status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('ord_001', 'gaming-steam-voucher', '0x1111111111111111111111111111111111111111', 58585647, 'FULFILLED', '0x' + '1'.repeat(64), 'DELIVERED', now + 3600000, now, now);

      db.prepare(
        'INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, payment_tx_hash, delivery_status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('ord_002', 'telegram-stars-100', '0x2222222222222222222222222222222222222222', 1990000, 'FULFILLED', '0x' + '2'.repeat(64), 'DELIVERED', now + 3600000, now - 1000, now - 1000);

      const orders = getStoreOrders(10, 0);
      expect(orders.length).toBe(2);
      expect(orders[0].id).toBe('ord_001');
      expect(orders[0].amount_usdc_formatted).toBe('58.585647');
      expect(orders[0].product_name).toBe('Steam Wallet Card (Global)');
      expect(orders[1].id).toBe('ord_002');
      expect(orders[1].amount_usdc_formatted).toBe('1.990000');

      const telemetry = getStoreTelemetry();
      expect(telemetry.totalOrders).toBe(2);
      expect(telemetry.fulfilledOrders).toBe(2);
      // 58.585647 + 1.990000 = 60.575647
      expect(telemetry.totalVolumeUsdcFormatted).toBe('60.575647');
    });

    it('queries single order detail via getAdminOrderDetail', () => {
      const db = getDb();
      const now = Date.now();
      db.prepare(
        'INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, payment_tx_hash, delivery_status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('ord_target', 'roblox-voucher', '0x3333333333333333333333333333333333333333', 10000000, 'FULFILLED', '0x' + '3'.repeat(64), 'DELIVERED', now + 3600000, now, now);

      const order = getAdminOrderDetail('ord_target');
      expect(order).not.toBeNull();
      expect(order?.customer_wallet).toBe('0x3333333333333333333333333333333333333333');
      expect(order?.amount_usdc_formatted).toBe('10.000000');

      const byTx = getAdminOrderDetail('0x' + '3'.repeat(64));
      expect(byTx?.id).toBe('ord_target');

      const missing = getAdminOrderDetail('ord_nonexistent');
      expect(missing).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Part 3: Rendered Admin Screens (UI & Keyboards)
  // -------------------------------------------------------------------------
  describe('Admin View Generators', () => {
    it('renders admin dashboard with Russian localization and correct buttons', () => {
      const view = renderAdminDashboardView(777, 'ru', 'https://mercenta.xyz');
      expect(view.text).toContain('Панель управления Mercenta');
      expect(view.text).toContain('Шлюз Arc Mainnet (5042)');
      expect(view.text).toContain('0x06b6...f3ed');
      expect(view.text).toContain('777');

      const callbacks = view.reply_markup?.inline_keyboard.flat().map(b => b.callback_data);
      expect(callbacks).toContain('cmd_admin_orders');
      expect(callbacks).toContain('cmd_admin_stats');
      expect(callbacks).toContain('cmd_admin_test_notify');
      expect(callbacks).toContain('cmd_start');
    });

    it('renders admin dashboard with English localization', () => {
      const view = renderAdminDashboardView(777, 'en', 'https://mercenta.xyz');
      expect(view.text).toContain('Mercenta Store Admin Console');
      expect(view.text).toContain('Arc Mainnet Gateway (5042)');
    });

    it('renders store orders view with empty message when no orders exist', () => {
      const view = renderAdminOrdersView('ru', 0);
      expect(view.text).toContain('В базе данных пока нет зафиксированных заказов');
    });

    it('renders store orders view with order buttons when orders exist', () => {
      const db = getDb();
      const now = Date.now();
      db.prepare(
        'INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, payment_tx_hash, delivery_status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('ord_abc1234567', 'gaming-steam-voucher', '0x4444444444444444444444444444444444444444', 25000000, 'FULFILLED', '0x' + '4'.repeat(64), 'DELIVERED', now + 3600000, now, now);

      const view = renderAdminOrdersView('ru', 0);
      expect(view.text).toContain('История покупок Mercenta');
      expect(view.text).toContain('25.000000 USDC');

      const orderButton = view.reply_markup?.inline_keyboard.flat().find(b => b.callback_data === 'cmd_admin_order_ord_abc1234567');
      expect(orderButton).toBeDefined();
    });

    it('renders detailed order view with ArcScan link', () => {
      const db = getDb();
      const now = Date.now();
      const tx = '0x' + '5'.repeat(64);
      db.prepare(
        'INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, payment_tx_hash, delivery_status, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).run('ord_detailed', 'developer-api-tokens', '0x5555555555555555555555555555555555555555', 50000000, 'FULFILLED', tx, 'DELIVERED', now + 3600000, now, now);

      const view = renderAdminOrderDetailView('ord_detailed', 'ru');
      expect(view.text).toContain('Детали заказа #ord_detailed');
      expect(view.text).toContain('50.000000 USDC');
      expect(view.text).toContain('0x5555555555555555555555555555555555555555');

      const explorerButton = view.reply_markup?.inline_keyboard.flat().find(b => b.url === `https://explorer.arc.io/tx/${tx}`);
      expect(explorerButton).toBeDefined();
    });

    it('renders store stats view with volume and margin information', () => {
      const view = renderAdminStatsView('ru');
      expect(view.text).toContain('Статистика и аналитика продаж Mercenta');
      expect(view.text).toContain('Минимальная маржа ≥ 15%');
      expect(view.text).toContain('Malachite');
    });
  });

  // -------------------------------------------------------------------------
  // Part 4: Instant Push Notifications Dispatch
  // -------------------------------------------------------------------------
  describe('Order Notification Dispatcher', () => {
    it('returns error if TELEGRAM_BOT_TOKEN is not configured', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      const res = await notifyAdminsNewOrder({
        orderId: 'ord_1',
        productId: 'gaming-steam-voucher',
        customerWallet: '0x123',
        amountUsdc: '10.000000',
      });
      expect(res.notifiedCount).toBe(0);
      expect(res.errors).toContain('TELEGRAM_BOT_TOKEN_NOT_CONFIGURED');
    });

    it('returns error if no admin recipients are configured', async () => {
      process.env.TELEGRAM_BOT_TOKEN = 'test-token';
      process.env.TELEGRAM_ADMIN_IDS = '';
      process.env.TELEGRAM_ADMIN_CHAT_ID = '';
      const res = await notifyAdminsNewOrder({
        orderId: 'ord_1',
        productId: 'gaming-steam-voucher',
        customerWallet: '0x123',
        amountUsdc: '10.000000',
      });
      expect(res.notifiedCount).toBe(0);
      expect(res.errors).toContain('NO_ADMIN_RECIPIENTS_CONFIGURED');
    });

    it('dispatches formatted notification to all configured recipients', async () => {
      process.env.TELEGRAM_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
      process.env.TELEGRAM_ADMIN_IDS = '999888, 777666';

      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, result: { message_id: 12345 } }),
        } as unknown as Response;
      });

      const res = await notifyAdminsNewOrder({
        orderId: 'ord_live_test_100',
        productId: 'gaming-steam-voucher',
        productName: 'Steam Wallet Card 50 USD',
        customerWallet: '0x58863e4a739da0e62c2eba258b7783e95d5c48ce',
        telegramUsername: '@alice_buyer',
        amountUsdc: '50.000000',
        txHash: '0x' + 'f'.repeat(64),
        status: 'FULFILLED',
        network: 'Arc Mainnet (5042)',
        policyReasonHash: '0x0392b65b',
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(res.notifiedCount).toBe(2);
      expect(res.errors.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Part 5: Bot Update Router Integration
  // -------------------------------------------------------------------------
  describe('Bot Update Router (handleBotUpdate)', () => {
    it('shows admin button in /start menu when user is an admin', () => {
      const rendered = renderBotMessage('start', 'ru', 'https://mercenta.xyz', true, undefined, true);
      const adminBtn = rendered.reply_markup?.inline_keyboard.flat().find(b => b.callback_data === 'cmd_admin');
      expect(adminBtn).toBeDefined();
    });

    it('does NOT show admin button in /start menu for regular users', () => {
      const rendered = renderBotMessage('start', 'ru', 'https://mercenta.xyz', true, undefined, false);
      const adminBtn = rendered.reply_markup?.inline_keyboard.flat().find(b => b.callback_data === 'cmd_admin');
      expect(adminBtn).toBeUndefined();
    });

    it('denies access to /admin when sender is not an admin', async () => {
      process.env.NODE_ENV = 'production';
      process.env.TELEGRAM_ADMIN_IDS = '999';

      const sendMock = vi.fn().mockResolvedValue(true);
      await handleBotUpdate(
        {
          update_id: 1,
          message: {
            text: '/admin',
            from: { id: 111, language_code: 'ru' },
            chat: { id: 111, type: 'private' },
          },
        },
        {
          origin: 'https://mercenta.xyz',
          send: sendMock,
          getLanguage: async () => 'ru',
          setLanguage: async () => {},
        }
      );

      expect(sendMock).toHaveBeenCalledTimes(1);
      const sentPayload = sendMock.mock.calls[0][1];
      expect(sentPayload.text).toContain('Доступ ограничен');
    });

    it('renders admin dashboard when authorized admin invokes /admin', async () => {
      process.env.NODE_ENV = 'production';
      process.env.TELEGRAM_ADMIN_IDS = '999';

      const sendMock = vi.fn().mockResolvedValue(true);
      await handleBotUpdate(
        {
          update_id: 2,
          message: {
            text: '/admin',
            from: { id: 999, language_code: 'ru' },
            chat: { id: 999, type: 'private' },
          },
        },
        {
          origin: 'https://mercenta.xyz',
          send: sendMock,
          getLanguage: async () => 'ru',
          setLanguage: async () => {},
        }
      );

      expect(sendMock).toHaveBeenCalledTimes(1);
      const sentPayload = sendMock.mock.calls[0][1];
      expect(sentPayload.text).toContain('Панель управления Mercenta');
    });

    it('navigates to admin orders on cmd_admin_orders callback', async () => {
      process.env.NODE_ENV = 'production';
      process.env.TELEGRAM_ADMIN_IDS = '999';

      const sendMock = vi.fn().mockResolvedValue(true);
      await handleBotUpdate(
        {
          update_id: 3,
          callback_query: {
            id: 'cb_123',
            data: 'cmd_admin_orders',
            from: { id: 999, language_code: 'ru' },
            message: { message_id: 456, chat: { id: 999, type: 'private' } },
          },
        },
        {
          origin: 'https://mercenta.xyz',
          send: sendMock,
          getLanguage: async () => 'ru',
          setLanguage: async () => {},
        }
      );

      // Should answer callback query and edit message text
      expect(sendMock).toHaveBeenCalledWith('answerCallbackQuery', { callback_query_id: 'cb_123' });
      expect(sendMock).toHaveBeenCalledWith('editMessageText', expect.objectContaining({
        chat_id: 999,
        message_id: 456,
        text: expect.stringContaining('История покупок Mercenta'),
      }));
    });

    it('includes /admin in registered bot commands', () => {
      const commandsRu = botCommands(true);
      const adminCmdRu = commandsRu.find(c => c.command === 'admin');
      expect(adminCmdRu).toBeDefined();

      const commandsEn = botCommands(false);
      const adminCmdEn = commandsEn.find(c => c.command === 'admin');
      expect(adminCmdEn).toBeDefined();
    });
  });
});
