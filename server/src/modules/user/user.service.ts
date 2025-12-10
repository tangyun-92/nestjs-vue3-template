import { User } from 'src/entities/user.entity';
import {
  CreateUserDto,
  QueryUserDto,
  UserDataBaseDto,
  UpdateUserDto,
  UpdatePasswordDto,
  ResetPasswordDto,
  ChangeStatusDto,
  AssignRoleDto,
  UserDetailResponse
} from './dto/user.dto';
import { In, Repository, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { GlobalStatus } from 'src/types/global.types';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { UserPostService } from './user-post.service';
import { DeptService } from '../dept/dept.service';

export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userRoleService: UserRoleService,
    private userPostService: UserPostService,
    private deptService: DeptService,
  ) {}

  /**
   * 查询所有用户
   * @param queryUserDto 查询参数
   * @returns 用户列表
   */
  async findAll(
    queryUserDto: QueryUserDto,
  ): Promise<{ users: UserDataBaseDto[]; total: number }> {
    const {
      userName,
      nickName,
      phonenumber,
      status,
      deptId,
      roleId,
      page = 1,
      pageSize = 10
    } = queryUserDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (userName) {
      queryBuilder.andWhere('user.userName LIKE :userName', {
        userName: `%${userName}%`,
      });
    }

    if (nickName) {
      queryBuilder.andWhere('user.nickName LIKE :nickName', {
        nickName: `%${nickName}%`,
      });
    }

    if (phonenumber) {
      queryBuilder.andWhere('user.phonenumber LIKE :phonenumber', {
        phonenumber: `%${phonenumber}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (deptId) {
      // 获取该部门及其所有子部门的ID
      const childDepts = await this.deptService.findChildDepts(deptId);
      const allDeptIds = [deptId, ...childDepts.map(d => d.deptId)];

      queryBuilder.andWhere('user.deptId IN (:...deptIds)', { deptIds: allDeptIds });
    }

    // 如果有roleId，需要关联查询
    if (roleId) {
      queryBuilder.innerJoin(
        'sys_user_role',
        'ur',
        'ur.user_id = user.userId'
      ).andWhere('ur.role_id = :roleId', { roleId });
    }

    const total = await queryBuilder.getCount();
    const users = await queryBuilder
      .orderBy('user.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // 转换为UserDataBaseDto格式
    const userDtos: UserDataBaseDto[] = users.map(user => ({
      ...user,
      createTime: user.createTime?.toISOString(),
      updateTime: user.updateTime?.toISOString(),
    }));

    return {
      total,
      users: userDtos,
    };
  }

  /**
   * 根据用户ID查询用户
   * @param userId 用户ID
   * @returns 用户信息
   */
  async findOne(userId: number): Promise<UserDetailResponse> {
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 获取用户的角色和岗位信息
    const [roles, posts] = await Promise.all([
      this.userRoleService.getUserRoles(userId),
      this.userPostService.getUserPosts(userId),
    ]);

    // 获取部门信息
    let deptName: string | undefined = undefined;
    if (user.deptId) {
      const dept = await this.deptService.findOne(user.deptId);
      deptName = dept.deptName;
    }

    // 获取所有角色信息（不仅仅是用户分配的角色）
    const allRoles = await this.userRoleService.getAllRoles();

    return {
      user: {
        ...user,
        createTime: user.createTime?.toISOString(),
        updateTime: user.updateTime?.toISOString(),
        deptName,
        roles: roles.map(role => ({
          ...role,
          flag: false,
          superAdmin: role.roleKey === 'superadmin'
        })),
        roleIds: roles.map(r => r.roleId),
        postIds: posts.map(p => p.postId),
        roleId: roles.length > 0 ? roles[0].roleId : undefined
      },
      roleIds: roles.map(r => r.roleId),
      roles: allRoles.map(role => ({
        ...role,
        flag: roles.some(userRole => userRole.roleId === role.roleId),
        superAdmin: role.roleKey === 'superadmin'
      })),
      postIds: posts.map(p => p.postId),
      posts: posts
    };
  }

  /**
   * 获取用户选项列表
   * @param userIds 用户ID列表
   * @returns 用户列表
   */
  async findOptionsByIds(userIds: number[]): Promise<UserDataBaseDto[]> {
    const users = await this.userRepository.find({
      where: { userId: In(userIds) },
    });

    return users.map(user => ({
      ...user,
      createTime: user.createTime?.toISOString(),
      updateTime: user.updateTime?.toISOString(),
    }));
  }

  /**
   * 更新用户
   * @param updateUserDto 更新用户DTO
   * @returns 更新后的用户信息
   */
  async update(updateUserDto: UpdateUserDto): Promise<UserDataBaseDto> {
    const user = await this.userRepository.findOne({
      where: { userId: updateUserDto.userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 如果更新用户名，检查是否已存在
    if (updateUserDto.userName && updateUserDto.userName !== user.userName) {
      const existingUser = await this.userRepository.findOne({
        where: { userName: updateUserDto.userName },
      });
      if (existingUser) {
        throw new UnauthorizedException('用户名已存在');
      }
    }

    // 准备更新数据，只包含需要更新的字段
    const updateData: any = {};

    // 基本信息
    if (updateUserDto.deptId !== undefined) {
      updateData.deptId = typeof updateUserDto.deptId === 'string' ? parseInt(updateUserDto.deptId) : updateUserDto.deptId;
    }
    if (updateUserDto.userName !== undefined) updateData.userName = updateUserDto.userName;
    if (updateUserDto.nickName !== undefined) updateData.nickName = updateUserDto.nickName;
    if (updateUserDto.phonenumber !== undefined) updateData.phonenumber = updateUserDto.phonenumber;
    if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
    if (updateUserDto.sex !== undefined) updateData.sex = typeof updateUserDto.sex === 'string' ? updateUserDto.sex : updateUserDto.sex.toString();
    if (updateUserDto.status !== undefined) updateData.status = updateUserDto.status;
    if (updateUserDto.remark !== undefined) updateData.remark = updateUserDto.remark;
    if (updateUserDto.avatar !== undefined) updateData.avatar = updateUserDto.avatar;

    // 如果有密码且不为空，则更新密码
    if (updateUserDto.password && updateUserDto.password.trim() !== '') {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 更新用户基本信息
    await this.userRepository.update(updateUserDto.userId, updateData);

    // 更新角色关联
    if (updateUserDto.roleIds !== undefined && updateUserDto.roleIds !== null) {
      const roleIds = updateUserDto.roleIds.map(id => typeof id === 'string' ? parseInt(id) : id).filter(id => !isNaN(id));
      await this.userRoleService.updateUserRoles(updateUserDto.userId, roleIds);
    }

    // 更新岗位关联
    if (updateUserDto.postIds !== undefined && updateUserDto.postIds !== null) {
      const postIds = updateUserDto.postIds.map(id => typeof id === 'string' ? parseInt(id) : id).filter(id => !isNaN(id));
      await this.userPostService.updateUserPosts(updateUserDto.userId, postIds);
    }

    // 获取更新后的用户信息
    const updatedUser = await this.userRepository.findOne({
      where: { userId: updateUserDto.userId },
    });

    if (!updatedUser) {
      throw new UnauthorizedException('更新失败，用户不存在');
    }

    // 获取部门信息
    let deptName: string | undefined = undefined;
    if (updatedUser.deptId) {
      const dept = await this.deptService.findOne(updatedUser.deptId);
      deptName = dept.deptName;
    }

    return {
      ...updatedUser,
      createTime: updatedUser.createTime?.toISOString(),
      updateTime: updatedUser.updateTime?.toISOString(),
      deptName,
    };
  }

  /**
   * 删除用户
   * @param userIds 用户ID列表
   */
  async delete(userIds: number[]): Promise<void> {
    for (const userId of userIds) {
      const user = await this.userRepository.findOne({
        where: { userId },
      });

      if (!user) {
        throw new UnauthorizedException(`用户ID ${userId} 不存在`);
      }

      // 不能删除管理员
      if (user.userName === 'admin') {
        throw new UnauthorizedException('不能删除管理员用户');
      }
    }

    // 软删除用户
    await this.userRepository.update(userIds, {
      delFlag: '2', // 删除标记
    });

    // 删除用户角色关联
    await this.userRoleService.deleteUserRoles(userIds);

    // 删除用户岗位关联
    await this.userPostService.deleteUserPosts(userIds);
  }

  /**
   * 修改密码
   * @param userId 用户ID
   * @param updatePasswordDto 密码更新DTO
   */
  async updatePassword(userId: number, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('旧密码错误');
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(
      updatePasswordDto.newPassword,
      10
    );

    // 更新密码
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
    });
  }

  /**
   * 重置用户密码
   * @param resetPasswordDto 重置密码DTO
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId: resetPasswordDto.userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

    // 更新密码
    await this.userRepository.update(resetPasswordDto.userId, {
      password: hashedPassword,
    });
  }

  /**
   * 修改用户状态
   * @param changeStatusDto 状态修改DTO
   */
  async changeStatus(changeStatusDto: ChangeStatusDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId: changeStatusDto.userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 不能禁用管理员
    if (user.userName === 'admin' && changeStatusDto.status === GlobalStatus.DISABLED) {
      throw new BadRequestException('不能禁用管理员用户');
    }

    await this.userRepository.update(changeStatusDto.userId, {
      status: changeStatusDto.status,
    });
  }

  /**
   * 分配用户角色
   * @param assignRoleDto 角色分配DTO
   */
  async assignRoles(assignRoleDto: AssignRoleDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId: assignRoleDto.userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 不能修改管理员的角色
    if (user.userName === 'admin') {
      throw new BadRequestException('不能修改管理员用户的角色');
    }

    await this.userRoleService.updateUserRoles(
      assignRoleDto.userId,
      assignRoleDto.roleIds
    );
  }

  /**
   * 根据部门查询用户列表
   * @param deptId 部门ID
   * @returns 用户列表
   */
  async findByDept(deptId: number): Promise<UserDataBaseDto[]> {
    const users = await this.userRepository.find({
      where: { deptId, delFlag: '1' },
      order: { createTime: 'DESC' },
    });

    return users.map(user => ({
      ...user,
      createTime: user.createTime?.toISOString(),
      updateTime: user.updateTime?.toISOString(),
    }));
  }

  /**
   * 创建用户
   * @param createUserDto 创建用户参数
   * @returns 创建的用户信息
   */
  async create(createUserDto: CreateUserDto): Promise<UserDataBaseDto> {
    const {
      userName,
      password,
      nickName,
      email,
      phonenumber,
      sex,
      status,
      remark,
      deptId,
      postIds,
      roleIds,
    } = createUserDto;

    // 查看数据库中用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { userName },
    });
    if (existingUser) {
      throw new UnauthorizedException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      userName,
      password: hashedPassword,
      nickName,
      email,
      phonenumber,
      sex,
      status: status || GlobalStatus.ACTIVE,
      remark,
      deptId,
      delFlag: '1', // 正常状态
    });

    const savedUser = await this.userRepository.save(user);

    // 分配角色
    if (roleIds && roleIds.length > 0) {
      await this.userRoleService.updateUserRoles(
        savedUser.userId,
        roleIds
      );
    }

    // 分配岗位
    if (postIds && postIds.length > 0) {
      await this.userPostService.updateUserPosts(
        savedUser.userId,
        postIds
      );
    }

    return {
      ...savedUser,
      createTime: savedUser.createTime?.toISOString(),
      updateTime: savedUser.updateTime?.toISOString(),
    };
  }

}
