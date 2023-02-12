import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OptionModule } from '../option/option.module';
import { RssController } from './rss.controller';
import { RssService } from './rss.service';

@Module({
  imports: [HttpModule, OptionModule],
  controllers: [RssController],
  providers: [RssService],
  exports: [RssService]
})
export class RssModule {}
