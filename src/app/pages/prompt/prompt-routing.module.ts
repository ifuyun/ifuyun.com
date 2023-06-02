import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PromptArchiveComponent } from './prompt-archive/prompt-archive.component';
import { PromptListComponent } from './prompt-list/prompt-list.component';
import { PromptComponent } from './prompt/prompt.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: PromptListComponent },
  { path: 'category/:category', component: PromptListComponent },
  { path: 'tag/:tag', component: PromptListComponent },
  { path: 'archive', component: PromptArchiveComponent },
  { path: 'archive/:year', component: PromptListComponent },
  { path: 'archive/:year/:month', component: PromptListComponent },
  { path: ':pid', component: PromptComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PromptRoutingModule {}
