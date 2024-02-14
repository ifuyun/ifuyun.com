import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OptionModule } from '../option/option.module';
import { TenantAppModule } from '../tenant-app/tenant-app.module';
import { RssController } from './rss.controller';
import { RssService } from './rss.service';

@Module({
  imports: [HttpModule, TenantAppModule, OptionModule],
  controllers: [RssController],
  providers: [RssService],
  exports: [RssService]
})
export class RssModule {}
