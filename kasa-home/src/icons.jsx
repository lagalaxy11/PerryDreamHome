import React from 'react';

const Icon = ({ children, size = 18, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    {children}
  </svg>
);

export const HomeIcon = (p) => <Icon {...p}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></Icon>;
export const PowerIcon = (p) => <Icon {...p}><path d="M12 3v9" /><path d="M6.3 6.3a8 8 0 1 0 11.4 0" /></Icon>;
export const LeafIcon = (p) => <Icon {...p}><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15" /><path d="M5 19l7-7" /></Icon>;
export const SnowIcon = (p) => <Icon {...p}><path d="M12 2v20M4 6l16 12M20 6L4 18" /><path d="M9 4l3 2 3-2M9 20l3-2 3 2" /></Icon>;
export const SunIcon = (p) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
export const DropIcon = (p) => <Icon {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></Icon>;
export const FanIcon = (p) => <Icon {...p}><circle cx="12" cy="12" r="1.5" /><path d="M12 10.5C12 6 13 3 16 3s3 4-4 7.5M13.5 12c4.5 0 7.5 1 7.5 4s-4 3-7.5-4M12 13.5c0 4.5-1 7.5-4 7.5s-3-4 4-7.5M10.5 12C6 12 3 11 3 8s4-3 7.5 4" /></Icon>;
export const MoonIcon = (p) => <Icon {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></Icon>;
export const WindIcon = (p) => <Icon {...p}><path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7" /></Icon>;
export const BackIcon = (p) => <Icon {...p}><path d="M15 18l-6-6 6-6" /></Icon>;
export const ChevronIcon = (p) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>;
export const BulbIcon = (p) => <Icon {...p}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></Icon>;
export const PlusIcon = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const MinusIcon = (p) => <Icon {...p}><path d="M5 12h14" /></Icon>;
export const ThermoIcon = (p) => <Icon {...p}><path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z" /></Icon>;
export const PlugIcon = (p) => <Icon {...p}><path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0V7zM12 17v5" /></Icon>;
export const RadarIcon = (p) => <Icon {...p}><path d="M5 12a7 7 0 0 1 7-7M8.5 12A3.5 3.5 0 0 1 12 8.5" /><circle cx="12" cy="12" r="1" /><path d="M19 12a7 7 0 0 1-7 7" /></Icon>;
