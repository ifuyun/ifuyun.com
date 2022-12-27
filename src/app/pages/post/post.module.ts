import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HIGHLIGHT_OPTIONS, HighlightModule, HighlightOptions } from 'ngx-highlightjs';
import { ComponentModule } from '../../components/component.module';
import { MessageModule } from '../../components/message/message.module';
import { PipesModule } from '../../pipes/pipes.module';
import { PostArchiveComponent } from './post-archive/post-archive.component';
import { PostListComponent } from './post-list/post-list.component';
import { PostRoutingModule } from './post-routing.module';
import { PostComponent } from './post/post.component';
import { PostListBoxComponent } from './post-list-box/post-list-box.component';

@NgModule({
  declarations: [PostListComponent, PostComponent, PostArchiveComponent, PostListBoxComponent],
  imports: [
    CommonModule,
    PostRoutingModule,
    ComponentModule,
    PipesModule,
    FormsModule,
    ReactiveFormsModule,
    HighlightModule,
    MessageModule
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
  exports: [PostListComponent, PostComponent, PostArchiveComponent, PostListBoxComponent]
})
export class PostModule {}
