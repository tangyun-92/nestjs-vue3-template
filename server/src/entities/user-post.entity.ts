import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity('sys_user_post')
export class UserPost {
  @PrimaryColumn({
    type: 'bigint',
    comment: '用户ID',
  })
  userId: number;

  @PrimaryColumn({
    type: 'bigint',
    comment: '岗位ID',
  })
  postId: number;

  // 关联用户
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 关联岗位
  @ManyToOne(() => Post, { nullable: false })
  @JoinColumn({ name: 'postId' })
  post: Post;
}