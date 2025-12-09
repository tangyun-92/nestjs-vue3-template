import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../../entities/post.entity';
import { Dept } from '../../entities/dept.entity';
import { UserPost } from '../../entities/user-post.entity';
import { PostService } from './post.service';
import { PostController } from './post.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Dept, UserPost])],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}