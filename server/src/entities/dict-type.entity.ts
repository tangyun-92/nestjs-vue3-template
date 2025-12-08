import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('sys_dict_type')
@Unique(['dictType'])
export class DictType {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  dictId: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: '000000',
    comment: '租户编号',
  })
  tenantId: string;

  @Column({ type: 'varchar', length: 100, default: '', comment: '字典名称' })
  dictName: string;

  @Column({ type: 'varchar', length: 100, default: '', comment: '字典类型' })
  dictType: string;

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

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '备注' })
  remark: string;
}