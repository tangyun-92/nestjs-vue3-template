import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { LoginInfo } from '../../../entities/login-log.entity';
import { QueryLoginInfoDto, LoginInfoDataDto, LoginStatus } from './dto/login-log.dto';

@Injectable()
export class LoginInfoService {
  constructor(
    @InjectRepository(LoginInfo)
    private loginInfoRepository: Repository<LoginInfo>,
  ) {}

  /**
   * 查询登录日志列表
   * @param query 查询参数
   * @returns 登录日志列表
   */
  async findAll(query: QueryLoginInfoDto) {
    const {
      pageNum = 1,
      pageSize = 10,
      ipaddr,
      userName,
      status,
      orderByColumn = 'loginTime',
      isAsc = 'desc',
    } = query;

    const where: any = {};

    if (ipaddr) {
      where.ipaddr = Like(`%${ipaddr}%`);
    }

    if (userName) {
      where.userName = Like(`%${userName}%`);
    }

    if (status !== undefined) {
      where.status = +status;
    }

    // 处理时间范围查询
    let beginTime, endTime;
    if (query['params[beginTime]'] && query['params[endTime]']) {
      beginTime = query['params[beginTime]'];
      endTime = query['params[endTime]'];
      where.loginTime = Between(beginTime, endTime);
    }

    // 构建排序条件
    const order: any = {};
    if (orderByColumn) {
      order[orderByColumn] = isAsc === 'asc' ? 'ASC' : 'DESC';
    } else {
      order.loginTime = 'DESC';
    }

    const [loginInfos, total] = await this.loginInfoRepository.findAndCount({
      where,
      order,
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    const loginInfoDataDtos: LoginInfoDataDto[] = loginInfos.map(info => ({
      infoId: info.infoId,
      tenantId: info.tenantId,
      userName: info.userName,
      status: info.status,
      ipaddr: info.ipaddr,
      loginLocation: info.loginLocation,
      browser: info.browser,
      os: info.os,
      msg: info.msg,
      loginTime: info.loginTime?.toISOString(),
      createTime: info.loginTime?.toISOString(),
    }));

    return {
      loginInfos: loginInfoDataDtos,
      total,
      pageNum,
      pageSize,
    };
  }

  /**
   * 删除登录日志
   * @param infoIds 登录日志ID数组
   */
  async delete(infoIds: number[]) {
    for (const infoId of infoIds) {
      const loginInfo = await this.loginInfoRepository.findOne({
        where: { infoId }
      });

      if (!loginInfo) {
        throw new UnauthorizedException('登录日志不存在');
      }
    }

    await this.loginInfoRepository.delete(infoIds);
  }

  /**
   * 清空登录日志
   */
  async clean() {
    // 删除所有登录日志
    const result = await this.loginInfoRepository.delete({});
    return { deletedCount: result.affected || 0 };
  }

  /**
   * 解锁用户登录状态
   * @param userName 用户名
   */
  async unlockUser(userName: string) {
    // 这里可以实现解锁逻辑，比如清除用户的登录失败次数等
    // 实际应用中可能需要更新用户表中的状态或缓存
    // 目前只是返回成功消息
    return { message: `用户 ${userName} 已解锁` };
  }

  /**
   * 记录登录日志
   * @param logData 登录日志数据
   */
  async create(logData: Partial<LoginInfo>) {
    const loginLog = this.loginInfoRepository.create({
      ...logData,
      tenantId: '000000', // 默认租户
      loginTime: new Date(),
    });

    const savedLog = await this.loginInfoRepository.save(loginLog);
    return savedLog;
  }

  /**
   * 异步记录登录日志
   * @param logData 登录日志数据
   */
  async createAsync(logData: Partial<LoginInfo>) {
    // 异步记录，不返回结果
    try {
      await this.create(logData);
    } catch (error) {
      console.error('记录登录日志失败:', error);
    }
  }
}