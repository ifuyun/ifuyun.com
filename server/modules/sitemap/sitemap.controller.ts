import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { uniq } from 'lodash';
import * as moment from 'moment';
import { EnumChangefreq, SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { PostType } from '../../../src/app/config/common.enum';
import { TOOL_LINKS, TOOL_URL_ENTRY } from '../../../src/app/pages/tool/tool.constant';
import { SitemapItem } from './sitemap.interface';
import { SitemapService } from './sitemap.service';

@Controller()
export class SitemapController {
  constructor(
    private readonly sitemapService: SitemapService,
    private readonly configService: ConfigService
  ) {}

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
        url: siteUrl + '/post',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: siteUrl + '/wallpaper',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 1
      },
      {
        url: siteUrl + '/post/archive',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.9
      },
      {
        url: siteUrl + '/wallpaper/archive',
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.9
      },
      {
        url: siteUrl + TOOL_URL_ENTRY,
        changefreq: EnumChangefreq.WEEKLY,
        priority: 0.9
      }
    ];
    const pages: SitemapItem[] = data.posts
      .filter((item) => item.postType === PostType.PAGE)
      .map((item) => ({
        url: siteUrl + item.postGuid,
        changefreq: EnumChangefreq.DAILY,
        priority: 1,
        lastmod: moment(item.postModified).format()
      }));
    const posts: SitemapItem[] = data.posts
      .filter((item) => item.postType === PostType.POST)
      .map((item) => ({
        url: siteUrl + item.postGuid,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.9,
        lastmod: moment(item.postModified).format()
      }));
    const wallpapersCn: SitemapItem[] = data.wallpapers
      .filter((item) => !!item.bingIdCn)
      .map((item) => ({
        url: `${siteUrl}/wallpaper/${item.wallpaperId}`,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.9,
        lastmod: moment(item.wallpaperModified).format()
      }));
    const wallpapersEn: SitemapItem[] = data.wallpapers
      .filter((item) => !!item.bingIdEn)
      .map((item) => ({
        url: `${siteUrl}/wallpaper/${item.wallpaperId}?lang=en`,
        changefreq: EnumChangefreq.ALWAYS,
        priority: 0.9,
        lastmod: moment(item.wallpaperModified).format()
      }));
    const postArchivesByMonth: SitemapItem[] = data.postArchives.map((item) => ({
      url: `${siteUrl}/post/archive/${item.dateValue}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.8
    }));
    const postArchivesByYear: SitemapItem[] = uniq(data.postArchives.map((item) => item.dateValue.split('/')[0])).map(
      (item) => ({
        url: `${siteUrl}/post/archive/${item}`,
        changefreq: EnumChangefreq.DAILY,
        priority: 0.8
      })
    );
    const wallpaperArchivesByMonth: SitemapItem[] = data.wallpaperArchives.map((item) => ({
      url: `${siteUrl}/wallpaper/archive/${item.dateValue}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.8
    }));
    const wallpaperArchivesByYear: SitemapItem[] = uniq(
      data.wallpaperArchives.map((item) => item.dateValue.split('/')[0])
    ).map((item) => ({
      url: `${siteUrl}/wallpaper/archive/${item}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.8
    }));
    const tools: SitemapItem[] = TOOL_LINKS.map((item) => ({
      url: siteUrl + item.url,
      changefreq: <EnumChangefreq>item.changefreq,
      priority: item.priority
    }));
    const taxonomies: SitemapItem[] = data.taxonomies.map((item) => ({
      url: `${siteUrl}/post/category/${item.taxonomySlug}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));
    const tags: SitemapItem[] = data.tags.map((item) => ({
      url: `${siteUrl}/post/tag/${item.tagName}`,
      changefreq: EnumChangefreq.DAILY,
      priority: 0.7
    }));

    streamToPromise(
      <Readable>(
        Readable.from(
          links.concat(
            pages,
            posts,
            wallpapersCn,
            wallpapersEn,
            postArchivesByYear,
            postArchivesByMonth,
            wallpaperArchivesByYear,
            wallpaperArchivesByMonth,
            taxonomies,
            tags,
            tools
          )
        ).pipe(sitemapStream)
      )
    ).then((data) => res.header('Content-Type', 'text/xml').send(data.toString()));
  }
}
