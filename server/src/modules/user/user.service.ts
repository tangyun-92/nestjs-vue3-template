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
import { DictService } from '../dict/dict.service';
import { exportToExcel, ExcelColumn } from 'src/utils/excel';
import * as ExcelJS from 'exceljs';

export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userRoleService: UserRoleService,
    private userPostService: UserPostService,
    private deptService: DeptService,
    private dictService: DictService,
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
      pageSize = 10,
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
      const allDeptIds = [deptId, ...childDepts.map((d) => d.deptId)];

      queryBuilder.andWhere('user.deptId IN (:...deptIds)', {
        deptIds: allDeptIds,
      });
    }
    queryBuilder.andWhere('user.delFlag = :delFlag', { delFlag: '0' });

    // 如果有roleId，需要关联查询
    if (roleId) {
      queryBuilder
        .innerJoin('sys_user_role', 'ur', 'ur.user_id = user.userId')
        .andWhere('ur.role_id = :roleId', { roleId });
    }

    const total = await queryBuilder.getCount();
    const users = await queryBuilder
      .orderBy('user.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // 转换为UserDataBaseDto格式
    const deptIds = Array.from(
      new Set(
        users
          .map((user) => (user.deptId ? +user.deptId : undefined))
          .filter((id): id is number => !!id),
      ),
    );

    const deptMap = new Map<number, string>();
    const deptList = await Promise.all(
      deptIds.map((id) => this.deptService.findOne(id).catch(() => null)),
    );
    deptList.forEach((dept) => {
      if (dept) {
        deptMap.set(+dept.deptId, dept.deptName);
      }
    });

    const userDtos: UserDataBaseDto[] = users.map((user) => ({
      ...user,
      deptId: +user.deptId,
      deptName: deptMap.get(+user.deptId) || '',
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
        deptId: +user.deptId,
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
   * 获取所有角色列表
   * @returns 角色列表
   */
  async findAllRoleList() {
    try {
      // 获取所有角色信息（不仅仅是用户分配的角色）
      const allRoles = await this.userRoleService.getAllRoles();

      // 手动序列化角色数据，避免 TypeORM 序列化问题
      const serializedRoles = allRoles.map(role => ({
        roleId: role.roleId,
        roleName: role.roleName,
        roleKey: role.roleKey,
        roleSort: role.roleSort,
        dataScope: role.dataScope || '1',
        menuCheckStrictly: Boolean(role.menuCheckStrictly),
        deptCheckStrictly: Boolean(role.deptCheckStrictly),
        status: role.status,
        delFlag: role.delFlag,
        createDept: role.createDept,
        createBy: role.createBy,
        updateBy: role.updateBy,
        createTime: role.createTime?.toISOString() || null,
        updateTime: role.updateTime?.toISOString() || null,
        remark: role.remark || '',
        flag: false,
        superAdmin: role.roleKey === 'superadmin'
      }));

      return {
        user: null,
        postIds: null,
        roleIds: null,
        posts: null,
        roles: serializedRoles
      };
    } catch (error) {
      console.error('获取所有角色列表失败:', error);
      throw error;
    }
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
      delFlag: '1', // 删除标记
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

  /**
   * 导出用户列表为 Excel
   * @param query 查询参数
   * @returns Excel buffer
   */
  async exportUsers(queryUserDto: QueryUserDto): Promise<Buffer> {
    // 获取所有用户数据（不分页）
    const { users } = await this.findAll({
      ...queryUserDto,
      page: 1,
      pageSize: 100000, // 设置一个很大的数来获取所有数据
    });

    // 定义列
    const columns: ExcelColumn[] = [
      { header: '用户编号', key: 'userId', width: 15 },
      { header: '用户名称', key: 'userName', width: 20 },
      { header: '用户昵称', key: 'nickName', width: 20 },
      { header: '部门', key: 'deptName', width: 20 },
      { header: '手机号码', key: 'phonenumber', width: 15 },
      { header: '邮箱', key: 'email', width: 30 },
      { header: '性别', key: 'sex', width: 10 },
      { header: '状态', key: 'status', width: 10 },
      { header: '创建时间', key: 'createTime', width: 20 },
      { header: '最后登录时间', key: 'loginDate', width: 20 },
      { header: '备注', key: 'remark', width: 30 },
    ];

    // 先并行获取所有用户的性别文本
    const sexTexts = await Promise.all(
      users.map(user => this.getSexText(user.sex))
    );

    // 准备数据
    const data = users.map((user, index) => ({
      userId: user.userId,
      userName: user.userName || '',
      nickName: user.nickName || '',
      deptName: user.deptName || '',
      phonenumber: user.phonenumber || '',
      email: user.email || '',
      sex: sexTexts[index],
      status: user.status === '0' ? '正常' : '停用',
      loginDate: user.loginDate || '',
      createTime: user.createTime || '',
      remark: user.remark || '',
    }));

    // 使用 Excel 工具函数导出
    return exportToExcel(columns, data, {
      sheetName: '用户列表',
    });
  }

  /**
   * 获取性别文本
   */
  private async getSexText(sex: string | undefined): Promise<string> {
    // 从字典表中获取性别文本
    const sexDict = await this.dictService.getDictDataByType('sys_user_sex');
    const list = sexDict.filter(item => item.dictValue === sex);
    return list.length > 0 ? list[0].dictLabel : '';
  }

  /**
   * 导入用户数据（Excel）
   * @param fileBuffer 上传的文件 buffer
   * @param updateSupport 是否允许更新已存在用户
   */
  async importUsersFromExcel(fileBuffer: Buffer, updateSupport: boolean): Promise<{
    count: number;
    details: string[];
  }> {
    const workbook = new ExcelJS.Workbook();
    const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { count: 0, details: [] };
    }

    const details: string[] = [];

    // 构建表头映射
    const headerRow = worksheet.getRow(1);
    const headerMap = new Map<string, number>();
    headerRow.eachCell((cell, colNumber) => {
      const key = (cell.value || '').toString().trim();
      if (key) {
        headerMap.set(key, colNumber);
      }
    });

    const getCellValue = (row: ExcelJS.Row, keys: string[]): string => {
      for (const key of keys) {
        const col = headerMap.get(key);
        if (col) {
          const val = row.getCell(col).text?.trim();
          if (val) return val;
        }
      }
      return '';
    };

    // 字典映射（label -> value）
    const sexDict = await this.dictService.getDictDataByType('sys_user_sex');
    const statusDict = await this.dictService.getDictDataByType('sys_normal_disable');
    const sexMap = new Map<string, string>();
    const statusMap = new Map<string, string>();
    sexDict.forEach(item => sexMap.set(item.dictLabel, item.dictValue));
    statusDict.forEach(item => statusMap.set(item.dictLabel, item.dictValue));

    const mapSex = (label: string): string => {
      if (!label) return '2';
      return sexMap.get(label) || '2';
    };
    const mapStatus = (label: string): string => {
      if (!label) return '0';
      return statusMap.get(label) || '0';
    };

    let imported = 0;

    // 从第二行开始读取数据
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
    });

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      const userId = getCellValue(row, ['用户编号']);
      const userName = getCellValue(row, ['用户名称']);
      const nickName = getCellValue(row, ['用户昵称']);
      const deptIdStr = getCellValue(row, ['部门']);
      const phonenumber = getCellValue(row, ['手机号码']);
      const email = getCellValue(row, ['邮箱']);
      const sexLabel = getCellValue(row, ['性别']);
      const statusLabel = getCellValue(row, ['状态']);
      const remark = getCellValue(row, ['备注']);

      if (!userName) continue;

      const sex = mapSex(sexLabel);
      const status = mapStatus(statusLabel);
      const deptId = deptIdStr ? Number(deptIdStr) : undefined;

      const existing = await this.userRepository.findOne({ where: { userName } });

      if (existing) {
        if (!updateSupport) {
          continue;
        }
        await this.userRepository.update(existing.userId, {
          nickName,
          phonenumber,
          email,
          deptId,
          sex: sex as any,
          status,
          remark,
        });
        imported++;
        details.push(`${imported}、账号 ${userName} 更新成功`);
      } else {
        const password = await bcrypt.hash('123456', 10);
        const newUser = this.userRepository.create({
          userId: userId ? Number(userId) : undefined,
          userName,
          password,
          nickName,
          phonenumber,
          email,
          deptId,
          sex: sex as any,
          status,
          remark,
          delFlag: '0',
        });
        await this.userRepository.save(newUser);
        imported++;
        details.push(`${imported}、账号 ${userName} 导入成功`);
      }
    }

    return { count: imported, details };
  }
}
