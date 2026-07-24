import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from 'common/components';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);

export default bootstrap;
