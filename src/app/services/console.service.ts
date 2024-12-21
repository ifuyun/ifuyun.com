import { Injectable } from '@angular/core';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root'
})
export class ConsoleService {
  private console: Console;

  constructor(private readonly platform: PlatformService) {
    this.console = platform.isBrowser ? window.console : console;
  }

  assert(condition?: boolean, ...data: any[]): void {
    if (this.console) {
      this.console.assert(condition, ...data);
    }
  }

  clear(): void {
    if (this.console) {
      this.console.clear();
    }
  }

  count(label?: string): void {
    if (this.console) {
      this.console.count(label);
    }
  }

  countReset(label?: string): void {
    if (this.console) {
      this.console.countReset(label);
    }
  }

  debug(...data: any[]): void {
    if (this.console) {
      this.console.debug(...data);
    }
  }

  dir(item?: any, options?: any): void {
    if (this.console) {
      this.console.dir(item, options);
    }
  }

  dirxml(...data: any[]): void {
    if (this.console) {
      this.console.dirxml(...data);
    }
  }

  error(...data: any[]): void {
    if (this.console) {
      this.console.error(...data);
    }
  }

  group(...data: any[]): void {
    if (this.console) {
      this.console.group(...data);
    }
  }

  groupCollapsed(...data: any[]): void {
    if (this.console) {
      this.console.groupCollapsed(...data);
    }
  }

  groupEnd(): void {
    if (this.console) {
      this.console.groupEnd();
    }
  }

  info(...data: any[]): void {
    if (this.console) {
      this.console.info(...data);
    }
  }

  log(...data: any[]): void {
    if (this.console) {
      this.console.log(...data);
    }
  }

  table(tabularData?: any, properties?: string[]): void {
    if (this.console) {
      this.console.table(tabularData, properties);
    }
  }

  time(label?: string): void {
    if (this.console) {
      this.console.time(label);
    }
  }

  timeEnd(label?: string): void {
    if (this.console) {
      this.console.timeEnd(label);
    }
  }

  timeLog(label?: string, ...data: any[]): void {
    if (this.console) {
      this.console.timeLog(label, ...data);
    }
  }

  timeStamp(label?: string): void {
    if (this.console) {
      this.console.timeStamp(label);
    }
  }

  trace(...data: any[]): void {
    if (this.console) {
      this.console.trace(...data);
    }
  }

  warn(...data: any[]): void {
    if (this.console) {
      this.console.warn(...data);
    }
  }
}
