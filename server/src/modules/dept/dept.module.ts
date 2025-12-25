import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dept } from '../../entities/dept.entity';
import { Post } from '../../entities/post.entity';
import { DeptService } from './dept.service';
import { DeptController } from './dept.controller';
import { PostModule } from '../post/post.module';

@Module({
  imports: [TypeOrmModule.forFeature([Dept, Post]), forwardRef(() => PostModule)],
  controllers: [DeptController],
  providers: [DeptService],
  exports: [DeptService],
})
export class DeptModule {}