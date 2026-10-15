import type { SVGProps } from "react";

/** Small line-icon set. Icons are decorative; put the meaning in adjacent text. */

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const ArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

export const Speaker = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Svg>
);

export const StopSquare = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
  </Svg>
);

export const Heart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" />
  </Svg>
);

export const Eye = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);

export const Leaf = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" />
    <path d="M5 19c2-4 5-7 9-9" />
  </Svg>
);

export const Stethoscope = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 4v5a4 4 0 0 0 8 0V4" />
    <path d="M10 13v2.500a4.500 4.500 0 0 0 9 0V14" />
    <circle cx="19" cy="12" r="2" />
  </Svg>
);

export const MapPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-6.500-5.600-6.500-11a6.500 6.500 0 0 1 13 0c0 5.400-6.500 11-6.500 11z" />
    <circle cx="12" cy="10" r="2.400" />
  </Svg>
);

export const BookOpen = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6.500C10 5 7 4.500 4 5v13c3-.5 6 0 8 1.500 2-1.500 5-2 8-1.500V5c-3-.5-6 0-8 1.500zM12 6.500v13" />
  </Svg>
);

export const ChatQuestion = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6.500A2.500 2.500 0 0 1 6.500 4h11A2.500 2.500 0 0 1 20 6.500v7a2.500 2.500 0 0 1-2.500 2.500H11l-4.500 4v-4A2.500 2.500 0 0 1 4 13.500z" />
    <path d="M10 8.700a2 2 0 1 1 2.800 1.800c-.5.300-.8.700-.8 1.200M12 13.600v.1" />
  </Svg>
);

export const Printer = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 9V4h10v5M7 17H5a1.500 1.500 0 0 1-1.500-1.500v-5A1.500 1.500 0 0 1 5 9h14a1.500 1.500 0 0 1 1.500 1.500v5A1.500 1.500 0 0 1 19 17h-2" />
    <rect x="7" y="14" width="10" height="6" rx="1" />
  </Svg>
);

export const Phone = (p: IconProps) => (
  <Svg {...p}>
    <rect x="7" y="2.500" width="10" height="19" rx="2.500" />
    <path d="M11 18.500h2" />
  </Svg>
);

export const Check = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.500l4.500 4.500L19 7.500" />
  </Svg>
);

export const Close = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const Mic = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3" />
  </Svg>
);

export const Backspace = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7 6-7z" />
    <path d="M12 9.500l5 5M17 9.500l-5 5" />
  </Svg>
);

export const Info = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.500M12 7.600v.1" />
  </Svg>
);

export const Lock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="10.500" width="14" height="10" rx="2.500" />
    <path d="M8 10.500V8a4 4 0 0 1 8 0v2.500" />
  </Svg>
);

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);
