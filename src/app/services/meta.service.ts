import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { HTMLMetaData } from '../interfaces/meta';

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  constructor(
    private readonly meta: Meta,
    private readonly title: Title
  ) {}

  updateHTMLMeta(meta: HTMLMetaData) {
    this.title.setTitle(meta.title);

    const descTag = this.meta.getTag('name="description"');
    this.meta[descTag ? 'updateTag' : 'addTag']({
      name: 'description',
      content: meta.description
    });

    const authorTag = this.meta.getTag('name="author"');
    this.meta[authorTag ? 'updateTag' : 'addTag']({
      name: 'author',
      content: meta.author || ''
    });

    const keywordsTag = this.meta.getTag('name="keywords"');
    this.meta[keywordsTag ? 'updateTag' : 'addTag']({
      name: 'keywords',
      content: meta.keywords || ''
    });
  }
}
