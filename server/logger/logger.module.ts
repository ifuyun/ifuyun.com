import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Module({
  imports: [],
  providers: [LoggerService],
  exports: [LoggerService]
})
export class LoggerModule {}
