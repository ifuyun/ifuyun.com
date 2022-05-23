export interface MetaData {
  metaKey: string;
  metaValue: string;
}

export interface IPLocation {
  IP?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionCode?: string;
  city?: string;
  district?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  ISP?: string;
  org?: string;
}
