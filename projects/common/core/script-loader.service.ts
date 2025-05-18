import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScriptLoaderService {
  private loadedScripts: { [key: string]: boolean } = {};

  /**
   * 动态加载外部 JavaScript 文件
   * @param src 外部脚本的 URL
   * @param force 是否重新加载
   * @returns Promise<void> 加载成功或失败的 Promise
   */
  loadScript(src: string, force = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (force) {
        this.removeScript(src);
      }
      // 如果脚本已加载过，直接返回成功
      if (this.loadedScripts[src]) {
        resolve();
        return;
      }

      // 创建 <script> 标签
      const script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      script.async = true;

      // 加载成功
      script.onload = () => {
        this.loadedScripts[src] = true; // 标记为已加载
        resolve();
      };

      // 加载失败
      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      // 将 <script> 添加到 <body>
      document.body.appendChild(script);
    });
  }

  removeScript(src: string): void {
    const $script = Array.from(document.getElementsByTagName('script')).find(
      (item) => item.getAttribute('src') === src
    );
    if ($script) {
      document.body.removeChild($script);
      this.loadedScripts[src] = false;
    }
  }
}
