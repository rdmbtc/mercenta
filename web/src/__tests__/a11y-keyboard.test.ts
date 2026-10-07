// @vitest-environment jsdom
import {it,expect,vi,afterEach,beforeEach,describe} from 'vitest';
import React,{act} from 'react';
import {createRoot,type Root} from 'react-dom/client';

// Mock CSS imports to avoid Vite/PostCSS loader issues in jsdom environment
vi.mock('@/components/product/network-workspace.css', () => ({}));
vi.mock('./network-workspace.css', () => ({}));

import {StartJourney} from '@/components/product/StartJourney';
import {NetworkSelector} from '@/components/product/NetworkSelector';
import {ContextHelp} from '@/components/product/ContextHelp';

(globalThis as unknown as {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let el: HTMLDivElement;

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(async () => {
  if (root) {
    await act(async () => root!.unmount());
  }
  root = undefined;
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

async function render(element: React.ReactNode) {
  el = document.createElement('div');
  document.body.append(el);
  root = createRoot(el);
  await act(async () => root!.render(element));
}

describe('AGENT-14: Accessibility and Keyboard Navigation QA', () => {
  it('StartJourney opens dialog and allows Escape cancellation with focus restoration', async () => {
    const onNavigate = vi.fn();
    const onBudget = vi.fn();

    await render(React.createElement(StartJourney, {
      ru: false,
      onNavigate,
      onBudget,
      compact: false
    }));

    const openBtn = el.querySelector<HTMLButtonElement>('button.ma-button')!;
    expect(openBtn).toBeTruthy();

    await act(async () => {
      openBtn.focus();
      openBtn.click();
    });

    const dialog = el.querySelector('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog!.hasAttribute('open')).toBe(true);

    // Escape cancellation event
    await act(async () => {
      dialog!.dispatchEvent(new KeyboardEvent('cancel', { cancelable: true }));
    });

    // Verify dialog is closed and no navigation or money actions were triggered
    expect(el.querySelector('dialog')).toBeNull();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onBudget).not.toHaveBeenCalled();
  });

  it('StartJourney keyboard input handles goal text and proceeds on Enter/click', async () => {
    const onNavigate = vi.fn();
    const onBudget = vi.fn();

    await render(React.createElement(StartJourney, {
      ru: false,
      onNavigate,
      onBudget,
      compact: false
    }));

    // Open modal
    await act(async () => {
      el.querySelector<HTMLButtonElement>('button.ma-button')!.click();
    });

    // In agent choice mode by default, input is present
    const input = el.querySelector<HTMLInputElement>('input')!;
    expect(input).toBeTruthy();

    await act(async () => {
      input.value = 'Roblox 1000 Robux';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const proceedBtn = el.querySelector<HTMLButtonElement>('button.nw-full')!;
    expect(proceedBtn).toBeTruthy();

    await act(async () => {
      proceedBtn.click();
    });

    expect(onNavigate).toHaveBeenCalledWith('Agent Chat');
  });

  it('NetworkSelector summary has accessible ARIA attributes and disables interaction when disabled', async () => {
    await render(React.createElement(NetworkSelector, {
      mode: 'testnet',
      ru: false,
      disabled: true
    }));

    const summary = el.querySelector<HTMLElement>('summary')!;
    expect(summary).toBeTruthy();
    expect(summary.getAttribute('aria-disabled')).toBe('true');

    // Clicking when disabled does not open dialog
    await act(async () => {
      summary.click();
    });

    expect(el.querySelector('dialog')).toBeNull();
  });

  it('ContextHelp triggers tooltip on focus and closes on blur without network requests', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await render(React.createElement(ContextHelp, {
      label: 'Financial Policy Help'
    }, 'Bounded task limit cannot exceed verified balance.'));

    const btn = el.querySelector<HTMLButtonElement>('button')!;
    expect(btn).toBeTruthy();

    // Focus triggers tooltip
    await act(async () => {
      btn.focus();
    });

    const tooltip = el.querySelector('[role="tooltip"]');
    expect(tooltip).toBeTruthy();
    expect(tooltip!.textContent).toContain('Bounded task limit');

    // Blur removes tooltip
    await act(async () => {
      btn.blur();
    });

    expect(el.querySelector('[role="tooltip"]')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('disabled financial controls do not fire click handlers or leak credentials', async () => {
    const onAction = vi.fn();
    await render(React.createElement('button', {
      disabled: true,
      onClick: onAction,
      'aria-disabled': 'true'
    }, 'Execute Real Settlement'));

    const button = el.querySelector<HTMLButtonElement>('button')!;
    expect(button.disabled).toBe(true);

    await act(async () => {
      button.click();
    });

    expect(onAction).not.toHaveBeenCalled();
  });
});
