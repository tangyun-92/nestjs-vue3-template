import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('sys_post')
export class Post {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    comment: '岗位ID',
  })
  postId: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: '000000',
    comment: '租户编号',
  })
  tenantId: string;

  @Column({
    type: 'bigint',
    comment: '部门id',
  })
  deptId: number;

  @Column({
    type: 'varchar',
    length: 64,
    comment: '岗位编码',
  })
  postCode: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '岗位类别编码',
  })
  postCategory: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '岗位名称',
  })
  postName: string;

  @Column({
    type: 'int',
    comment: '显示顺序',
  })
  postSort: number;

  @Column({
    type: 'char',
    length: 1,
    comment: '状态（0正常 1停用）',
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
    length: 500,
    nullable: true,
    comment: '备注',
  })
  remark: string;
}