import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { UserRole } from '../../entities/user-role.entity';
import { User } from '../../entities/user.entity';
import { QueryRoleDto, CreateRoleDto, UpdateRoleDto, DataScope } from './dto/role.dto';
import { ResponseWrapper } from '../../common/response.wrapper';
import { RoleMenuService } from './role-menu.service';
import { ExcelColumn, exportToExcel } from 'src/utils/excel';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private roleMenuService: RoleMenuService,
  ) {}

  /**
   * 分页查询角色列表
   * @param query 查询参数
   * @returns 角色列表
   */
  async findAll(query: QueryRoleDto) {
    const { pageNum = 1, pageSize = 10, roleName, roleKey, status } = query;

    const where: any = {
      delFlag: '0', // 只查询未删除的角色
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
      where.createTime = Between(new Date(beginTime), new Date(endTime));
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
      throw new UnauthorizedException('角色不存在');
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
        delFlag: '0',
      },
    });

    if (existRole) {
      throw new UnauthorizedException('角色名称已存在');
    }

    // 检查角色权限字符串是否已存在
    const existKeyRole = await this.roleRepository.findOne({
      where: {
        roleKey: createRoleDto.roleKey,
        delFlag: '0',
      },
    });

    if (existKeyRole) {
      throw new UnauthorizedException('角色权限字符串已存在');
    }

    const role = this.roleRepository.create({
      ...createRoleDto,
      status: createRoleDto.status || '0',
      dataScope: createRoleDto.dataScope || DataScope.CUSTOM,
      delFlag: '0',
      tenantId: '000000',
    });

    const savedRole = await this.roleRepository.save(role);

    // 添加角色菜单关联
    if (createRoleDto.menuIds && createRoleDto.menuIds.length > 0) {
      await this.roleMenuService.assignMenusToRole(
        savedRole.roleId,
        createRoleDto.menuIds,
      );
    }

    return savedRole;
  }

  /**
   * 更新角色
   * @param updateRoleDto 更新角色DTO
   * @returns 更新后的角色信息
   */
  async update(updateRoleDto: UpdateRoleDto) {
    const { roleId, menuIds, deptIds, ...roleData } = updateRoleDto;

    // 检查角色是否存在
    const existRole = await this.roleRepository.findOne({
      where: { roleId, delFlag: '0' },
    });

    if (!existRole) {
      throw new UnauthorizedException('角色不存在');
    }

    // 检查角色名称是否已被其他角色使用
    if (roleData.roleName && roleData.roleName !== existRole.roleName) {
      const nameExistRole = await this.roleRepository.findOne({
        where: {
          roleName: roleData.roleName,
          delFlag: '0',
        },
      });

      if (nameExistRole && nameExistRole.roleId !== roleId) {
        throw new UnauthorizedException('角色名称已存在');
      }
    }

    // 检查角色权限字符串是否已被其他角色使用
    if (roleData.roleKey && roleData.roleKey !== existRole.roleKey) {
      const keyExistRole = await this.roleRepository.findOne({
        where: {
          roleKey: roleData.roleKey,
          delFlag: '0',
        },
      });

      if (keyExistRole && keyExistRole.roleId !== roleId) {
        throw new UnauthorizedException('角色权限字符串已存在');
      }
    }

    // 更新角色基本信息
    await this.roleRepository.update(roleId, roleData);

    // 更新菜单关联
    if (menuIds !== undefined) {
      await this.roleMenuService.assignMenusToRole(roleId, menuIds);
    }

    // TODO: 更新部门关联
    // if (deptIds !== undefined) {
    //   await this.roleDeptService.assignDeptsToRole(roleId, deptIds);
    // }

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
      throw new UnauthorizedException('角色不存在');
    }

    // 删除角色菜单关系
    ids.forEach(async (roleId) => {
      await this.roleMenuService.removeAllMenusFromRole(roleId);
    });

    // 检查角色是否已分配给用户
    for (const role of roles) {
      const userCount = await this.checkRoleAssignedToUsers(role.roleId);
      if (userCount > 0) {
        throw new UnauthorizedException(
          `角色"${role.roleName}"已分配给用户，不能删除`,
        );
      }
    }

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
      throw new UnauthorizedException('角色不存在');
    }

    await this.roleRepository.update(roleId, { status });
    return ResponseWrapper.success(null, '状态更新成功');
  }

  /**
   * 检查角色是否已分配给用户
   * @param roleId 角色ID
   * @returns 分配给该角色的用户数量
   */
  async checkRoleAssignedToUsers(roleId: number): Promise<number> {
    const count = await this.userRoleRepository.count({
      where: {
        roleId,
      },
    });
    return count;
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
      throw new UnauthorizedException('角色不存在');
    }

    // TODO: 保存角色与部门的关联关系
    // await this.roleDeptService.assignRoleDepts(roleId, deptIds);

    await this.roleRepository.update(roleId, { dataScope });
    return ResponseWrapper.success(null, '权限分配成功');
  }

  /**
   * 导出角色数据 Excel
   * @param query 查询参数
   * @returns Excel buffer
   */
  async exportRoles(queryUserDto: QueryRoleDto) {
    const { roles } = await this.findAll({
      ...queryUserDto,
    });

    // 定义列
    const columns: ExcelColumn[] = [
      { header: '角色ID', key: 'roleId', width: 10 },
      { header: '角色名称', key: 'roleName', width: 30 },
      { header: '权限字符', key: 'roleKey', width: 20 },
      { header: '状态', key: 'status', width: 10 },
      { header: '创建时间', key: 'createTime', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ];

    const data = roles.map((role) => ({
      roleId: role.roleId,
      roleName: role.roleName,
      roleKey: role.roleKey,
      status: role.status === '0' ? '正常' : '停用',
      createTime: role.createTime || '',
      remark: role.remark,
    }));

    // 按照roleId排序
    data.sort((a, b) => a.roleId - b.roleId);

    // 使用 Excel 工具函数导出
    return exportToExcel(columns, data, {
      sheetName: '角色列表',
    });
  }

  /**
   * 查询已分配角色的用户列表
   * @param query 查询参数，包含 pageNum, pageSize, roleId
   * @returns 用户列表和总数
   */
  async findAllocatedUserList(query: { pageNum: number; pageSize: number; roleId: number, userName?: string, phonenumber?: string }) {
    const { pageNum = 1, pageSize = 10, roleId, userName, phonenumber } = query;

    // 创建查询构建器
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.userRoles', 'ur')
      .where('ur.roleId = :roleId', { roleId })
      .andWhere('user.delFlag = :delFlag', { delFlag: '0' });

    // 添加用户名查询条件
    if (userName) {
      queryBuilder.andWhere('user.userName LIKE :userName', { userName: `%${userName}%` });
    }

    // 添加手机号码查询条件
    if (phonenumber) {
      queryBuilder.andWhere('user.phonenumber LIKE :phonenumber', { phonenumber: `%${phonenumber}%` });
    }

    // 获取总数
    const total = await queryBuilder.getCount();

    // 获取分页数据
    const users = await queryBuilder
      .orderBy('user.createTime', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // 格式化返回数据
    const formattedUsers = users.map((user) => ({
      ...user,
      deptId: user.deptId ? +user.deptId : null,
      createTime: user.createTime ? new Date(user.createTime).toLocaleString('sv-SE').replace(' ', ' ') : '',
      updateTime: user.updateTime ? new Date(user.updateTime).toLocaleString('sv-SE').replace(' ', ' ') : '',
    }));

    return {
      total,
      users: formattedUsers,
    };
  }

  /**
   * 取消分配用户
   * @param roleId 角色ID
   * @param userIds 用户ID数组
   * @returns 取消分配结果
   */
  async cancelAllocatedUser(roleId: number, userIds: number[]) {
    // 检查角色是否存在
    const role = await this.roleRepository.findOne({
      where: { roleId, delFlag: '0' }
    });

    if (!role) {
      throw new UnauthorizedException('角色不存在');
    }

    // 删除用户角色关联
    for (const userId of userIds) {
      await this.userRoleRepository.delete({
        userId,
        roleId
      });
    }

    return ResponseWrapper.success(null, '取消授权成功');
  }

  /**
   * 查询未分配当前传入角色的用户列表
   * @param query 查询参数
   * @returns 取消授权结果
   */
  async findUnallocatedList(query: { pageNum: number; pageSize: number; roleId: number, userName?: string, phonenumber?: string }) {
    const { pageNum, pageSize, roleId, userName, phonenumber } = query;

    // 创建子查询，获取已经分配了当前角色的用户ID列表
    const subQuery = this.userRoleRepository
      .createQueryBuilder('ur')
      .select('ur.userId')
      .where('ur.roleId = :roleId', { roleId });

    // 创建查询构建器,查询出没有分配当前角色的用户（包括没有分配任何角色的用户）
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where(`user.userId NOT IN (${subQuery.getQuery()})`)
      .andWhere('user.delFlag = :delFlag', { delFlag: '0' })
      .setParameters(subQuery.getParameters());

    // 添加用户名查询条件
    if (userName) {
      queryBuilder.andWhere('user.userName LIKE :userName', {
        userName: `%${userName}%`,
      });
    }

    // 添加手机号码查询条件
    if (phonenumber) {
      queryBuilder.andWhere('user.phonenumber LIKE :phonenumber', {
        phonenumber: `%${phonenumber}%`,
      });
    }

    // 获取总数
    const total = await queryBuilder.getCount();

    // 获取分页数据
    const users = await queryBuilder
      .orderBy('user.createTime', 'DESC')
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // 格式化返回数据
    const formattedUsers = users.map((user) => ({
      ...user,
      deptId: user.deptId ? +user.deptId : null,
      createTime: user.createTime
        ? new Date(user.createTime).toLocaleString('sv-SE').replace(' ', ' ')
        : '',
      updateTime: user.updateTime
        ? new Date(user.updateTime).toLocaleString('sv-SE').replace(' ', ' ')
        : '',
    }));

    return {
      total,
      users: formattedUsers,
    };
  }
}