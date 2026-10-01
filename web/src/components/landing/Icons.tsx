import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function make(paths: React.ReactNode) {
  return function Icon({ size = 18, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...rest}
      >
        {paths}
      </svg>
    );
  };
}

export const ArrowRight = make(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>);
export const ArrowUpRight = make(<><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>);
export const Check = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const X = make(<><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>);
export const Pause = make(<><path d="M9 6v12" /><path d="M15 6v12" /></>);
export const Shield = make(<><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6Z" /><path d="m9 12 2 2 4-4" /></>);
export const Flame = make(<path d="M12 3c.5 3.5 4.5 5.5 4.5 10a4.5 4.5 0 0 1-9 0c0-2 1-3.5 2-4.5.3 1.5 1 2.5 2 3 0-3 .5-6 .5-8.5Z" />);
export const TrendDown = make(<><path d="m3 7 6 6 4-4 8 8" /><path d="M21 11v6h-6" /></>);
export const Ghost = make(<><path d="M5 20V10a7 7 0 0 1 14 0v10l-2.5-2-2.5 2-2-2-2 2-2.5-2Z" /><path d="M9.5 10.5h.01M14.5 10.5h.01" /></>);
export const Bot = make(<><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 4v4M9 13h.01M15 13h.01M9.5 17h5" /></>);
export const Scale = make(<><path d="M12 4v16M7 20h10M5 8h14" /><path d="m5 8-2.5 6a3 3 0 0 0 5 0Z" /><path d="m19 8-2.5 6a3 3 0 0 0 5 0Z" /></>);
export const Key = make(<><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l2 2M15 8l2 2" /></>);
export const Receipt = make(<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>);
export const Cpu = make(<><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M10 10h4v4h-4zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>);
export const Code = make(<><path d="m8 7-5 5 5 5" /><path d="m16 7 5 5-5 5" /></>);
export const Gamepad = make(<><rect x="2" y="7" width="20" height="11" rx="4" /><path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 14h.01" /></>);
export const Play = make(<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3Z" /></>);
export const Heart = make(<path d="M12 20s-7.5-4.4-7.5-10A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" />);
export const Lock = make(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const Menu = make(<><path d="M4 7h16M4 12h16M4 17h16" /></>);
export const Reset = make(<><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4h4" /></>);
