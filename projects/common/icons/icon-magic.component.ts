import { Component } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'fi-magic',
  imports: [NzIconModule],
  template: `
    <nz-icon>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        <path
          d="M5.5 2.672a.5.5 0 1 0 1 0v-1.829a.5.5 0 1 0-1 0zm-3.5.035a.5.5 0 0 1 .707-.707l1.293 1.293a.5.5 0 0 1 -.707.707zM8.707 4a.5.5 0 0 1 -.707-.707l1.293-1.293a.5.5 0 0 1 .707.707zm.621 2.5a.5.5 0 0 1 0-1h1.829a.5.5 0 0 1 0 1zm-8.485 0a.5.5 0 0 1 0-1h1.829a.5.5 0 0 1 0 1zM2.707 10a.5.5 0 0 1 -.707-.707l1.293-1.293a.5.5 0 0 1 .707.707zM6.5 11.157a.5.5 0 0 1-1 0v-1.829a.5.5 0 0 1 1 0zm-1.854-5.097a.5.5 0 0 1 0-.706l.708-.708a.5.5 0 0 1 .707 0l1.293 1.293a.5.5 0 0 1 0 .707l-.708.708a.5.5 0 0 1-.707 0zm3 3a.5.5 0 0 1 0-.706l.708-.708a.5.5 0 0 1 .707 0l6.293 6.294a.5.5 0 0 1 0 .707l-.708.708a.5.5 0 0 1-.707 0z"
        />
      </svg>
    </nz-icon>
  `
})
export class IconMagicComponent {}
