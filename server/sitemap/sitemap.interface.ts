import { EnumChangefreq } from 'sitemap';
import { TaxonomyEntity } from '../../src/app/interfaces/taxonomy.interface';
import { PostArchiveDate, PostEntity } from '../../src/app/pages/post/post.interface';
import { Wallpaper } from '../../src/app/pages/wallpaper/wallpaper.interface';

export interface SitemapData {
  posts: PostEntity[];
  archives: PostArchiveDate[];
  taxonomies: TaxonomyEntity[];
  wallpapers: Wallpaper[];
}

export interface SitemapItem {
  url: string;
  changefreq: EnumChangefreq;
  priority: number;
  lastmod?: string;
}
