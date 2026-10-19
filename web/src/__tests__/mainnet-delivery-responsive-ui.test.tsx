// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { MainnetDeliveryModal } from '@/components/product/MainnetDeliveryModal';
import type { MainnetOrder } from '@/lib/mainnet-orders';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root, host: HTMLElement;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  // mock clipboard
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn(async () => {}),
    },
  });
  // mock dialog methods for jsdom
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
});

const sampleFulfilledOrder: MainnetOrder = {
  id: 'mct-ord-0x3d94ee8904cb8aaf19879a050e47c6b13926bb1ce4647d946b1a3ac847366643',
  created_at: 1792446961000,
  initiator: '0x1111...1111',
  initiator_address: '0x1111111111111111111111111111111111111111',
  reference: '0x3d94ee8904cb...',
  name: 'Steam Gift Card · $10 USD',
  product_id: 'steam-10',
  country: 'GLOBAL',
  quantity: 1,
  amount_units: '10000000',
  status: 'FULFILLED',
  tx_hash: '0x3d94ee8904cb8aaf19879a050e47c6b13926bb1ce4647d946b1a3ac847366643',
  codes: ['STEAM-XXXXX-YYYYY-ZZZZZ-12345'],
  network: 'mainnet',
  delivery_source: 'provider_response',
};

it('renders responsive activation key and copyable order id in receipt details', async () => {
  const onClose = vi.fn();
  await act(async () => {
    root.render(<MainnetDeliveryModal order={sampleFulfilledOrder} ru={true} onClose={onClose} />);
  });

  // Verify activation key is rendered with responsive class
  const codeEl = host.querySelector('code.mainnet-activation-code');
  expect(codeEl).toBeTruthy();
  expect(codeEl?.textContent).toBe('STEAM-XXXXX-YYYYY-ZZZZZ-12345');

  // Verify Order ID is rendered inside responsive wrapper
  const orderIdEl = host.querySelector('.mainnet-receipt-id-text');
  expect(orderIdEl).toBeTruthy();
  expect(orderIdEl?.textContent).toBe(sampleFulfilledOrder.id);

  // Verify copy order ID button works
  const copyOrderIdBtn = host.querySelector<HTMLButtonElement>('.mainnet-id-copy-btn');
  expect(copyOrderIdBtn).toBeTruthy();
  await act(async () => {
    copyOrderIdBtn?.click();
  });
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sampleFulfilledOrder.id);
});

it('renders responsive fallback receipt when order is not fulfilled', async () => {
  const pendingOrder: MainnetOrder = {
    ...sampleFulfilledOrder,
    status: 'PENDING',
    codes: [],
    delivery_source: 'unconfirmed',
  };

  const onClose = vi.fn();
  await act(async () => {
    root.render(<MainnetDeliveryModal order={pendingOrder} ru={false} onClose={onClose} />);
  });

  // Verify Order ID is rendered in the pending receipt details as well
  const orderIdEl = host.querySelector('.mainnet-receipt-id-text');
  expect(orderIdEl).toBeTruthy();
  expect(orderIdEl?.textContent).toBe(pendingOrder.id);
});
