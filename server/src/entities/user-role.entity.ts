import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('sys_user_role')
export class UserRole {
  @PrimaryColumn({
    type: 'bigint',
    comment: '用户ID',
  })
  userId: number;

  @PrimaryColumn({
    type: 'bigint',
    comment: '角色ID',
  })
  roleId: number;

  // 关联用户实体
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 关联角色实体
  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;
}