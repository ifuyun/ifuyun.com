export interface AdsenseConfig {
  clientId: string;
  slotId: string | number;
  format?: string;
  responsive?: boolean;
  className?: string | string[];
  display?: string;
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  region?: string;
  testMode?: boolean;
}
