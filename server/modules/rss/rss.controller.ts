import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import * as RSS from 'rss';
import { SITE_INFO } from '../../../src/app/config/common.constant';
import { Post } from '../../../src/app/pages/post/post.interface';
import { PageSizePipe } from '../../pipes/page-size.pipe';
import { ParseIntPipe } from '../../pipes/parse-int.pipe';
import { TrimPipe } from '../../pipes/trim.pipe';
import { RssService } from './rss.service';

@Controller()
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Get('rss.xml')
  async generateRss(
    @Query('page', new ParseIntPipe(1)) page: number,
    @Query('size', new PageSizePipe(10, 100)) pageSize: number,
    @Query('detail', new TrimPipe()) detail: '0' | '1',
    @Res() res: Response
  ) {
    const showDetail = detail === '1';
    const result = await this.rssService.getPosts(page, pageSize, showDetail);
    const posts: Post[] = result.postList.list || [];
    const feed = new RSS({
      title: SITE_INFO.title,
      description: SITE_INFO.slogan,
      generator: SITE_INFO.domain,
      feed_url: `${SITE_INFO.url}/rss.xml`,
      site_url: SITE_INFO.url,
      image_url: `${SITE_INFO.url}/logo.png`,
      managingEditor: SITE_INFO.author,
      webMaster: SITE_INFO.author,
      copyright: `${SITE_INFO.startYear}-${new Date().getFullYear()} ${SITE_INFO.domain}`,
      language: 'zh-cn',
      pubDate: new Date(),
      ttl: 60
    });
    posts.forEach((item) => {
      const post = item.post;
      feed.item({
        title: post.postTitle,
        description: showDetail ? post.postContent : post.postExcerpt,
        url: SITE_INFO.url + post.postGuid,
        guid: post.postId,
        categories: item.categories.map((category) => category.taxonomySlug),
        author: item.meta['post_author'] || post.author.userNiceName,
        date: post.postDate
      });
    });
    res.header('Content-Type', 'text/xml').send(feed.xml({ indent: true }));
  }
}
