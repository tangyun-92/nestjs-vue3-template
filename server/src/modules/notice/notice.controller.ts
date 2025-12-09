import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NoticeService } from './notice.service';
import type { QueryNoticeDto, CreateNoticeDto, UpdateNoticeDto } from './dto/notice.dto';
import { ResponseWrapper } from '../../common/response.wrapper';

@UseGuards(JwtAuthGuard)
@Controller('system/notice')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  /**
   * 查询公告列表
   * @param query 查询参数
   * @returns 分页公告列表
   */
  @Get('list')
  async list(@Query() query: QueryNoticeDto) {
    const { notices, total, pageNum, pageSize } = await this.noticeService.findAll(query);
    return ResponseWrapper.successWithPagination(
      notices,
      total,
      pageNum,
      pageSize,
      '查询成功',
    );
  }

  /**
   * 根据公告编号获取详细信息
   * @param noticeId 公告ID
   * @returns 公告详细信息
   */
  @Get(':noticeId')
  async findOne(@Param('noticeId') noticeId: number) {
    const notice = await this.noticeService.findOne(+noticeId);
    return ResponseWrapper.success(notice, '查询成功');
  }

  /**
   * 新增公告
   * @param data 创建公告DTO
   * @param request 请求对象
   * @returns 创建的公告信息
   */
  @Post()
  async create(@Body() data: CreateNoticeDto, @Request() request: any) {
    // 从请求中获取用户ID
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('用户未登录');
    }

    const notice = await this.noticeService.create(data, userId);
    return ResponseWrapper.success(notice, '新增成功');
  }

  /**
   * 修改公告
   * @param data 更新公告DTO
   * @returns 更新的公告信息
   */
  @Put()
  async update(@Body() data: UpdateNoticeDto) {
    const notice = await this.noticeService.update(data);
    return ResponseWrapper.success(notice, '修改成功');
  }

  /**
   * 删除公告
   * @param noticeId 公告ID（可以是单个或多个，逗号分隔）
   * @returns 删除结果
   */
  @Delete(':noticeId')
  async delete(@Param('noticeId') noticeId: string) {
    const ids = noticeId.split(',').map(id => +id);
    await this.noticeService.delete(ids);
    return ResponseWrapper.success(null, '删除成功');
  }
}