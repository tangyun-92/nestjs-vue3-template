import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sys_login_log')
export class LoginInfo {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: '访问ID',
  })
  infoId: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: '000000',
    comment: '租户编号',
  })
  tenantId: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: '',
    comment: '登录账号',
  })
  userName: string;

  @Column({
    type: 'int',
    width: 1,
    default: 0,
    comment: '登录状态（0成功 1失败）',
  })
  status: number;

  @Column({
    type: 'varchar',
    length: 128,
    default: '',
    comment: '登录IP地址',
  })
  ipaddr: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: '',
    comment: '登录地点',
  })
  loginLocation: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: '',
    comment: '浏览器类型',
  })
  browser: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: '',
    comment: '操作系统',
  })
  os: string;

  @Column({
    type: 'varchar',
    length: 4000,
    default: '',
    comment: '提示消息',
  })
  msg: string;

  @Column({
    type: 'datetime',
    comment: '登录时间',
  })
  loginTime: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: '',
    comment: '客户端标识',
  })
  clientKey: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: '',
    comment: '设备类型',
  })
  deviceType: string;
}