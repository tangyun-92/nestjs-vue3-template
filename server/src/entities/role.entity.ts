import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from './user-role.entity';
import { RoleMenu } from './role-menu.entity';

@Entity('sys_role')
export class Role {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: '角色ID',
  })
  roleId: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: '000000',
    comment: '租户编号',
  })
  tenantId: string;

  @Column({
    type: 'varchar',
    length: 30,
    comment: '角色名称',
  })
  roleName: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '角色权限字符串',
  })
  roleKey: string;

  @Column({
    type: 'int',
    comment: '显示顺序',
  })
  roleSort: number;

  @Column({
    type: 'char',
    length: 1,
    default: '1',
    comment:
      '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限 5：仅本人数据权限 6：部门及以下或本人数据权限）',
  })
  dataScope: string;

  @Column({
    type: 'tinyint',
    default: 1,
    comment: '菜单树选择项是否关联显示',
  })
  menuCheckStrictly: boolean;

  @Column({
    type: 'tinyint',
    default: 1,
    comment: '部门树选择项是否关联显示',
  })
  deptCheckStrictly: boolean;

  @Column({
    type: 'char',
    length: 1,
    comment: '角色状态（0正常 1停用）',
  })
  status: string;

  @Column({
    type: 'char',
    length: 1,
    default: '0',
    comment: '删除标志（0代表存在 1代表删除）',
  })
  delFlag: string;

  @Column({
    type: 'bigint',
    nullable: true,
    comment: '创建部门',
  })
  createDept: number;

  @Column({
    type: 'bigint',
    nullable: true,
    comment: '创建者',
  })
  createBy: number;

  @Column({
    type: 'bigint',
    nullable: true,
    comment: '更新者',
  })
  updateBy: number;

  @CreateDateColumn({
    type: 'datetime',
    nullable: true,
    comment: '创建时间',
  })
  createTime: Date;

  @UpdateDateColumn({
    type: 'datetime',
    nullable: true,
    comment: '更新时间',
  })
  updateTime: Date;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '备注',
  })
  remark: string;

  // 关联用户角色
  @OneToMany(() => UserRole, userRole => userRole.role)
  userRoles: UserRole[];

  // 关联角色菜单
  @OneToMany(() => RoleMenu, roleMenu => roleMenu.role)
  roleMenus: RoleMenu[];
}