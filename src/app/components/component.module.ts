import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AutofocusDirective } from '../directives/autofocus.directive';
import { BackTopComponent } from './back-top/back-top.component';
import { BackTopModule } from './back-top/back-top.module';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { CarouselComponent } from './carousel/carousel.component';
import { EmptyComponent } from './empty/empty.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { ImageModule } from './image/image.module';
import { MessageModule } from './message/message.module';
import { ModalComponent } from './modal/modal.component';
import { PageBarComponent } from './page-bar/page-bar.component';
import { SiderMobileComponent } from './sider-mobile/sider-mobile.component';
import { SiderComponent } from './sider/sider.component';
import { ToolboxComponent } from './toolbox/toolbox.component';
import { WallpaperBoxComponent } from './wallpaper-box/wallpaper-box.component';

@NgModule({
  declarations: [
    AutofocusDirective,
    BreadcrumbComponent,
    CarouselComponent,
    EmptyComponent,
    FooterComponent,
    HeaderComponent,
    ModalComponent,
    PageBarComponent,
    SiderComponent,
    SiderMobileComponent,
    ToolboxComponent,
    WallpaperBoxComponent
  ],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MessageModule, BackTopModule, ImageModule],
  exports: [
    AutofocusDirective,
    BackTopComponent,
    BreadcrumbComponent,
    CarouselComponent,
    EmptyComponent,
    FooterComponent,
    HeaderComponent,
    ModalComponent,
    PageBarComponent,
    SiderComponent,
    SiderMobileComponent,
    ToolboxComponent,
    WallpaperBoxComponent
  ]
})
export class ComponentModule {}
