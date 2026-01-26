import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not, In } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { Dept } from '../../entities/dept.entity';
import {
  QueryPostDto,
  CreatePostDto,
  UpdatePostDto,
  PostDataDto,
  PostOptionDto,
  PostDeptTreeDto,
  PostStatus
} from './dto/post.dto';
import { DeptService } from '../dept/dept.service';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Dept)
    private deptRepository: Repository<Dept>,
    @Inject(forwardRef(() => DeptService))
    private deptService: DeptService,
  ) {}

  /**
   * 查询岗位列表
   * @param query 查询参数
   * @returns 岗位列表
   */
  async findAll(query: QueryPostDto) {
    const {
      pageNum = 1,
      pageSize = 10,
      deptId,
      belongDeptId,
      postCode,
      postName,
      postCategory,
      status,
    } = query;

    const where: any = {};

    // 如果传入了 belongDeptId，则查询该部门及其所有子部门下的岗位
    if (belongDeptId) {
      const childDepts = await this.deptService.findChildDepts(belongDeptId);
      const allDeptIds = [belongDeptId, ...childDepts.map(d => d.deptId)];
      where.deptId = In(allDeptIds);
    } else if (deptId) {
      where.deptId = deptId;
    }

    if (postCode) {
      where.postCode = Like(`%${postCode}%`);
    }

    if (postName) {
      where.postName = Like(`%${postName}%`);
    }

    if (postCategory) {
      where.postCategory = postCategory;
    }

    if (status) {
      where.status = status;
    }

    const [posts, total] = await this.postRepository.findAndCount({
      where,
      order: {
        postSort: 'ASC',
        postId: 'DESC'
      },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    // 获取部门信息
    const postDataDtos: PostDataDto[] = await Promise.all(
      posts.map(async (post) => {
        const dept = await this.deptRepository.findOne({
          where: { deptId: post.deptId }
        });
        return {
          ...post,
          createTime: post.createTime?.toISOString(),
          updateTime: post.updateTime?.toISOString(),
          deptName: dept?.deptName || '',
        };
      })
    );

    return {
      posts: postDataDtos,
      total,
      pageNum,
      pageSize,
    };
  }

  /**
   * 根据ID查询岗位详情
   * @param postId 岗位ID
   * @returns 岗位详情
   */
  async findOne(postId: number) {
    const post = await this.postRepository.findOne({
      where: { postId }
    });

    if (!post) {
      throw new UnauthorizedException('岗位不存在');
    }

    // 获取部门信息
    const dept = await this.deptRepository.findOne({
      where: { deptId: post.deptId }
    });

    return {
      ...post,
      deptId: +post.deptId,
      createTime: post.createTime?.toISOString(),
      updateTime: post.updateTime?.toISOString(),
      deptName: dept?.deptName || '',
    };
  }

  /**
   * 新增岗位
   * @param createPostDto 创建岗位DTO
   * @returns 创建的岗位信息
   */
  async create(createPostDto: CreatePostDto) {
    // 检查岗位编码是否存在
    const existPostByCode = await this.postRepository.findOne({
      where: { postCode: createPostDto.postCode }
    });

    if (existPostByCode) {
      throw new UnauthorizedException('岗位编码已存在');
    }

    // 检查部门是否存在
    const dept = await this.deptRepository.findOne({
      where: { deptId: createPostDto.deptId }
    });

    if (!dept) {
      throw new UnauthorizedException('部门不存在');
    }

    const post = this.postRepository.create({
      ...createPostDto,
      tenantId: '000000', // 默认租户
    });

    const savedPost = await this.postRepository.save(post);

    // 获取部门信息
    const deptInfo = await this.deptRepository.findOne({
      where: { deptId: savedPost.deptId }
    });

    return {
      ...savedPost,
      createTime: savedPost.createTime?.toISOString(),
      updateTime: savedPost.updateTime?.toISOString(),
      deptName: deptInfo?.deptName || '',
    };
  }

  /**
   * 修改岗位
   * @param updatePostDto 更新岗位DTO
   * @returns 更新的岗位信息
   */
  async update(updatePostDto: UpdatePostDto) {
    const post = await this.postRepository.findOne({
      where: { postId: updatePostDto.postId }
    });

    if (!post) {
      throw new UnauthorizedException('岗位不存在');
    }

    // 检查岗位编码是否重复
    if (updatePostDto.postCode && updatePostDto.postCode !== post.postCode) {
      const existPost = await this.postRepository.findOne({
        where: {
          postCode: updatePostDto.postCode,
          postId: Not(updatePostDto.postId)
        }
      });

      if (existPost) {
        throw new UnauthorizedException('岗位编码已存在');
      }
    }

    // 如果更新了部门，检查新部门是否存在
    if (updatePostDto.deptId && updatePostDto.deptId !== post.deptId) {
      const dept = await this.deptRepository.findOne({
        where: { deptId: updatePostDto.deptId }
      });

      if (!dept) {
        throw new UnauthorizedException('部门不存在');
      }
    }

    // 只提取实体中存在的字段进行更新，排除 deptName 等关联字段
    const { postId, deptId, postCode, postName, postCategory, postSort, status, remark } = updatePostDto;
    const updateData: Partial<UpdatePostDto> = {};

    if (deptId !== undefined) updateData.deptId = deptId;
    if (postCode !== undefined) updateData.postCode = postCode;
    if (postName !== undefined) updateData.postName = postName;
    if (postCategory !== undefined) updateData.postCategory = postCategory;
    if (postSort !== undefined) updateData.postSort = postSort;
    if (status !== undefined) updateData.status = status;
    if (remark !== undefined) updateData.remark = remark;

    await this.postRepository.update(updatePostDto.postId, updateData);

    const updatedPost = await this.postRepository.findOne({
      where: { postId: updatePostDto.postId }
    });

    if (!updatedPost) {
      throw new UnauthorizedException('更新失败，岗位不存在');
    }

    // 获取部门信息
    const dept = await this.deptRepository.findOne({
      where: { deptId: updatedPost.deptId }
    });

    return {
      ...updatedPost,
      createTime: updatedPost.createTime?.toISOString(),
      updateTime: updatedPost.updateTime?.toISOString(),
      deptName: dept?.deptName || '',
    };
  }

  /**
   * 删除岗位
   * @param postIds 岗位ID数组
   */
  async delete(postIds: number[]) {
    for (const postId of postIds) {
      const post = await this.postRepository.findOne({
        where: { postId }
      });

      if (!post) {
        throw new UnauthorizedException('岗位不存在');
      }
    }

    await this.postRepository.delete(postIds);
  }

  /**
   * 获取岗位选择框列表
   * @param deptId 部门ID
   * @param postIds 岗位ID数组
   * @returns 岗位选项列表
   */
  async findOptions(deptId?: number, postIds?: number[]): Promise<PostOptionDto[]> {
    const where: any = {};

    if (deptId) {
      where.deptId = deptId;
    }

    if (postIds && postIds.length > 0) {
      where.postId = In(postIds);
    }

    const posts = await this.postRepository.find({
      where,
      order: {
        postSort: 'ASC'
      }
    });

    return posts.map(post => ({
      postId: post.postId,
      postCode: post.postCode,
      postName: post.postName,
      deptId: post.deptId
    }));
  }

  /**
   * 查询部门下拉树结构
   * @returns 部门树形结构
   */
  async findDeptTree(): Promise<PostDeptTreeDto[]> {
    const depts = await this.deptRepository.find({
      where: {},
      order: {
        orderNum: 'ASC'
      }
    });

    // 构建树形结构
    const buildTree = (parentId: number = 0): PostDeptTreeDto[] => {
      return depts
        .filter(dept => dept.parentId === parentId)
        .map(dept => ({
          id: dept.deptId,
          label: dept.deptName,
          parentId: dept.parentId,
          children: buildTree(dept.deptId)
        }));
    };

    return buildTree();
  }
}