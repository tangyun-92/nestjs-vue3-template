import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictData } from 'src/entities/dict-data.entity';
import { DictController } from './dict.controller';
import { DictService } from './dict.service';

@Module({
  imports: [TypeOrmModule.forFeature([DictData])],
  controllers: [DictController],
  providers: [DictService],
  exports: [DictService],
})
export class DictModule {}