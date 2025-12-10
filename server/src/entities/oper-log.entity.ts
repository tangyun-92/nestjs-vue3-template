import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sys_oper_log')
export class OperLog {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: '日志主键',
  })
  operId: number;

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
    comment: '模块标题',
  })
  title: string;

  @Column({
    type: 'int',
    width: 2,
    default: 0,
    comment: '业务类型（0其它 1新增 2修改 3删除）',
  })
  businessType: number;

  @Column({
    type: 'varchar',
    length: 100,
    default: '',
    comment: '方法名称',
  })
  method: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: '',
    comment: '请求方式',
  })
  requestMethod: string;

  @Column({
    type: 'int',
    width: 1,
    default: 0,
    comment: '操作类别（0其它 1后台用户 2手机端用户）',
  })
  operatorType: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: '',
    comment: '操作人员',
  })
  operName: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: '',
    comment: '部门名称',
  })
  deptName: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: '',
    comment: '请求URL',
  })
  operUrl: string;

  @Column({
    type: 'varchar',
    length: 128,
    default: '',
    comment: '主机地址',
  })
  operIp: string;

  @Column({
    type: 'varchar',
    length: 255,
    default: '',
    comment: '操作地点',
  })
  operLocation: string;

  @Column({
    type: 'varchar',
    length: 4000,
    default: '',
    comment: '请求参数',
  })
  operParam: string;

  @Column({
    type: 'varchar',
    length: 4000,
    default: '',
    comment: '返回参数',
  })
  jsonResult: string;

  @Column({
    type: 'int',
    width: 1,
    default: 0,
    comment: '操作状态（0正常 1异常）',
  })
  status: number;

  @Column({
    type: 'varchar',
    length: 4000,
    default: '',
    comment: '错误消息',
  })
  errorMsg: string;

  @Column({
    type: 'datetime',
    comment: '操作时间',
  })
  operTime: Date;

  @Column({
    type: 'bigint',
    width: 20,
    default: 0,
    comment: '消耗时间',
  })
  costTime: number;
}