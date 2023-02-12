import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import * as RSS from 'rss';
import { Post } from '../../../src/app/pages/post/post.interface';
import { PageSizePipe } from '../../pipes/page-size.pipe';
import { ParseIntPipe } from '../../pipes/parse-int.pipe';
import { TrimPipe } from '../../pipes/trim.pipe';
import { OptionService } from '../option/option.service';
import { RssService } from './rss.service';

@Controller()
export class RssController {
  constructor(private readonly rssService: RssService, private readonly optionService: OptionService) {}

  @Get('rss.xml')
  async generateRss(
    @Query('page', new ParseIntPipe(1)) page: number,
    @Query('size', new PageSizePipe(10, 100)) pageSize: number,
    @Query('detail', new TrimPipe()) detail: '0' | '1',
    @Res() res: Response
  ) {
    const showDetail = detail === '1';
    const options = await this.optionService.getOptionsByKeys([
      'site_name',
      'site_slogan',
      'site_url',
      'site_domain',
      'site_author'
    ]);
    const result = await this.rssService.getPosts(page, pageSize, showDetail);
    const posts: Post[] = result.postList.list || [];
    const feed = new RSS({
      title: options['title'],
      description: options['slogan'],
      generator: options['domain'],
      feed_url: `${options['url']}/rss.xml`,
      site_url: options['url'],
      image_url: `${options['url']}/logo.png`,
      managingEditor: options['author'],
      webMaster: options['author'],
      copyright: `2014-${new Date().getFullYear()} ${options['domain']}`,
      language: 'zh-cn',
      pubDate: new Date(),
      ttl: 60
    });
    posts.forEach((item) => {
      const post = item.post;
      feed.item({
        title: post.postTitle,
        description: showDetail ? post.postContent : post.postExcerpt,
        url: options['url'] + post.postGuid,
        guid: post.postId,
        categories: item.categories.map((category) => category.taxonomySlug),
        author: item.meta['post_author'] || post.author.userNiceName,
        date: post.postDate
      });
    });
    res.header('Content-Type', 'text/xml').send(feed.xml({ indent: true }));
  }
}
