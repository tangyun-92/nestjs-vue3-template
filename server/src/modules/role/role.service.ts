import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { QueryRoleDto, CreateRoleDto, UpdateRoleDto, DataScope } from './dto/role.dto';
import { ResponseWrapper } from '../../common/response.wrapper';
import { RoleMenuService } from './role-menu.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private roleMenuService: RoleMenuService,
  ) {}

  /**
   * 分页查询角色列表
   * @param query 查询参数
   * @returns 角色列表
   */
  async findAll(query: QueryRoleDto) {
    const {
      pageNum = 1,
      pageSize = 10,
      roleName,
      roleKey,
      status,
    } = query;

    const where: any = {
      delFlag: '0'  // 只查询未删除的角色
    };

    if (roleName) {
      where.roleName = Like(`%${roleName}%`);
    }

    if (roleKey) {
      where.roleKey = Like(`%${roleKey}%`);
    }

    if (status) {
      where.status = status;
    }

    // 处理时间范围查询
    const beginTime = query['params[beginTime]'];
    const endTime = query['params[endTime]'];
    if (beginTime && endTime) {
      where.createTime = Between(
        new Date(beginTime),
        new Date(endTime),
      );
    }

    const [roles, total] = await this.roleRepository.findAndCount({
      where,
      order: {
        roleSort: 'ASC',
        createTime: 'DESC',
      },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });

    return { roles, total };
  }

  /**
   * 查询所有角色（不分页）
   * @returns 角色列表
   */
  async findAllWithoutPagination() {
    return await this.roleRepository.find({
      where: {
        delFlag: '0',
        status: '0',
      },
      order: {
        roleSort: 'ASC',
      },
    });
  }

  /**
   * 根据角色ID查询详细信息
   * @param roleId 角色ID
   * @returns 角色详细信息
   */
  async findOne(roleId: number) {
    const role = await this.roleRepository.findOne({
      where: { roleId, delFlag: '0' },
    });

    if (!role) {
      throw new Error('角色不存在');
    }

    return role;
  }

  /**
   * 创建角色
   * @param createRoleDto 创建角色DTO
   * @returns 创建的角色信息
   */
  async create(createRoleDto: CreateRoleDto) {
    // 检查角色名称是否已存在
    const existRole = await this.roleRepository.findOne({
      where: {
        roleName: createRoleDto.roleName,
        delFlag: '0'
      },
    });

    if (existRole) {
      throw new Error('角色名称已存在');
    }

    // 检查角色权限字符串是否已存在
    const existKeyRole = await this.roleRepository.findOne({
      where: {
        roleKey: createRoleDto.roleKey,
        delFlag: '0'
      },
    });

    if (existKeyRole) {
      throw new Error('角色权限字符串已存在');
    }

    const role = this.roleRepository.create({
      ...createRoleDto,
      status: createRoleDto.status || '0',
      dataScope: createRoleDto.dataScope || DataScope.CUSTOM,
      delFlag: '0',
      tenantId: '000000',
    });

    const savedRole = await this.roleRepository.save(role);
    return savedRole;
  }

  /**
   * 更新角色
   * @param updateRoleDto 更新角色DTO
   * @returns 更新后的角色信息
   */
  async update(updateRoleDto: UpdateRoleDto) {
    const { roleId } = updateRoleDto;

    // 检查角色是否存在
    const existRole = await this.roleRepository.findOne({
      where: { roleId, delFlag: '0' },
    });

    if (!existRole) {
      throw new Error('角色不存在');
    }

    // 检查角色名称是否已被其他角色使用
    if (updateRoleDto.roleName && updateRoleDto.roleName !== existRole.roleName) {
      const nameExistRole = await this.roleRepository.findOne({
        where: {
          roleName: updateRoleDto.roleName,
          delFlag: '0',
          roleId: In([roleId])
        },
      });

      if (nameExistRole && nameExistRole.roleId !== roleId) {
        throw new Error('角色名称已存在');
      }
    }

    // 检查角色权限字符串是否已被其他角色使用
    if (updateRoleDto.roleKey && updateRoleDto.roleKey !== existRole.roleKey) {
      const keyExistRole = await this.roleRepository.findOne({
        where: {
          roleKey: updateRoleDto.roleKey,
          delFlag: '0',
          roleId: In([roleId])
        },
      });

      if (keyExistRole && keyExistRole.roleId !== roleId) {
        throw new Error('角色权限字符串已存在');
      }
    }

    // 更新角色
    await this.roleRepository.update(roleId, updateRoleDto);

    // 返回更新后的角色
    const updatedRole = await this.roleRepository.findOne({
      where: { roleId },
    });

    return updatedRole;
  }

  /**
   * 删除角色
   * @param roleIds 角色ID数组
   */
  async delete(roleIds: number[]) {
    const ids = Array.isArray(roleIds) ? roleIds : [roleIds];

    // 检查角色是否存在
    const roles = await this.roleRepository.find({
      where: {
        roleId: In(ids),
        delFlag: '0',
      },
    });

    if (roles.length === 0) {
      throw new Error('角色不存在');
    }

    // TODO: 检查角色是否已分配给用户
    // for (const role of roles) {
    //   const userCount = await this.checkRoleAssignedToUsers(role.roleId);
    //   if (userCount > 0) {
    //     throw new Error(`角色"${role.roleName}"已分配给用户，不能删除`);
    //   }
    // }

    // 逻辑删除（软删除）
    await this.roleRepository.update(ids, { delFlag: '1' });
  }

  /**
   * 更新角色状态
   * @param roleId 角色ID
   * @param status 状态
   */
  async updateStatus(roleId: number, status: string) {
    const role = await this.roleRepository.findOne({
      where: { roleId, delFlag: '0' },
    });

    if (!role) {
      throw new Error('角色不存在');
    }

    await this.roleRepository.update(roleId, { status });
    return ResponseWrapper.success(null, '状态更新成功');
  }

  /**
   * 分配数据权限
   * @param roleId 角色ID
   * @param dataScope 数据范围
   * @param deptIds 部门ID数组
   */
  async dataScope(roleId: number, dataScope: string, deptIds: number[]) {
    const role = await this.roleRepository.findOne({
      where: { roleId, delFlag: '0' },
    });

    if (!role) {
      throw new Error('角色不存在');
    }

    // TODO: 保存角色与部门的关联关系
    // await this.roleDeptService.assignRoleDepts(roleId, deptIds);

    await this.roleRepository.update(roleId, { dataScope });
    return ResponseWrapper.success(null, '权限分配成功');
  }

  /**
   * 导出角色数据
   * @param query 查询参数
   * @returns 导出的角色数据
   */
  async export(query: QueryRoleDto) {
    const { roles } = await this.findAll({
      ...query,
      pageNum: 1,
      pageSize: 9999, // 导出全部数据
    });

    return roles;
  }
}