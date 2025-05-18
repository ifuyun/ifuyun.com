import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from 'common/components';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
