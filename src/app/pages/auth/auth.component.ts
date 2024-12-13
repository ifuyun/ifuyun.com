import { Wallpaper } from '../../interfaces/wallpaper';

export abstract class AuthComponent {
  abstract wallpaper: Wallpaper | null;

  constructor(protected document: Document) {}

  protected initStyles() {
    this.document.body.classList.add('bg-image');
    this.document.body.style.backgroundImage = `url('${this.wallpaper?.wallpaperUrl2}')`;
  }

  protected clearStyles() {
    this.document.body.classList.remove('bg-image');
    this.document.body.style.backgroundImage = '';
  }
}
