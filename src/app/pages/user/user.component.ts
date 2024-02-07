import { PageComponent } from '../../core/page.component';
import { Wallpaper } from '../wallpaper/wallpaper.interface';

export abstract class UserComponent extends PageComponent {
  abstract wallpaper: Wallpaper | null;

  constructor(protected document: Document) {
    super();
  }

  protected initStyles() {
    this.document.body.classList.add('bg-image');
    this.document.body.style.backgroundImage = `url('${this.wallpaper?.wallpaperUrl}')`;
  }

  protected clearStyles() {
    this.document.body.classList.remove('bg-image');
    this.document.body.style.backgroundImage = '';
  }
}
