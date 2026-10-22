'use client';

/**
 * RollingNumber — a number whose digits roll to their new values.
 * From PanelUI (https://panelui.dev/docs/components/rolling-number)
 *
 * ```tsx
 * <RollingNumber value={events} />
 * <RollingNumber value={balance} format={{ style: 'currency', currency: 'USD' }} />
 * ```
 */
import { useMemo, type ComponentProps } from 'react';
import { tv } from 'tailwind-variants';

const rollingNumberVariants = tv({
  slots: {
    // `tabular-nums` so a 1 is as wide as an 8 and the number does not change
    // width, and shove whatever is beside it, while it rolls.
    root: 'inline-flex items-baseline tabular-nums',
    column: 'relative inline-block',
    window: 'absolute inset-0 overflow-hidden',
    strip:
      'absolute inset-x-0 top-0 block h-[1000%] transition-transform ease-[cubic-bezier(0.2,0,0,1)] will-change-transform motion-reduce:transition-none',
    digit: 'block h-[10%] text-center',
  },
});

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export interface RollingNumberProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** The number to show. Each digit rolls to its new value on its own. */
  value: number;
  /**
   * How the number is written: currency, percent, compact notation, how many
   * decimals. Passed to `Intl.NumberFormat`.
   */
  format?: Intl.NumberFormatOptions;
  /**
   * The locale the number is written in. Defaults to `en-US` rather than the
   * browser's, so a page rendered on a server writes the same thing the
   * browser then does.
   */
  locales?: Intl.LocalesArgument;
  /** How long a digit takes to roll, in milliseconds. */
  duration?: number;
}

interface Piece {
  key: string;
  /** A digit to roll to, or `null` for a character that is just written. */
  digit: number | null;
  text: string;
}

/** Splits a formatted number into rolling digits and the characters around them. */
function piecesOf(parts: Intl.NumberFormatPart[]): Piece[] {
  let whole = parts.reduce(
    (count, part) => (part.type === 'integer' ? count + part.value.length : count),
    0
  );
  let fraction = 0;
  const pieces: Piece[] = [];

  parts.forEach((part, index) => {
    if (part.type === 'integer' || part.type === 'fraction') {
      for (const character of part.value) {
        const digit = character >= '0' && character <= '9' ? Number(character) : null;
        const key = part.type === 'integer' ? `i${(whole -= 1)}` : `f${(fraction += 1)}`;
        pieces.push({ key, digit, text: character });
      }
      return;
    }
    const key = part.type === 'group' ? `g${whole}` : `${part.type}${index}`;
    pieces.push({ key, digit: null, text: part.value });
  });

  return pieces;
}

export function RollingNumber({
  value,
  format,
  locales = 'en-US',
  duration = 600,
  className,
  ...props
}: RollingNumberProps) {
  const slots = rollingNumberVariants();

  const formatKey = JSON.stringify(format ?? null);
  const formatter = useMemo(
    () => new Intl.NumberFormat(locales, format),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locales, formatKey]
  );

  const { label, pieces } = useMemo(() => {
    const parts = formatter.formatToParts(value);
    return { label: parts.map((part) => part.value).join(''), pieces: piecesOf(parts) };
  }, [formatter, value]);

  return (
    <span className={slots.root({ className })} {...props}>
      {/* What a screen reader gets: the number, once, as it is written. */}
      <span className="sr-only">{label}</span>
      {pieces.map((piece) =>
        piece.digit === null ? (
          <span key={piece.key} aria-hidden="true">
            {piece.text}
          </span>
        ) : (
          <span key={piece.key} aria-hidden="true" className={slots.column()}>
            <span className="invisible">0</span>
            <span className={slots.window()}>
              <span
                className={slots.strip()}
                style={{
                  transform: `translateY(${-piece.digit * 10}%)`,
                  transitionDuration: `${duration}ms`,
                }}
              >
                {DIGITS.map((digit) => (
                  <span key={digit} className={slots.digit()}>
                    {digit}
                  </span>
                ))}
              </span>
            </span>
          </span>
        )
      )}
    </span>
  );
}
RollingNumber.displayName = 'RollingNumber';
