import { BaseComponent } from '../../base.component';
import { Wallpaper } from '../../interfaces/wallpaper';

export abstract class AuthComponent extends BaseComponent {
  abstract wallpaper: Wallpaper | null;

  constructor(protected document: Document) {
    super();
  }

  protected initStyles() {
    this.document.body.classList.add('bg-image');
    this.document.body.style.backgroundImage = `url('${this.wallpaper?.wallpaperUrl2}')`;
  }

  protected clearStyles() {
    this.document.body.classList.remove('bg-image');
    this.document.body.style.backgroundImage = '';
  }
}
