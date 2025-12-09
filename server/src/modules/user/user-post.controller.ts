import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { UserPostService } from './user-post.service';
import { ResponseWrapper } from '../../common/response.wrapper';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system/user-post')
export class UserPostController {
  constructor(private readonly userPostService: UserPostService) {}

  /**
   * 获取用户的岗位列表
   * @param userId 用户ID
   * @returns 岗位列表
   */
  @Get('user/:userId')
  async getUserPosts(@Param('userId') userId: number) {
    const posts = await this.userPostService.getUserPosts(+userId);
    return ResponseWrapper.success(posts, '查询成功');
  }

  /**
   * 获取岗位的用户列表
   * @param postId 岗位ID
   * @returns 用户列表
   */
  @Get('post/:postId')
  async getPostUsers(@Param('postId') postId: number) {
    const users = await this.userPostService.getPostUsers(+postId);
    return ResponseWrapper.success(users, '查询成功');
  }

  /**
   * 分配用户岗位
   * @param body 请求体
   * @returns 操作结果
   */
  @Post('assign')
  async assignUserPosts(@Body() body: { userId: number; postIds: number[] }) {
    const result = await this.userPostService.assignUserPosts(body.userId, body.postIds);
    return ResponseWrapper.success(result, '分配成功');
  }

  /**
   * 批量分配岗位给多个用户
   * @param body 请求体
   * @returns 操作结果
   */
  @Post('assign-batch')
  async assignPostsToUsers(@Body() body: { userIds: number[]; postIds: number[] }) {
    const result = await this.userPostService.assignPostsToUsers(body.userIds, body.postIds);
    return ResponseWrapper.success(result, '分配成功');
  }

  /**
   * 取消用户的岗位
   * @param userId 用户ID
   * @param body 请求体
   * @returns 操作结果
   */
  @Delete('user/:userId')
  async removeUserPosts(
    @Param('userId') userId: number,
    @Body() body: { postIds?: number[] }
  ) {
    const result = await this.userPostService.removeUserPosts(+userId, body.postIds);
    return ResponseWrapper.success(result, '取消成功');
  }

  /**
   * 检查用户是否有指定岗位
   * @param query 查询参数
   * @returns 检查结果
   */
  @Get('check')
  async checkUserPost(@Query() query: { userId: number; postId: number }) {
    const hasPost = await this.userPostService.checkUserPost(query.userId, query.postId);
    return ResponseWrapper.success({ hasPost }, '检查完成');
  }

  /**
   * 获取用户岗位ID列表
   * @param userId 用户ID
   * @returns 岗位ID数组
   */
  @Get('user/:userId/post-ids')
  async getUserPostIds(@Param('userId') userId: number) {
    const postIds = await this.userPostService.getUserPostIds(+userId);
    return ResponseWrapper.success(postIds, '查询成功');
  }

  /**
   * 获取岗位用户ID列表
   * @param postId 岗位ID
   * @returns 用户ID数组
   */
  @Get('post/:postId/user-ids')
  async getPostUserIds(@Param('postId') postId: number) {
    const userIds = await this.userPostService.getPostUserIds(+postId);
    return ResponseWrapper.success(userIds, '查询成功');
  }
}