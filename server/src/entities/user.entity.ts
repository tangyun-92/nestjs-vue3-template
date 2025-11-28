import { GlobalStatus } from "src/types/global.types";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum UserSex {
  MALE = '0',
  FEMALE = '1',
  UNKNOWN = '2'
}

@Entity('system_user')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ nullable: true, comment: '部门ID' })
  dept_id: number;

  @Column({ unique: true, comment: '用户名' })
  user_name: string;

  @Column({ comment: '昵称' })
  nick_name: string;

  @Column({ default: 'sys_user', comment: '用户类型(sys_user系统用户)' })
  user_type: string;

  @Column({ nullable: true, comment: '用户邮箱' })
  email: string;

  @Column({ nullable: true, comment: '手机号码' })
  phonenumber: string;

  @Column({
    type: 'enum',
    enum: UserSex,
    default: UserSex.MALE,
    comment: '用户性别(0男 1女 2未知)',
  })
  sex: UserSex;

  @Column({ nullable: true, comment: '头像地址' })
  avatar: string;

  @Column({ comment: '密码' })
  password: string;

  @Column({
    type: 'enum',
    enum: GlobalStatus,
    default: GlobalStatus.ACTIVE,
    comment: '用户状态(0正常 1停用)',
  })
  status: GlobalStatus;

  @Column({
    type: 'enum',
    enum: GlobalStatus,
    default: GlobalStatus.ACTIVE,
    comment: '删除标志(0代表存在 1代表删除)',
  })
  del_flag: GlobalStatus;

  @Column({ nullable: true, comment: '最后登录IP' })
  login_ip: string;

  @Column({ nullable: true, comment: '最后登录时间' })
  login_date: Date;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @CreateDateColumn({ comment: '创建时间' })
  created_time: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_time: Date;
}