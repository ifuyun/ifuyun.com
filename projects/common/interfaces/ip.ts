export interface IPAddress {
  country: string;
  province: string;
  city: string;
  district: string;
}

export interface IPInfo extends IPAddress {
  IP?: number;
  IPStr?: string;
  startIP?: number;
  startIPStr?: string;
  endIP?: number;
  endIPStr?: string;
  isp: string;
}

export interface IPResult {
  list: Record<string, IPInfo>;
  version: string;
}
