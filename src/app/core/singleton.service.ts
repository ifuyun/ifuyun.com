import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SingletonService {
  private singletonRegistry = new Map<string, { target: any; }>();

  registerSingleton(key: string, target: any) {
    const isExist = this.singletonRegistry.has(key);
    if (!isExist) {
      this.singletonRegistry.set(key, { target });
    }
  }

  getSingleton(key: string) {
    return this.singletonRegistry.has(key) ? this.singletonRegistry.get(key)!.target : null;
  }
}
