import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_notice')
export class Notice {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: '公告ID',
  })
  noticeId: number;

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
    comment: '公告标题',
  })
  noticeTitle: string;

  @Column({
    type: 'char',
    length: 1,
    comment: '公告类型（1通知 2公告）',
  })
  noticeType: string;

  @Column({
    type: 'longblob',
    nullable: true,
    comment: '公告内容',
  })
  noticeContent: Buffer;

  @Column({
    type: 'char',
    length: 1,
    default: '0',
    comment: '公告状态（0正常 1关闭）',
  })
  status: string;

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
    length: 255,
    nullable: true,
    comment: '备注',
  })
  remark: string;
}