import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not, In } from 'typeorm';
import { Dept } from '../../entities/dept.entity';
import {
  QueryDeptDto,
  CreateDeptDto,
  UpdateDeptDto,
  DeptDataDto,
  DeptTreeDto,
  DeptOptionDto,
  DeptStatus,
  DelFlag
} from './dto/dept.dto';

@Injectable()
export class DeptService {
  constructor(
    @InjectRepository(Dept)
    private deptRepository: Repository<Dept>,
  ) {}

  /**
   * 构建部门树
   * @param depts 部门列表
   * @param parentId 父部门ID
   * @returns 树形结构
   */
  private buildDeptTree(depts: DeptDataDto[], parentId: number = 0): DeptDataDto[] {
    return depts
      .filter(dept => {
        const deptParentId = dept.parentId === null ? 0 : dept.parentId;
        const currentParentId = parentId === null ? 0 : parentId;
        return deptParentId === currentParentId;
      })
      .map(dept => ({
        ...dept,
        children: this.buildDeptTree(depts, dept.deptId)
      }));
  }

  /**
   * 构建部门树（用于前端选择器）
   * @returns 部门树形列表
   */
  async getDeptTree() {
    const depts = await this.deptRepository.find({
      where: {
        delFlag: DelFlag.EXISTS
      },
      order: {
        parentId: 'ASC',
        orderNum: 'ASC'
      }
    });

    // 转换为树形结构
    const deptTree = this.buildDeptTreeSelect(depts, 0);

    return deptTree;
  }

  /**
   * 构建部门选择树
   * @param depts 部门列表
   * @param parentId 父部门ID
   * @returns 选择树形结构
   */
  private buildDeptTreeSelect(depts: Dept[], parentId: number = 0): any[] {
    return depts
      .filter(dept => {
        return +parentId === +dept.parentId;
      })
      .map(dept => ({
        id: dept.deptId,
        parentId: dept.parentId === null ? 0 : dept.parentId,
        label: dept.deptName,
        weight: dept.orderNum,
        disabled: dept.status === DeptStatus.NORMAL,
        children: this.buildDeptTreeSelect(depts, dept.deptId)
      }));
  }

  /**
   * 查询部门列表（树形结构）
   * @param query 查询参数
   * @returns 部门树形列表
   */
  async findAll(query: QueryDeptDto) {
    const {
      deptName,
      deptCategory,
      status,
    } = query;

    const where: any = {};

    // 根据数据库实际的delFlag值来查询
    where.delFlag = DelFlag.EXISTS

    if (deptName) {
      where.deptName = Like(`%${deptName}%`);
    }

    if (deptCategory) {
      where.deptCategory = deptCategory;
    }

    if (status) {
      where.status = status;
    }

    const depts = await this.deptRepository.find({
      where,
      order: {
        orderNum: 'ASC'
      }
    });

    // 转换为响应格式
    const deptDataDtos: DeptDataDto[] = depts.map(dept => ({
      ...dept,
      createTime: dept.createTime?.toISOString(),
      updateTime: dept.updateTime?.toISOString()
    }));

    // 如果有查询条件，直接返回列表；否则构建树形结构
    if (deptName || deptCategory || status) {
      return deptDataDtos;
    }

    // 构建树形结构
    const treeData = this.buildDeptTree(deptDataDtos);

    return treeData;
  }

  /**
   * 根据ID查询部门详情
   * @param deptId 部门ID
   * @returns 部门详情
   */
  async findOne(deptId: number) {
    const dept = await this.deptRepository.findOne({
      where: {
        deptId,
        delFlag: DelFlag.EXISTS
      }
    });

    if (!dept) {
      throw new UnauthorizedException('部门不存在');
    }

    return {
      ...dept,
      createTime: dept.createTime?.toISOString(),
      updateTime: dept.updateTime?.toISOString()
    };
  }

  /**
   * 新增部门
   * @param createDeptDto 创建部门DTO
   * @returns 创建的部门信息
   */
  async create(createDeptDto: CreateDeptDto) {
    // 检查部门名称是否存在
    const existDept = await this.deptRepository.findOne({
      where: {
        deptName: createDeptDto.deptName,
        parentId: createDeptDto.parentId,
        delFlag: DelFlag.EXISTS
      }
    });

    if (existDept) {
      throw new UnauthorizedException('同级部门下已存在相同名称的部门');
    }

    // 如果有父部门，获取父部门信息构建ancestors
    let ancestors = '';
    if (createDeptDto.parentId && createDeptDto.parentId !== 0) {
      const parentDept = await this.deptRepository.findOne({
        where: {
          deptId: createDeptDto.parentId,
          delFlag: DelFlag.EXISTS
        }
      });

      if (!parentDept) {
        throw new UnauthorizedException('父部门不存在');
      }

      ancestors = parentDept.ancestors ? `${parentDept.ancestors},${parentDept.deptId}` : `${parentDept.deptId}`;
    }

    const dept = this.deptRepository.create({
      ...createDeptDto,
      ancestors,
      status: createDeptDto.status || DeptStatus.NORMAL,
      delFlag: DelFlag.EXISTS,
      tenantId: '000000' // 默认租户
    });

    const savedDept = await this.deptRepository.save(dept);

    return {
      ...savedDept,
      createTime: savedDept.createTime?.toISOString(),
      updateTime: savedDept.updateTime?.toISOString()
    };
  }

  /**
   * 修改部门
   * @param updateDeptDto 更新部门DTO
   * @returns 更新的部门信息
   */
  async update(updateDeptDto: UpdateDeptDto) {
    const dept = await this.deptRepository.findOne({
      where: {
        deptId: updateDeptDto.deptId,
        delFlag: DelFlag.EXISTS
      }
    });

    if (!dept) {
      throw new UnauthorizedException('部门不存在');
    }

    // 检查是否修改了父部门
    if (updateDeptDto.parentId !== undefined && updateDeptDto.parentId !== dept.parentId) {
      // 不能将部门设置为自己的子部门
      if (updateDeptDto.parentId === updateDeptDto.deptId) {
        throw new UnauthorizedException('上级部门不能是自己');
      }

      // 检查是否将部门设置为自己的子孙部门
      const childDepts = await this.findChildDepts(updateDeptDto.deptId);
      const childIds = childDepts.map(d => d.deptId);
      if (childIds.includes(updateDeptDto.parentId)) {
        throw new UnauthorizedException('上级部门不能是自己的子部门');
      }

      // 更新ancestors
      let ancestors = '';
      if (updateDeptDto.parentId && updateDeptDto.parentId !== 0) {
        const parentDept = await this.deptRepository.findOne({
          where: {
            deptId: updateDeptDto.parentId,
            delFlag: DelFlag.EXISTS
          }
        });

        if (!parentDept) {
          throw new UnauthorizedException('父部门不存在');
        }

        ancestors = parentDept.ancestors ? `${parentDept.ancestors},${parentDept.deptId}` : `${parentDept.deptId}`;
      }

      // 更新当前部门的ancestors
      await this.deptRepository.update(updateDeptDto.deptId, { ancestors });

      // 更新所有子部门的ancestors
      const newAncestors = ancestors ? `${ancestors},${updateDeptDto.deptId}` : `${updateDeptDto.deptId}`;
      const oldAncestors = dept.ancestors ? `${dept.ancestors},${dept.deptId}` : `${dept.deptId}`;

      await this.updateChildAncestors(updateDeptDto.deptId, oldAncestors, newAncestors);
    }

    // 检查部门名称是否重复
    if (updateDeptDto.deptName && updateDeptDto.deptName !== dept.deptName) {
      const parentId = updateDeptDto.parentId !== undefined ? updateDeptDto.parentId : dept.parentId;
      const existDept = await this.deptRepository.findOne({
        where: {
          deptName: updateDeptDto.deptName,
          parentId,
          delFlag: DelFlag.EXISTS,
          deptId: Not(updateDeptDto.deptId)
        }
      });

      if (existDept) {
        throw new UnauthorizedException('同级部门下已存在相同名称的部门');
      }
    }

    await this.deptRepository.update(updateDeptDto.deptId, updateDeptDto);

    const updatedDept = await this.deptRepository.findOne({
      where: { deptId: updateDeptDto.deptId }
    });

    if (!updatedDept) {
      throw new UnauthorizedException('更新失败，部门不存在');
    }

    return {
      ...updatedDept,
      createTime: updatedDept.createTime?.toISOString(),
      updateTime: updatedDept.updateTime?.toISOString()
    };
  }

  /**
   * 删除部门
   * @param deptIds 部门ID数组
   */
  async delete(deptIds: number[]) {
    for (const deptId of deptIds) {
      // 检查是否有子部门
      const childDept = await this.deptRepository.findOne({
        where: {
          parentId: deptId,
          delFlag: DelFlag.EXISTS
        }
      });

      if (childDept) {
        throw new UnauthorizedException('存在子部门,不允许删除');
      }

      // 检查部门是否存在
      const dept = await this.deptRepository.findOne({
        where: {
          deptId,
          delFlag: DelFlag.EXISTS
        }
      });

      if (!dept) {
        throw new UnauthorizedException('部门不存在');
      }
    }

    // 逻辑删除
    await this.deptRepository.update(deptIds, {
      delFlag: DelFlag.DELETED
    });
  }

  /**
   * 查询子部门列表
   * @param deptId 部门ID
   * @returns 子部门列表
   */
  async findChildDepts(deptId: number): Promise<Dept[]> {
    const depts = await this.deptRepository.find({
      where: {
        delFlag: DelFlag.EXISTS
      }
    });

    const findChildren = (parentId: number): Dept[] => {
      return depts
        .filter(dept => {
          // 处理parentId的比较，考虑null的情况
          if (parentId === 0) {
            return dept.parentId === null || dept.parentId === 0;
          }
          return dept.parentId === parentId;
        })
        .flatMap(dept => [dept, ...findChildren(dept.deptId)]);
    };

    return findChildren(deptId);
  }

  /**
   * 更新子部门的ancestors
   * @param parentId 父部门ID
   * @param oldAncestors 旧的ancestors
   * @param newAncestors 新的ancestors
   */
  private async updateChildAncestors(parentId: number, oldAncestors: string, newAncestors: string) {
    const children = await this.findChildDepts(parentId);

    for (const child of children) {
      const currentAncestors = child.ancestors || '';
      if (currentAncestors.startsWith(oldAncestors)) {
        const updatedAncestors = currentAncestors.replace(oldAncestors, newAncestors);
        await this.deptRepository.update(child.deptId, {
          ancestors: updatedAncestors
        });
      }
    }
  }

  /**
   * 根据部门ID列表查询部门选项
   * @param deptIds 部门ID数组
   * @returns 部门选项列表
   */
  async findOptionsByIds(deptIds: number[]): Promise<DeptOptionDto[]> {
    const depts = await this.deptRepository.find({
      where: {
        deptId: In(deptIds),
        delFlag: DelFlag.EXISTS
      },
      order: {
        orderNum: 'ASC'
      }
    });

    return depts.map(dept => ({
      deptId: dept.deptId,
      deptName: dept.deptName,
      parentId: dept.parentId
    }));
  }

  /**
   * 查询部门列表（排除指定部门及其子部门）
   * @param deptId 要排除的部门ID
   * @returns 部门列表
   */
  async findListExcludeChild(deptId: number): Promise<DeptDataDto[]> {
    // 获取所有子部门ID
    const childDepts = await this.findChildDepts(deptId);
    const excludeIds = [deptId, ...childDepts.map(d => d.deptId)];

    const depts = await this.deptRepository.find({
      where: {
        deptId: Not(In(excludeIds)),
        delFlag: DelFlag.EXISTS
      },
      order: {
        orderNum: 'ASC'
      }
    });

    return depts.map(dept => ({
      ...dept,
      createTime: dept.createTime?.toISOString(),
      updateTime: dept.updateTime?.toISOString()
    }));
  }

  /**
   * 构建部门树形选择器数据
   * @param depts 部门列表
   * @param parentId 父部门ID
   * @returns 树形选择器数据
   */
  buildDeptTreeOptions(depts: DeptDataDto[], parentId: number = 0): DeptTreeDto[] {
    return depts
      .filter(dept => {
        const deptParentId = dept.parentId === null ? 0 : dept.parentId;
        const currentParentId = parentId === null ? 0 : parentId;
        return deptParentId === currentParentId;
      })
      .map(dept => ({
        id: dept.deptId,
        label: dept.deptName,
        parentId: dept.parentId,
        weight: dept.orderNum,
        children: this.buildDeptTreeOptions(depts, dept.deptId),
        disabled: dept.status === DeptStatus.DISABLED
      }));
  }
}