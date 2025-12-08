import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_dict_data')
export class DictData {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  dictCode: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: '000000',
    comment: '租户编号',
  })
  tenantId: string;

  @Column({ type: 'int', width: 4, default: 0, comment: '字典排序' })
  dictSort: number;

  @Column({ type: 'varchar', length: 100, default: '', comment: '字典标签' })
  dictLabel: string;

  @Column({ type: 'varchar', length: 100, default: '', comment: '字典键值' })
  dictValue: string;

  @Column({ type: 'varchar', length: 100, default: '', comment: '字典类型' })
  dictType: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '样式属性（其他样式扩展）' })
  cssClass: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '表格回显样式' })
  listClass: string;

  @Column({
    type: 'char',
    length: 1,
    default: 'N',
    comment: '是否默认（Y是 N否）',
  })
  isDefault: string;

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