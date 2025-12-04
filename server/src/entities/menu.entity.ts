import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_menu')
export class Menu {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  menuId: number;

  @Column({ type: 'varchar', length: 50, comment: '菜单名称' })
  menuName: string;

  @Column({ type: 'bigint', width: 20, default: 0, comment: '父菜单ID' })
  parentId: number;

  @Column({ type: 'int', width: 4, default: 0, comment: '显示顺序' })
  orderNum: number;

  @Column({ type: 'varchar', length: 200, default: '', comment: '路由地址' })
  path: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '组件路径' })
  component: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '路由参数' })
  queryParam: string;

  @Column({
    type: 'int',
    width: 1,
    default: 1,
    comment: '是否为外链（0是 1否）',
  })
  isFrame: number;

  @Column({
    type: 'int',
    width: 1,
    default: 0,
    comment: '是否缓存（0缓存 1不缓存）',
  })
  isCache: number;

  @Column({
    type: 'char',
    length: 1,
    default: '',
    comment: '菜单类型（M目录 C菜单 F按钮）',
  })
  menuType: string;

  @Column({
    type: 'char',
    length: 1,
    default: '0',
    comment: '显示状态（0显示 1隐藏）',
  })
  visible: string;

  @Column({
    type: 'char',
    length: 1,
    default: '0',
    comment: '菜单状态（0正常 1停用）',
  })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '权限标识' })
  perms: string;

  @Column({ type: 'varchar', length: 100, default: '#', comment: '菜单图标' })
  icon: string;

  @Column({ type: 'bigint', width: 20, nullable: true, comment: '创建部门' })
  createDept: number;

  @Column({ type: 'bigint', width: 20, nullable: true, comment: '创建者' })
  createBy: number;

  @CreateDateColumn({ type: 'datetime', nullable: true, comment: '创建时间' })
  createTime: Date;

  @Column({ type: 'bigint', width: 20, nullable: true, comment: '更新者' })
  updateBy: number;

  @UpdateDateColumn({ type: 'datetime', nullable: true, comment: '更新时间' })
  updateTime: Date;

  @Column({ type: 'varchar', length: 500, default: '', comment: '备注' })
  remark: string;
}
