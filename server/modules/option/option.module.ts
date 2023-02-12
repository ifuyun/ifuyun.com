import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OptionService } from './option.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [OptionService],
  exports: [OptionService]
})
export class OptionModule {}
