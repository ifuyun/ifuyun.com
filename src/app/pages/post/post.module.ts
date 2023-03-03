import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HIGHLIGHT_OPTIONS, HighlightModule, HighlightOptions } from 'ngx-highlightjs';
import { PostArchiveComponent } from './post-archive/post-archive.component';
import { PostItemComponent } from './post-item/post-item.component';
import { PostListViewComponent } from './post-list-view/post-list-view.component';
import { PostListComponent } from './post-list/post-list.component';
import { PostRoutingModule } from './post-routing.module';
import { PostComponent } from './post/post.component';

@NgModule({
  imports: [
    CommonModule,
    PostRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HighlightModule,
    PostListComponent,
    PostComponent,
    PostArchiveComponent,
    PostListViewComponent,
    PostItemComponent
  ],
  providers: [
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: <HighlightOptions>{
        lineNumbers: false,
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        languages: {
          typescript: () => import('highlight.js/lib/languages/typescript'),
          javascript: () => import('highlight.js/lib/languages/javascript'),
          json: () => import('highlight.js/lib/languages/json'),
          css: () => import('highlight.js/lib/languages/css'),
          less: () => import('highlight.js/lib/languages/less'),
          scss: () => import('highlight.js/lib/languages/scss'),
          xml: () => import('highlight.js/lib/languages/xml'),
          php: () => import('highlight.js/lib/languages/php'),
          java: () => import('highlight.js/lib/languages/java'),
          python: () => import('highlight.js/lib/languages/python'),
          ruby: () => import('highlight.js/lib/languages/ruby'),
          sql: () => import('highlight.js/lib/languages/sql'),
          bash: () => import('highlight.js/lib/languages/bash'),
          nginx: () => import('highlight.js/lib/languages/nginx'),
          ini: () => import('highlight.js/lib/languages/ini')
        }
      }
    }
  ],
  exports: [PostListComponent, PostComponent, PostArchiveComponent, PostListViewComponent, PostItemComponent]
})
export class PostModule {}
