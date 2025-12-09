import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_dept')
export class Dept {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: '部门id',
  })
  deptId: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: '000000',
    comment: '租户编号',
  })
  tenantId: string;

  @Column({
    type: 'bigint',
    default: 0,
    comment: '父部门id',
  })
  parentId: number;

  @Column({
    type: 'varchar',
    length: 500,
    default: '',
    comment: '祖级列表',
  })
  ancestors: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: '',
    comment: '部门名称',
  })
  deptName: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '部门类别编码',
  })
  deptCategory: string;

  @Column({
    type: 'int',
    default: 0,
    comment: '显示顺序',
  })
  orderNum: number;

  @Column({
    type: 'bigint',
    nullable: true,
    comment: '负责人',
  })
  leader: number;

  @Column({
    type: 'varchar',
    length: 11,
    nullable: true,
    comment: '联系电话',
  })
  phone: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '邮箱',
  })
  email: string;

  @Column({
    type: 'char',
    length: 1,
    default: '0',
    comment: '部门状态（0正常 1停用）',
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
}