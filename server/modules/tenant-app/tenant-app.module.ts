import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TenantAppService } from './tenant-app.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [TenantAppService],
  exports: [TenantAppService]
})
export class TenantAppModule {}
