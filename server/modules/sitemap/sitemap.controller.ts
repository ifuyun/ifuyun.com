import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as moment from 'moment';
import { EnumChangefreq, SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { PostType, TaxonomyType } from '../../../src/app/config/common.enum';
import { TOOL_LINKS } from '../../../src/app/pages/tool/tool.constant';
import { SitemapItem } from './sitemap.interface';
import { SitemapService } from './sitemap.service';

@Controller()
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService, private readonly configService: ConfigService) {}

  @Get('sitemap.xml')
  async generateRss(@Res() res: Response) {
    const data = await this.sitemapService.getSitemap();
    const siteUrl = this.configService.get('app.api.host');
    const sitemapStream = new SitemapStream({ hostname: siteUrl });
    const links: SitemapItem[] = [
      {
        url: siteUrl,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: siteUrl + '/archive',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: siteUrl + '/wallpaper',
        changefreq: EnumChangefreq.DAILY,
        priority: 1
      },
      {
        url: siteUrl + '/tool',
        changefreq: EnumChangefreq.WEEKLY,
        priority: 1
      }
    ];
    const pages: SitemapItem[] = data.posts
      .filter((item) => item.postType === PostType.PAGE)
      .map((item) => ({
        url: siteUrl + item.postGuid,
        changefreq: EnumChangefreq.WEEKLY,
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
    const wallpapersCn: SitemapItem[] = data.wallpapers
      .filter((item) => !!item.bingIdCn)
      .map((item) => ({
        url: `${siteUrl}/wallpaper/${item.wallpaperId}`,
        changefreq: EnumChangefreq.DAILY,
        priority: 0.8
      }));
    const wallpapersEn: SitemapItem[] = data.wallpapers
      .filter((item) => !!item.bingIdEn)
      .map((item) => ({
        url: `${siteUrl}/wallpaper/${item.wallpaperId}?lang=en`,
        changefreq: EnumChangefreq.DAILY,
        priority: 0.8
      }));
    const archives: SitemapItem[] = data.archives.map((item) => ({
      url: `${siteUrl}/archive/${item.dateText}`,
      changefreq: EnumChangefreq.MONTHLY,
      priority: 0.8
    }));
    const taxonomies: SitemapItem[] = data.taxonomies.map((item) => ({
      url: `${siteUrl}/${item.taxonomyType === TaxonomyType.POST ? 'category' : 'tag'}/${item.taxonomySlug}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const tools: SitemapItem[] = TOOL_LINKS.map((item) => ({
      url: siteUrl + item.url,
      changefreq: <EnumChangefreq>item.changefreq,
      priority: item.priority
    }));

    streamToPromise(
      Readable.from(links.concat(pages, posts, wallpapersCn, wallpapersEn, archives, taxonomies, tools)).pipe(
        sitemapStream
      )
    ).then((data) => res.header('Content-Type', 'text/xml').send(data.toString()));
  }
}
