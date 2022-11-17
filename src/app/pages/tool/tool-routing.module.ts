import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShoppingComponent } from './shopping/shopping.component';

const routes: Routes = [
  { path: 'shopping', pathMatch: 'full', component: ShoppingComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ToolRoutingModule {}
