import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserPost } from '../../entities/user-post.entity';
import { User } from '../../entities/user.entity';
import { Post } from '../../entities/post.entity';

@Injectable()
export class UserPostService {
  constructor(
    @InjectRepository(UserPost)
    private userPostRepository: Repository<UserPost>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  /**
   * 获取用户的岗位列表
   * @param userId 用户ID
   * @returns 岗位列表
   */
  async getUserPosts(userId: number) {
    const userPosts = await this.userPostRepository.find({
      where: { userId },
      relations: ['post'],
    });

    return userPosts.map(up => up.post);
  }

  /**
   * 获取岗位的用户列表
   * @param postId 岗位ID
   * @returns 用户列表
   */
  async getPostUsers(postId: number) {
    const postUsers = await this.userPostRepository.find({
      where: { postId },
      relations: ['user'],
    });

    return postUsers.map(pu => pu.user);
  }

  /**
   * 分配用户岗位
   * @param userId 用户ID
   * @param postIds 岗位ID数组
   */
  async assignUserPosts(userId: number, postIds: number[]) {
    // 检查用户是否存在
    const user = await this.userRepository.findOne({
      where: { userId }
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 检查所有岗位是否存在
    const posts = await this.postRepository.find({
      where: { postId: In(postIds) }
    });

    if (posts.length !== postIds.length) {
      throw new UnauthorizedException('部分岗位不存在');
    }

    // 先删除原有的用户岗位关系
    await this.userPostRepository.delete({ userId });

    // 创建新的用户岗位关系
    const userPosts: UserPost[] = postIds.map(postId => {
      const userPost = new UserPost();
      userPost.userId = userId;
      userPost.postId = postId;
      return userPost;
    });

    await this.userPostRepository.insert(userPosts);

    return { success: true };
  }

  /**
   * 批量分配岗位给多个用户
   * @param userIds 用户ID数组
   * @param postIds 岗位ID数组
   */
  async assignPostsToUsers(userIds: number[], postIds: number[]) {
    // 检查所有用户是否存在
    const users = await this.userRepository.find({
      where: { userId: In(userIds) }
    });

    if (users.length !== userIds.length) {
      throw new UnauthorizedException('部分用户不存在');
    }

    // 检查所有岗位是否存在
    const posts = await this.postRepository.find({
      where: { postId: In(postIds) }
    });

    if (posts.length !== postIds.length) {
      throw new UnauthorizedException('部分岗位不存在');
    }

    // 先删除这些用户的原有岗位关系
    await this.userPostRepository.delete({ userId: In(userIds) });

    // 创建新的用户岗位关系
    const userPosts: UserPost[] = [];
    for (const userId of userIds) {
      for (const postId of postIds) {
        const userPost = new UserPost();
        userPost.userId = userId;
        userPost.postId = postId;
        userPosts.push(userPost);
      }
    }

    // 使用 insert 方法批量插入，避免类型问题
    await this.userPostRepository.insert(userPosts);

    return { success: true };
  }

  /**
   * 取消用户的岗位
   * @param userId 用户ID
   * @param postIds 岗位ID数组（可选，如果不传则删除所有岗位）
   */
  async removeUserPosts(userId: number, postIds?: number[]) {
    // 检查用户是否存在
    const user = await this.userRepository.findOne({
      where: { userId }
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (postIds && postIds.length > 0) {
      // 删除指定的岗位
      await this.userPostRepository.delete({
        userId,
        postId: In(postIds)
      });
    } else {
      // 删除所有岗位
      await this.userPostRepository.delete({ userId });
    }

    return { success: true };
  }

  /**
   * 检查用户是否有指定岗位
   * @param userId 用户ID
   * @param postId 岗位ID
   * @returns 是否有岗位
   */
  async checkUserPost(userId: number, postId: number): Promise<boolean> {
    const userPost = await this.userPostRepository.findOne({
      where: { userId, postId }
    });

    return !!userPost;
  }

  /**
   * 获取用户岗位ID列表
   * @param userId 用户ID
   * @returns 岗位ID数组
   */
  async getUserPostIds(userId: number): Promise<number[]> {
    const userPosts = await this.userPostRepository.find({
      where: { userId }
    });

    return userPosts.map(up => up.postId);
  }

  /**
   * 获取岗位用户ID列表
   * @param postId 岗位ID
   * @returns 用户ID数组
   */
  async getPostUserIds(postId: number): Promise<number[]> {
    const postUsers = await this.userPostRepository.find({
      where: { postId }
    });

    return postUsers.map(pu => pu.userId);
  }

  /**
   * 更新用户岗位
   * @param userId 用户ID
   * @param postIds 岗位ID数组
   */
  async updateUserPosts(userId: number, postIds: number[]) {
    await this.assignUserPosts(userId, postIds);
  }

  /**
   * 删除用户岗位关联（用于软删除用户时）
   * @param userIds 用户ID数组
   */
  async deleteUserPosts(userIds: number[]) {
    await this.userPostRepository.delete({
      userId: In(userIds)
    });
  }
}