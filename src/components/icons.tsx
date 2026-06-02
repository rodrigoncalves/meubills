import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & { size?: number };

function base({ size = 24, strokeWidth = 1.8, ...props }: IconProps & { strokeWidth?: number }) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
  </svg>
);

export const ListIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" strokeWidth={2.4} />
  </svg>
);

export const CardIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.5" y="5" width="19" height="14" rx="3" />
    <path d="M2.5 9.5h19" />
  </svg>
);

export const MoreIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const ArrowUpIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const ArrowDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.2 6.3A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 3.8-.8" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

export const ReceiptIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12.5l4.5 4.5L19 6.5" strokeWidth={2.2} />
  </svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const TransferIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
  </svg>
);

/** Diagonal up-right arrow (income). */
export const TrendUpIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

/** Diagonal down-right arrow (expense). */
export const TrendDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 7l10 10M17 9v8H9" />
  </svg>
);
