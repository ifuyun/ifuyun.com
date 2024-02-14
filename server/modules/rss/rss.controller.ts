import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import * as RSS from 'rss';
import { Post } from '../../../src/app/pages/post/post.interface';
import { PATH_LOGO } from '../../common/common.constant';
import { PageSizePipe } from '../../pipes/page-size.pipe';
import { ParseIntPipe } from '../../pipes/parse-int.pipe';
import { TrimPipe } from '../../pipes/trim.pipe';
import { OptionService } from '../option/option.service';
import { TenantAppService } from '../tenant-app/tenant-app.service';
import { RssService } from './rss.service';

@Controller()
export class RssController {
  constructor(
    private readonly rssService: RssService,
    private readonly tenantAppService: TenantAppService,
    private readonly optionService: OptionService
  ) {}

  @Get('rss.xml')
  async generateRss(
    @Query('page', new ParseIntPipe(1)) page: number,
    @Query('size', new PageSizePipe(10, 100)) pageSize: number,
    @Query('detail', new TrimPipe()) detail: '0' | '1',
    @Res() res: Response
  ) {
    const showDetail = detail === '1';
    const appInfo = await this.tenantAppService.getAppInfo();
    const options = await this.optionService.getOptions();
    const result = await this.rssService.getPosts(page, pageSize, showDetail);
    const posts: Post[] = result.postList.list || [];
    const feed = new RSS({
      title: appInfo.appName,
      description: appInfo.appDescription,
      generator: appInfo.appDomain,
      feed_url: `${appInfo.appUrl}/rss.xml`,
      site_url: appInfo.appUrl,
      image_url: `${appInfo.appUrl}${PATH_LOGO}`,
      managingEditor: options['site_author'],
      webMaster: options['site_author'],
      copyright: `2014-${new Date().getFullYear()} ${appInfo.appDomain}`,
      language: 'zh-cn',
      pubDate: new Date(),
      ttl: 60
    });

    posts.forEach((item) => {
      const post = item.post;
      feed.item({
        title: post.postTitle,
        description: showDetail ? post.postContent : post.postExcerpt,
        url: appInfo.appUrl + post.postGuid,
        guid: post.postId,
        categories: item.categories.map((category) => category.taxonomySlug),
        author: item.meta['post_author'] || post.owner.userNiceName,
        date: post.postDate
      });
    });

    res.header('Content-Type', 'text/xml').send(feed.xml({ indent: true }));
  }
}
