import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SitemapController } from './sitemap.controller';
import { SitemapService } from './sitemap.service';

@Module({
  imports: [HttpModule],
  controllers: [SitemapController],
  providers: [SitemapService],
  exports: [SitemapService]
})
export class SitemapModule {}
