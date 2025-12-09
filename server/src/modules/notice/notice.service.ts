import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Notice } from '../../entities/notice.entity';
import { User } from '../../entities/user.entity';
import {
  QueryNoticeDto,
  CreateNoticeDto,
  UpdateNoticeDto,
  NoticeDataDto,
  NoticeStatus,
  NoticeType
} from './dto/notice.dto';

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 查询公告列表
   * @param query 查询参数
   * @returns 公告列表
   */
  async findAll(query: QueryNoticeDto) {
    const {
      pageNum = 1,
      pageSize = 10,
      noticeTitle,
      createByName,
      status,
      noticeType,
    } = query;

    const queryBuilder = this.noticeRepository.createQueryBuilder('notice');

    if (noticeTitle) {
      queryBuilder.andWhere('notice.noticeTitle LIKE :noticeTitle', {
        noticeTitle: `%${noticeTitle}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('notice.status = :status', { status });
    }

    if (noticeType) {
      queryBuilder.andWhere('notice.noticeType = :noticeType', { noticeType });
    }

    // 如果有创建者姓名，需要先查询用户
    if (createByName) {
      queryBuilder.leftJoinAndSelect(User, 'user', 'user.userId = notice.createBy')
        .andWhere('user.userName LIKE :createByName', {
          createByName: `%${createByName}%`,
        });
    }

    const [notices, total] = await queryBuilder
      .orderBy('notice.createTime', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 查询创建者姓名
    const noticeDataDtos: NoticeDataDto[] = await Promise.all(
      notices.map(async (notice) => {
        let createByName = '';
        if (notice.createBy) {
          const user = await this.userRepository.findOne({
            where: { userId: notice.createBy },
            select: ['userName']
          });
          createByName = user?.userName || '';
        }

        return {
          ...notice,
          noticeContent: notice.noticeContent ? notice.noticeContent.toString() : '',
          createTime: notice.createTime?.toISOString(),
          updateTime: notice.updateTime?.toISOString(),
          createByName,
        };
      })
    );

    return {
      notices: noticeDataDtos,
      total,
      pageNum,
      pageSize,
    };
  }

  /**
   * 根据ID查询公告详情
   * @param noticeId 公告ID
   * @returns 公告详情
   */
  async findOne(noticeId: number) {
    const notice = await this.noticeRepository.findOne({
      where: { noticeId }
    });

    if (!notice) {
      throw new UnauthorizedException('公告不存在');
    }

    // 查询创建者姓名
    let createByName = '';
    if (notice.createBy) {
      const user = await this.userRepository.findOne({
        where: { userId: notice.createBy },
        select: ['userName']
      });
      createByName = user?.userName || '';
    }

    return {
      ...notice,
      noticeContent: notice.noticeContent ? notice.noticeContent.toString() : '',
      createTime: notice.createTime?.toISOString(),
      updateTime: notice.updateTime?.toISOString(),
      createByName,
    };
  }

  /**
   * 新增公告
   * @param createNoticeDto 创建公告DTO
   * @returns 创建的公告信息
   */
  async create(createNoticeDto: CreateNoticeDto, userId: number) {
    // 将内容字符串转换为Buffer
    const contentBuffer = Buffer.from(createNoticeDto.noticeContent || '', 'utf8');

    const notice = this.noticeRepository.create({
      ...createNoticeDto,
      noticeContent: contentBuffer,
      tenantId: '000000', // 默认租户
      status: createNoticeDto.status || NoticeStatus.NORMAL,
      createBy: userId,
    });

    const savedNotice = await this.noticeRepository.save(notice);

    return {
      ...savedNotice,
      noticeContent: savedNotice.noticeContent ? savedNotice.noticeContent.toString() : '',
      createTime: savedNotice.createTime?.toISOString(),
      updateTime: savedNotice.updateTime?.toISOString(),
    };
  }

  /**
   * 修改公告
   * @param updateNoticeDto 更新公告DTO
   * @returns 更新的公告信息
   */
  async update(updateNoticeDto: UpdateNoticeDto) {
    const notice = await this.noticeRepository.findOne({
      where: { noticeId: updateNoticeDto.noticeId }
    });

    if (!notice) {
      throw new UnauthorizedException('公告不存在');
    }

    // 如果更新了内容，需要转换为Buffer
    const updateData: any = { ...updateNoticeDto };
    if (updateNoticeDto.noticeContent !== undefined) {
      updateData.noticeContent = Buffer.from(updateNoticeDto.noticeContent, 'utf8');
    }

    await this.noticeRepository.update(updateNoticeDto.noticeId, updateData);

    const updatedNotice = await this.noticeRepository.findOne({
      where: { noticeId: updateNoticeDto.noticeId }
    });

    if (!updatedNotice) {
      throw new UnauthorizedException('更新失败，公告不存在');
    }

    return {
      ...updatedNotice,
      noticeContent: updatedNotice.noticeContent ? updatedNotice.noticeContent.toString() : '',
      createTime: updatedNotice.createTime?.toISOString(),
      updateTime: updatedNotice.updateTime?.toISOString(),
    };
  }

  /**
   * 删除公告
   * @param noticeIds 公告ID数组
   */
  async delete(noticeIds: number[]) {
    for (const noticeId of noticeIds) {
      const notice = await this.noticeRepository.findOne({
        where: { noticeId }
      });

      if (!notice) {
        throw new UnauthorizedException('公告不存在');
      }
    }

    await this.noticeRepository.delete(noticeIds);
  }
}