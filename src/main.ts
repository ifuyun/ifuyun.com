import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

function bootstrap() {
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
  /*
    The following code is used for CSR:
    bootstrapApplication(AppComponent, {
      providers: [
        importProvidersFrom(
          BrowserModule.withServerTransition({ appId: 'ifuyun' }),
          TransferHttpCacheModule,
          AppRoutingModule,
          FormsModule,
          ReactiveFormsModule
        ),
        httpInterceptorProviders,
        { provide: APP_BASE_HREF, useValue: env.host },
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations()
      ]
    }).catch((err) => console.error(err));
  */
}

if (document.readyState === 'complete') {
  bootstrap();
} else {
  document.addEventListener('DOMContentLoaded', bootstrap);
}
