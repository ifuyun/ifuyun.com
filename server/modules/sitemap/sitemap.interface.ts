import { EnumChangefreq } from 'sitemap';
import { ArchiveData } from '../../../src/app/core/common.interface';
import { TagEntity } from '../../../src/app/interfaces/tag.interface';
import { TaxonomyEntity } from '../../../src/app/interfaces/taxonomy.interface';
import { PostEntity } from '../../../src/app/pages/post/post.interface';
import { Wallpaper } from '../../../src/app/pages/wallpaper/wallpaper.interface';

export interface SitemapData {
  posts: PostEntity[];
  postArchives: ArchiveData[];
  promptArchives: ArchiveData[];
  wallpaperArchives: ArchiveData[];
  taxonomies: TaxonomyEntity[];
  tags: TagEntity[];
  wallpapers: Wallpaper[];
}

export interface SitemapItem {
  url: string;
  changefreq: EnumChangefreq;
  priority: number;
  lastmod?: string;
}
