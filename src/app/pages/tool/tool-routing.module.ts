import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Md5Component } from './md5/md5.component';
import { ShoppingComponent } from './shopping/shopping.component';

const routes: Routes = [
  { path: 'shopping', component: ShoppingComponent },
  { path: 'md5', component: Md5Component }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ToolRoutingModule {}
