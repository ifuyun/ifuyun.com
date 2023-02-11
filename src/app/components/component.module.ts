import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AutofocusDirective } from '../directives/autofocus.directive';
import { PipesModule } from '../pipes/pipes.module';
import { BackTopComponent } from './back-top/back-top.component';
import { BackTopModule } from './back-top/back-top.module';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { CarouselComponent } from './carousel/carousel.component';
import { CommentComponent } from './comment/comment.component';
import { EmptyComponent } from './empty/empty.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { ImageModule } from './image/image.module';
import { JdUnionGoodsGroupComponent } from './jd-union-goods-group/jd-union-goods-group.component';
import { JdUnionGoodsComponent } from './jd-union-goods/jd-union-goods.component';
import { LayoutComponent } from './layout/layout.component';
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
    CommentComponent,
    EmptyComponent,
    FooterComponent,
    HeaderComponent,
    JdUnionGoodsComponent,
    JdUnionGoodsGroupComponent,
    LayoutComponent,
    ModalComponent,
    PageBarComponent,
    SiderComponent,
    SiderMobileComponent,
    ToolboxComponent,
    WallpaperBoxComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    BackTopModule,
    ImageModule,
    PipesModule
  ],
  exports: [
    AutofocusDirective,
    BackTopComponent,
    BreadcrumbComponent,
    CarouselComponent,
    CommentComponent,
    EmptyComponent,
    FooterComponent,
    HeaderComponent,
    JdUnionGoodsComponent,
    JdUnionGoodsGroupComponent,
    LayoutComponent,
    ModalComponent,
    PageBarComponent,
    SiderComponent,
    SiderMobileComponent,
    ToolboxComponent,
    WallpaperBoxComponent
  ]
})
export class ComponentModule {}
