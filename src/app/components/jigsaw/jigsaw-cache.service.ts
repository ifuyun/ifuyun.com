import { Injectable } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';
import { COOKIE_KEY_UV_ID } from '../../config/common.constant';
import { CommonService } from '../../services/common.service';
import { PlatformService } from '../../services/platform.service';
import { SsrCookieService } from '../../services/ssr-cookie.service';
import { JigsawCacheData, JigsawCacheDB } from './jigsaw.interface';

@Injectable({ providedIn: 'root' })
export class JigsawCacheService {
  private readonly storeName = 'progress';

  private dbPromise?: Promise<IDBPDatabase<JigsawCacheDB>>;

  constructor(
    private readonly platform: PlatformService,
    private readonly commonService: CommonService,
    private readonly cookieService: SsrCookieService
  ) {
    if (this.platform.isBrowser) {
      this.dbPromise = openDB<JigsawCacheDB>('jigsaw', 1, {
        upgrade: (db) => {
          db.createObjectStore(this.storeName);
        }
      });
    }
  }

  async saveProgress(key: string, data: JigsawCacheData): Promise<void> {
    if (!this.dbPromise) {
      return;
    }
    const faId = this.cookieService.get(COOKIE_KEY_UV_ID);
    const cacheData = JSON.stringify(data);
    const signature = await this.commonService.generateHmacSignature(cacheData, faId);
    const db = await this.dbPromise;

    await db.put(
      this.storeName,
      {
        data: window.btoa(cacheData),
        sign: signature
      },
      key
    );
  }

  async loadProgress(key: string): Promise<JigsawCacheData | null> {
    if (!this.dbPromise) {
      return null;
    }
    const db = await this.dbPromise;
    const record = await db.get(this.storeName, key);
    if (!record) {
      return null;
    }

    const faId = this.cookieService.get(COOKIE_KEY_UV_ID);
    const cacheData = window.atob(record.data);
    const signature = await this.commonService.generateHmacSignature(cacheData, faId);
    if (record.sign === signature) {
      try {
        return JSON.parse(cacheData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  async clearProgress(key: string): Promise<void> {
    if (!this.dbPromise) {
      return;
    }
    const db = await this.dbPromise;

    await db.delete(this.storeName, key);
  }
}
