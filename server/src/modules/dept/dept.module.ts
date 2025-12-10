import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dept } from '../../entities/dept.entity';
import { Post } from '../../entities/post.entity';
import { DeptService } from './dept.service';
import { DeptController } from './dept.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Dept, Post])],
  controllers: [DeptController],
  providers: [DeptService],
  exports: [DeptService],
})
export class DeptModule {}