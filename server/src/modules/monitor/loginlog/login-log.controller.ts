import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LoginInfoService } from './login-log.service';
import type { QueryLoginInfoDto } from './dto/login-log.dto';
import { ResponseWrapper } from '../../../common/response.wrapper';

@UseGuards(JwtAuthGuard)
@Controller('monitor/logininfor')
export class LoginInfoController {
  constructor(private readonly loginInfoService: LoginInfoService) {}

  /**
   * 查询登录日志列表
   * @param query 查询参数
   * @returns 分页登录日志列表
   */
  @Get('list')
  async list(@Query() query: QueryLoginInfoDto) {
    const { loginInfos, total, pageNum, pageSize } = await this.loginInfoService.findAll(query);
    return ResponseWrapper.successWithPagination(
      loginInfos,
      total,
      pageNum,
      pageSize,
      '查询成功',
    );
  }

  /**
   * 删除登录日志
   * @param infoId 登录日志ID（可以是单个或多个，逗号分隔）
   * @returns 删除结果
   */
  @Delete(':infoId')
  async delete(@Param('infoId') infoId: string) {
    const ids = infoId.split(',').map(id => +id);
    await this.loginInfoService.delete(ids);
    return ResponseWrapper.success(null, '删除成功');
  }

  /**
   * 解锁用户登录状态
   * @param userName 用户名
   * @returns 解锁结果
   */
  @Get('unlock/:userName')
  async unlock(@Param('userName') userName: string) {
    const result = await this.loginInfoService.unlockUser(userName);
    return ResponseWrapper.success(result, '解锁成功');
  }

  /**
   * 清空登录日志
   * @returns 清空结果
   */
  @Delete('clean')
  async clean() {
    const result = await this.loginInfoService.clean();
    return ResponseWrapper.success(result, '清空成功');
  }
}