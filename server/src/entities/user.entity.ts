import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserSex {
  MALE = '0',
  FEMALE = '1',
  UNKNOWN = '2',
}

@Entity('sys_user')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  user_id: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: '000000',
    comment: '租户编号',
  })
  tenant_id: string;

  @Column({ type: 'bigint', width: 20, nullable: true, comment: '部门ID' })
  dept_id: number;

  @Column({ type: 'varchar', length: 30, comment: '用户账号' })
  user_name: string;

  @Column({ type: 'varchar', length: 30, comment: '用户昵称' })
  nick_name: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'sys_user',
    comment: '用户类型（sys_user系统用户）',
  })
  user_type: string;

  @Column({ type: 'varchar', length: 50, default: '', comment: '用户邮箱' })
  email: string;

  @Column({ type: 'varchar', length: 11, default: '', comment: '手机号码' })
  phonenumber: string;

  @Column({
    type: 'char',
    length: 1,
    default: UserSex.MALE,
    comment: '用户性别（0男 1女 2未知）',
  })
  sex: UserSex;

  @Column({ type: 'bigint', width: 20, nullable: true, comment: '头像地址' })
  avatar: number;

  @Column({ type: 'varchar', length: 100, default: '', comment: '密码' })
  password: string;

  @Column({
    type: 'char',
    length: 1,
    default: '0',
    comment: '帐号状态（0正常 1停用）',
  })
  status: string;

  @Column({
    type: 'char',
    length: 1,
    default: '0',
    comment: '删除标志（0代表存在 1代表删除）',
  })
  del_flag: string;

  @Column({ type: 'varchar', length: 128, default: '', comment: '最后登录IP' })
  login_ip: string;

  @Column({ type: 'datetime', nullable: true, comment: '最后登录时间' })
  login_date: Date;

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

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '备注' })
  remark: string;
}
