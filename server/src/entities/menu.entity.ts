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
  menu_id: number;

  @Column({ type: 'varchar', length: 50, comment: '菜单名称' })
  menu_name: string;

  @Column({ type: 'bigint', width: 20, default: 0, comment: '父菜单ID' })
  parent_id: number;

  @Column({ type: 'int', width: 4, default: 0, comment: '显示顺序' })
  order_num: number;

  @Column({ type: 'varchar', length: 200, default: '', comment: '路由地址' })
  path: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '组件路径' })
  component: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '路由参数' })
  query_param: string;

  @Column({
    type: 'int',
    width: 1,
    default: 1,
    comment: '是否为外链（0是 1否）',
  })
  is_frame: number;

  @Column({
    type: 'int',
    width: 1,
    default: 0,
    comment: '是否缓存（0缓存 1不缓存）',
  })
  is_cache: number;

  @Column({
    type: 'char',
    length: 1,
    default: '',
    comment: '菜单类型（M目录 C菜单 F按钮）',
  })
  menu_type: string;

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
  create_dept: number;

  @Column({ type: 'bigint', width: 20, nullable: true, comment: '创建者' })
  create_by: number;

  @CreateDateColumn({ type: 'datetime', nullable: true, comment: '创建时间' })
  create_time: Date;

  @Column({ type: 'bigint', width: 20, nullable: true, comment: '更新者' })
  update_by: number;

  @UpdateDateColumn({ type: 'datetime', nullable: true, comment: '更新时间' })
  update_time: Date;

  @Column({ type: 'varchar', length: 500, default: '', comment: '备注' })
  remark: string;
}
