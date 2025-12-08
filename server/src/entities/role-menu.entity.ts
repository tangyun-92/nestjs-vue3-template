import { Column, Entity, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Menu } from './menu.entity';

@Entity('sys_role_menu')
export class RoleMenu {
  @PrimaryColumn({
    type: 'bigint',
    comment: '角色ID'
  })
  roleId: number;

  @PrimaryColumn({
    type: 'bigint',
    comment: '菜单ID'
  })
  menuId: number;

  // 关联角色实体
  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  // 关联菜单实体
  @ManyToOne(() => Menu, { nullable: false })
  @JoinColumn({ name: 'menuId' })
  menu: Menu;
}