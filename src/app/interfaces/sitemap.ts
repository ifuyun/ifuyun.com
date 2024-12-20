import { ArchiveData } from './common';
import { PostEntity } from './post';
import { TagEntity, TaxonomyEntity } from './taxonomy';
import { Wallpaper } from './wallpaper';

export interface SitemapData {
  posts: PostEntity[];
  postArchives: ArchiveData[];
  promptArchives: ArchiveData[];
  wallpaperArchives: ArchiveData[];
  taxonomies: TaxonomyEntity[];
  tags: TagEntity[];
  wallpapers: Wallpaper[];
}
