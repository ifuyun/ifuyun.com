import { Controller, Get, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { EnumChangefreq, SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { PostType, TaxonomyType } from '../../src/app/config/common.enum';
import { SitemapItem } from './sitemap.interface';
import { SitemapService } from './sitemap.service';

@Controller()
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService, private readonly configService: ConfigService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'text/xml')
  async generateRss() {
    const data = await this.sitemapService.getSitemap();
    const siteUrl = this.configService.get('app.api.host');
    const sitemapStream = new SitemapStream({ hostname: siteUrl });
    const links: SitemapItem[] = [
      {
        url: siteUrl,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      }
    ];
    const pages: SitemapItem[] = data.posts
      .filter((item) => item.postType === PostType.PAGE)
      .map((item) => ({
        url: siteUrl + item.postGuid,
        changefreq: EnumChangefreq.MONTHLY,
        priority: 1,
        lastmod: moment(item.postModified).format()
      }));
    const posts: SitemapItem[] = data.posts
      .filter((item) => item.postType === PostType.POST)
      .map((item) => ({
        url: siteUrl + item.postGuid,
        changefreq: EnumChangefreq.DAILY,
        priority: 0.9,
        lastmod: moment(item.postModified).format()
      }));
    const wallpapers: SitemapItem[] = data.wallpapers.map((item) => ({
      url: `${siteUrl}/wallpaper/${item.wallpaperId}`,
      changefreq: EnumChangefreq.YEARLY,
      priority: 0.8
    }));
    const archives: SitemapItem[] = data.archives.map((item) => ({
      url: `${siteUrl}/archive/${item.dateText}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.8
    }));
    const taxonomies: SitemapItem[] = data.taxonomies.map((item) => ({
      url: `${siteUrl}/${item.taxonomyType === TaxonomyType.POST ? 'category' : 'tag'}/${item.taxonomySlug}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));

    return streamToPromise(
      Readable.from(links.concat(pages, posts, wallpapers, archives, taxonomies)).pipe(sitemapStream)
    ).then((data) => data.toString());
  }
}
