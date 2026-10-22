// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { RollingNumber } from '@/components/panelui/rolling-number';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root, host: HTMLElement;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

describe('PanelUI: RollingNumber', () => {
  it('renders numeric value with sr-only label for accessibility', async () => {
    await act(async () => {
      root.render(<RollingNumber value={42} />);
    });
    const sr = host.querySelector('.sr-only');
    expect(sr).not.toBeNull();
    expect(sr?.textContent).toBe('42');
  });

  it('formats currency correctly', async () => {
    await act(async () => {
      root.render(<RollingNumber value={99.99} format={{ style: 'currency', currency: 'USD' }} />);
    });
    const sr = host.querySelector('.sr-only');
    expect(sr?.textContent).toContain('99.99');
  });
});
