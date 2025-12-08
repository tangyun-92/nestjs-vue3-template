import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_config')
export class Config {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: '参数主键',
  })
  configId: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: '000000',
    comment: '租户编号',
  })
  tenantId: string;

  @Column({
    type: 'varchar',
    length: 100,
    default: '',
    comment: '参数名称',
  })
  configName: string;

  @Column({
    type: 'varchar',
    length: 100,
    default: '',
    comment: '参数键名',
  })
  configKey: string;

  @Column({
    type: 'varchar',
    length: 500,
    default: '',
    comment: '参数键值',
  })
  configValue: string;

  @Column({
    type: 'char',
    length: 1,
    default: 'N',
    comment: '系统内置（Y是 N否）',
  })
  configType: string;

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

  @CreateDateColumn({ type: 'datetime', nullable: true, comment: '创建时间' })
  createTime: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true, comment: '更新时间' })
  updateTime: Date;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '备注',
  })
  remark: string;
}