'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/product/ProductShell';
import type { useArcWallet } from './useArcWallet';
import { useTgLocale } from './tg-locale';

const WALLET_ERRORS: Record<string, string> = {
  'Passwords do not match.': 'Пароли не совпадают.',
  'Wallet storage is unavailable or damaged. Restore your encrypted backup; do not overwrite existing data.': 'Хранилище кошелька недоступно или повреждено. Восстановите зашифрованную резервную копию; не перезаписывайте существующие данные.',
  'Wallet operation failed.': 'Не удалось выполнить операцию с кошельком.',
  'This browser cannot safely coordinate wallet storage. Use a browser with Web Locks support.': 'Этот браузер не может безопасно синхронизировать хранилище кошелька. Используйте браузер с поддержкой Web Locks.',
  'Wallet operation cancelled.': 'Операция с кошельком отменена.',
  'Wallet storage changed in another tab. Reload before continuing.': 'Хранилище кошелька изменилось в другой вкладке. Перед продолжением обновите страницу.',
  'An encrypted wallet already exists. Unlock or restore it instead.': 'Зашифрованный кошелёк уже существует. Разблокируйте или восстановите его.',
  'No encrypted wallet found.': 'Зашифрованный кошелёк не найден.',
  'A wallet already exists on this device. Back it up before restoring another wallet.': 'На этом устройстве уже есть кошелёк. Сохраните резервную копию перед восстановлением другого кошелька.',
  'No wallet found.': 'Кошелёк не найден.',
  'Invalid wallet backup.': 'Некорректная резервная копия кошелька.',
  'Secure browser cryptography is unavailable. Use HTTPS.': 'Безопасная криптография браузера недоступна. Используйте HTTPS.',
  'Use a password of at least 12 characters.': 'Используйте пароль длиной не менее 12 символов.',
  'Incorrect password or damaged wallet backup.': 'Неверный пароль или повреждённая резервная копия кошелька.',
  'Wallet could not be saved. Do not deposit funds.': 'Не удалось сохранить кошелёк. Не пополняйте его.',
};

type LocalWallet = ReturnType<typeof useArcWallet>;
export function TgLocalWallet({ wallet, onSignIn, onExternal, onClose }: { wallet: LocalWallet; onSignIn: () => void; onExternal: () => void; onClose: () => void }) {
  const { ru, t } = useTgLocale();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [backup, setBackup] = useState('');
  const [exported, setExported] = useState('');
  const [error, setError] = useState('');
  const errorMessage = error || wallet.error;
  const localizedError = ru && errorMessage ? WALLET_ERRORS[errorMessage] ?? 'Не удалось выполнить операцию с кошельком. Проверьте пароль, резервную копию и доступность хранилища; не перезаписывайте существующие данные.' : errorMessage;
  useEffect(() => {
    if (wallet.provider) return;
    setExported('');
  }, [wallet.provider]);
  useEffect(() => {
    if (!exported) return;
    const timer = setTimeout(() => setExported(''), 30_000);
    return () => clearTimeout(timer);
  }, [exported]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setExported('');
    try {
      if (backup) await wallet.restore(backup, password);
      else if (wallet.vault) await wallet.unlock(password);
      else {
        if (password !== confirmation) throw new Error('Passwords do not match.');
        await wallet.create(password);
      }
    } catch (reason) { setError((reason as Error).message); }
    finally { setPassword(''); setConfirmation(''); }
  }
  async function reveal() {
    setError('');
    try { setExported(await wallet.exportKey(password)); }
    catch (reason) { setError((reason as Error).message); }
    finally { setPassword(''); }
  }
  function download() {
    if (!wallet.vault) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(wallet.vault)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `mercenta-wallet-${wallet.address}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <Modal title={t('Your Mercenta wallet', 'Ваш кошелёк Mercenta')} canClose={!wallet.busy} onClose={onClose}><div className="tg-local-wallet">
    <p>{t('A non-custodial EVM wallet created on this device. Your password encrypts the key locally; Mercenta cannot recover it. Clearing browser data without a backup can permanently lose access.', 'Некастодиальный EVM-кошелёк, созданный на этом устройстве. Пароль шифрует ключ локально; Mercenta не может его восстановить. Очистка данных браузера без резервной копии может навсегда лишить вас доступа.')}</p>
    {wallet.address && <code>{wallet.address}</code>}
    {wallet.provider ? <><p role="status">{t('Wallet unlocked. Payments always require separate confirmation.', 'Кошелёк разблокирован. Каждый платёж требует отдельного подтверждения.')}</p><button className="tg-action" onClick={onSignIn}>{t('Sign in with this wallet', 'Войти с этим кошельком')}</button><button className="tg-secondary" onClick={() => { setExported(''); wallet.lock(); }}>{t('Lock wallet', 'Заблокировать кошелёк')}</button></> : <form onSubmit={submit}>
      {wallet.legacy && !wallet.vault && <p role="alert">{t('An older unencrypted wallet exists. Encrypting preserves its address and removes the plaintext key only after the encrypted wallet is saved. No new address is generated.', 'Найден старый незашифрованный кошелёк. Шифрование сохранит его адрес и удалит незашифрованный приватный ключ из хранилища только после сохранения зашифрованного кошелька. Новый адрес не создаётся.')}</p>}
      <label htmlFor="vault-password">{wallet.vault ? t('Unlock password', 'Пароль для разблокировки') : t('Choose a password (12+ characters)', 'Задайте пароль (12+ символов)')}</label><input id="vault-password" type="password" autoComplete={wallet.vault ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={wallet.vault ? 1 : 12} disabled={wallet.busy} />
      {!wallet.vault && !backup && <><label htmlFor="vault-confirm">{t('Confirm password', 'Повторите пароль')}</label><input id="vault-confirm" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required minLength={12} disabled={wallet.busy} /></>}
      {!wallet.vault && !wallet.legacy && <details><summary>{t('Restore encrypted Mercenta backup', 'Восстановить зашифрованную копию Mercenta')}</summary><label htmlFor="vault-backup">{t('Mercenta backup JSON', 'Резервная копия Mercenta в формате JSON')}</label><textarea id="vault-backup" maxLength={4096} value={backup} onChange={e => setBackup(e.target.value)} /></details>}
      <button className="tg-action" type="submit" disabled={wallet.busy}>{wallet.busy ? t('Securing wallet…', 'Защищаем кошелёк…') : backup ? t('Restore wallet', 'Восстановить кошелёк') : wallet.vault ? t('Unlock wallet', 'Разблокировать кошелёк') : wallet.legacy ? t('Encrypt existing wallet', 'Зашифровать существующий кошелёк') : t('Create encrypted wallet', 'Создать зашифрованный кошелёк')}</button>
    </form>}
    {wallet.vault && <><button className="tg-secondary" onClick={download}>{t('Download encrypted backup', 'Скачать зашифрованную копию')}</button><p>{t('This is a Mercenta backup, not a MetaMask JSON keystore. Keep the password separately.', 'Это резервная копия Mercenta, а не JSON-хранилище MetaMask. Храните пароль отдельно.')}</p><details onToggle={e => { if (!e.currentTarget.open) { setExported(''); setPassword(''); } }}><summary>{t('Export to MetaMask / Rabby', 'Экспорт в MetaMask / Rabby')}</summary><p>{t('In MetaMask or Rabby, choose Import account → Private key. Never send the key to support or a website. Anyone with this key controls your funds.', 'В MetaMask или Rabby выберите «Импорт аккаунта → Приватный ключ». Никогда не отправляйте ключ поддержке или на сайт. Любой, у кого есть этот ключ, управляет вашими средствами.')}</p><label htmlFor="vault-export-password">{t('Re-enter your wallet password', 'Введите пароль кошелька повторно')}</label><input id="vault-export-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /><button className="tg-secondary" onClick={() => void reveal()}>{t('Reveal private key', 'Показать приватный ключ')}</button>{exported && <><code className="tg-secret">{exported}</code><button className="tg-secondary" onClick={() => setExported('')}>{t('Hide private key', 'Скрыть приватный ключ')}</button><p>{t('Visible for 30 seconds. Select and copy only into your wallet application.', 'Отображается 30 секунд. Выделяйте и копируйте только в приложение вашего кошелька.')}</p></>}</details></>}
    {errorMessage && <p role="alert">{localizedError}</p>}
    <button className="tg-secondary" disabled={wallet.busy} onClick={onExternal}>{t('Use MetaMask / Rabby instead', 'Использовать MetaMask / Rabby')}</button>
  </div></Modal>;
}

export function TgWalletApproval({ wallet }: { wallet: LocalWallet }) {
  const { t } = useTgLocale();
  const request = wallet.approval;
  const [remaining, setRemaining] = useState(90);
  useEffect(() => {
    if (!request) return;
    setRemaining(90);
    const timer = setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [request]);
  if (!request) return null;
  return <Modal title={request.kind === 'message' ? t('Confirm wallet sign-in', 'Подтвердите вход с кошельком') : t('Confirm USDC transfer', 'Подтвердите перевод USDC')} onClose={() => wallet.answer(false)}><div className="tg-local-wallet">
    {request.kind === 'message' ? <><p>{t('This signature proves ownership for Mercenta sign-in. It does not transfer funds.', 'Эта подпись подтверждает владение кошельком для входа в Mercenta. Она не переводит средства.')}</p><pre>{request.message}</pre></> : <><p>{t('Real funds will leave your wallet. Review every field before approving.', 'С вашего кошелька будут списаны реальные средства. Проверьте каждое поле перед подтверждением.')}</p><dl><dt>{t('Network', 'Сеть')}</dt><dd>{request.chain}</dd><dt>{t('Recipient', 'Получатель')}</dt><dd><code>{request.to}</code></dd><dt>{t('Amount', 'Сумма')}</dt><dd>{request.amount} USDC</dd><dt>{t('Maximum network fee', 'Максимальная комиссия сети')}</dt><dd>{request.fee} USDC</dd><dt>{t('Maximum total', 'Максимальная итоговая сумма')}</dt><dd>{request.total} USDC</dd></dl><p>{t(`Confirmation expires in ${remaining} seconds.`, `До истечения подтверждения: ${remaining} сек.`)}</p></>}
    <button className="tg-action" disabled={remaining === 0} onClick={() => wallet.answer(true)}>{request.kind === 'message' ? t('Sign in', 'Войти') : t(`Send ${request.amount} USDC`, `Отправить ${request.amount} USDC`)}</button><button className="tg-secondary" onClick={() => wallet.answer(false)}>{t('Cancel', 'Отмена')}</button>
  </div></Modal>;
}
