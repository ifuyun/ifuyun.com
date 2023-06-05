import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PromptListComponent } from './prompt-list/prompt-list.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: PromptListComponent },
  { path: 'category/:category', component: PromptListComponent },
  { path: 'tag/:tag', component: PromptListComponent },
  { path: 'archive/:year', component: PromptListComponent },
  { path: 'archive/:year/:month', component: PromptListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PromptRoutingModule {}
