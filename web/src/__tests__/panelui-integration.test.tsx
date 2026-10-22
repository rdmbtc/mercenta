// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { RollingNumber } from '@/components/panelui/rolling-number';
import { TiltCard } from '@/components/panelui/tilt-card';
import { Kpi } from '@/components/panelui/kpi';
import { Stat } from '@/components/panelui/stat';
import { Planet } from '@/components/panelui/planet';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('PanelUI Components Integration', () => {
  let root: Root;
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });

  it('RollingNumber renders formatted values and preserves numeric tabular layout', async () => {
    await act(async () => {
      root.render(
        <RollingNumber
          value={42.5}
          format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
        />
      );
    });

    expect(host.textContent).toContain('42.50');
    expect(host.querySelector('[data-slot="rolling-number"]')).toBeTruthy();
  });

  it('TiltCard renders with layers and responds to pointer events', async () => {
    await act(async () => {
      root.render(
        <TiltCard tilt={12} color="info" glare>
          <TiltCard.Layer depth={15}>
            <span>Layer Content</span>
          </TiltCard.Layer>
        </TiltCard>
      );
    });

    const tiltRoot = host.querySelector<HTMLElement>('[data-slot="tilt-root"]');
    expect(tiltRoot).toBeTruthy();
    expect(host.textContent).toContain('Layer Content');

    // Simulate pointer move
    await act(async () => {
      const event = typeof PointerEvent !== 'undefined'
        ? new PointerEvent('pointermove', { clientX: 100, clientY: 100, bubbles: true })
        : new MouseEvent('pointermove', { clientX: 100, clientY: 100, bubbles: true } as MouseEventInit);
      tiltRoot?.dispatchEvent(event);
    });

    // Simulate pointer leave
    await act(async () => {
      const event = typeof PointerEvent !== 'undefined'
        ? new PointerEvent('pointerleave', { bubbles: true })
        : new MouseEvent('pointerleave', { bubbles: true });
      tiltRoot?.dispatchEvent(event);
    });
  });

  it('Stat renders label, value and unit properly', async () => {
    await act(async () => {
      root.render(
        <Stat>
          <Stat.Content>
            <Stat.Label>Settlement Time</Stat.Label>
            <Stat.Value>
              18<Stat.Unit>ms</Stat.Unit>
            </Stat.Value>
          </Stat.Content>
          <Stat.Badge>Sub-second Finality</Stat.Badge>
        </Stat>
      );
    });

    expect(host.textContent).toContain('Settlement Time');
    expect(host.textContent).toContain('18ms');
    expect(host.textContent).toContain('Sub-second Finality');
  });

  it('Kpi renders structured metrics and trends', async () => {
    await act(async () => {
      root.render(
        <Kpi surface color="success">
          <Kpi.Header>
            <Kpi.Title>Clearing Volume</Kpi.Title>
          </Kpi.Header>
          <Kpi.Content>
            <Kpi.Value>$12,450</Kpi.Value>
            <Kpi.Trend value={14.2} />
          </Kpi.Content>
        </Kpi>
      );
    });

    expect(host.textContent).toContain('Clearing Volume');
    expect(host.textContent).toContain('$12,450');
    expect(host.textContent).toContain('+14.2%');
  });

  it('Planet renders interactive globe with regional markers', async () => {
    await act(async () => {
      root.render(
        <Planet defaultRotation={[0, 0]} autoRotate={0}>
          <Planet.Globe aria-label="World Test Globe">
            <Planet.Marker lat={38} lng={-97} label="US Territory" count={4} />
            <Planet.Marker lat={48} lng={2} label="EU Territory" count={8} />
          </Planet.Globe>
        </Planet>
      );
    });

    expect(host.querySelector('canvas')).toBeTruthy();
    expect(host.textContent).toContain('US Territory');
    expect(host.textContent).toContain('EU Territory');
  });
});
