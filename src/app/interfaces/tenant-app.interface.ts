import { TenantAppStatus, TenantAppType } from './tenant-app.enum';

export interface TenantAppModel {
  appId: string;
  appName: string;
  appDomain: string;
  appUrl: string;
  appLogoUrl: string;
  appFaviconUrl: string;
  appDescription: string;
  appSlogan: string;
  appKeywords: string;
  keywords: string[];
  appLoginUrl: string;
  appAdminUrl: string;
  adminUserId: string;
  appAdminEmail: string;
  adminEmail: string[];
  appType: TenantAppType;
  appStatus: TenantAppStatus;
  appPublished?: Date;
  appCreated: Date;
  appModified: Date;
}
