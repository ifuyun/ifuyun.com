import { ArchiveData } from 'common/core';
import { PostEntity } from './post';
import { TagEntity } from './tag';
import { TaxonomyEntity } from './taxonomy';
import { Wallpaper } from './wallpaper';

export interface SitemapData {
  posts: PostEntity[];
  postArchives: ArchiveData[];
  wallpaperArchives: ArchiveData[];
  taxonomies: TaxonomyEntity[];
  tags: TagEntity[];
  wallpapers: Wallpaper[];
}
