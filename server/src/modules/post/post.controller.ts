import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PostService } from './post.service';
import type { QueryPostDto, CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { ResponseWrapper } from '../../common/response.wrapper';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * 查询岗位列表
   * @param query 查询参数
   * @returns 分页岗位列表
   */
  @Get('list')
  async list(@Query() query: QueryPostDto) {
    const { posts, total, pageNum, pageSize } = await this.postService.findAll(query);
    return ResponseWrapper.successWithPagination(
      posts,
      total,
      pageNum,
      pageSize,
      '查询成功',
    );
  }

  /**
   * 根据岗位编号获取详细信息
   * @param postId 岗位ID
   * @returns 岗位详细信息
   */
  @Get(':postId')
  async findOne(@Param('postId') postId: number) {
    const post = await this.postService.findOne(+postId);
    return ResponseWrapper.success(post, '查询成功');
  }

  /**
   * 获取岗位选择框列表
   * @param deptId 部门ID
   * @param postIds 岗位ID数组
   * @returns 岗位选项列表
   */
  @Get('optionselect')
  async optionSelect(
    @Query('deptId') deptId?: number,
    @Query('postIds') postIds?: string
  ) {
    const ids = postIds ? postIds.split(',').map(id => +id) : undefined;
    const posts = await this.postService.findOptions(deptId, ids);
    return ResponseWrapper.success(posts, '查询成功');
  }

  /**
   * 查询部门下拉树结构
   * @returns 部门树形结构
   */
  @Get('deptTree')
  async deptTreeSelect() {
    const deptTree = await this.postService.findDeptTree();
    return ResponseWrapper.success(deptTree, '查询成功');
  }

  /**
   * 新增岗位
   * @param createPostDto 创建岗位DTO
   * @returns 创建的岗位信息
   */
  @Post()
  async create(@Body() createPostDto: CreatePostDto) {
    const post = await this.postService.create(createPostDto);
    return ResponseWrapper.success(post, '新增成功');
  }

  /**
   * 修改岗位
   * @param updatePostDto 更新岗位DTO
   * @returns 更新的岗位信息
   */
  @Put()
  async update(@Body() updatePostDto: UpdatePostDto) {
    const post = await this.postService.update(updatePostDto);
    return ResponseWrapper.success(post, '修改成功');
  }

  /**
   * 删除岗位
   * @param postId 岗位ID（可以是单个或多个，逗号分隔）
   * @returns 删除结果
   */
  @Delete(':postId')
  async delete(@Param('postId') postId: string) {
    const ids = postId.split(',').map(id => +id);
    await this.postService.delete(ids);
    return ResponseWrapper.success(null, '删除成功');
  }
}