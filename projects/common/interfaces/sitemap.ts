import { ArchiveData } from 'common/core';
import { PostModel } from './post';
import { TagVo } from './tag';
import { CategoryVo } from './category';
import { Wallpaper } from './wallpaper';

export interface SitemapData {
  posts: PostModel[];
  postArchives: ArchiveData[];
  wallpaperArchives: ArchiveData[];
  categories: CategoryVo[];
  tags: TagVo[];
  wallpapers: Wallpaper[];
}
