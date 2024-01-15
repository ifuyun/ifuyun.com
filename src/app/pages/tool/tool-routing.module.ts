import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Base64Component } from './base64/base64.component';
import { Md5Component } from './md5/md5.component';
import { MurmurhashComponent } from './murmurhash/murmurhash.component';
import { ShoppingComponent } from './shopping/shopping.component';
import { ToolComponent } from './tool/tool.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: ToolComponent },
  { path: 'shopping', component: ShoppingComponent },
  { path: 'md5', component: Md5Component },
  { path: 'murmurhash', component: MurmurhashComponent },
  { path: 'base64', component: Base64Component }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ToolRoutingModule {}
