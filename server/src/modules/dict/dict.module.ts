import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictData } from 'src/entities/dict-data.entity';
import { DictType } from 'src/entities/dict-type.entity';
import { DictController } from './dict.controller';
import { DictService } from './dict.service';
import { DictTypeService } from './dict-type.service';
import { DictDataService } from './dict-data.service';
import { DictTypeController } from './dict-type.controller';
import { DictDataController } from './dict-data.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DictData, DictType]), AuthModule],
  controllers: [DictTypeController, DictDataController, DictController],
  providers: [DictService, DictTypeService, DictDataService],
  exports: [DictService, DictTypeService, DictDataService],
})
export class DictModule {}