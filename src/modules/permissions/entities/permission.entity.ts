import { RolePermission } from 'src/modules/role_permission/entities/role_permission.entity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'permissions' })
export class Permission {
  @PrimaryGeneratedColumn()
  permissionId: number;

  @Column()
  name: string;

  @Column()
  apiPath: string;

  @Column()
  method: string;

  @Column()
  module: string;

  @Column({ nullable: true, default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  deletedBy: number;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermission: RolePermission[];
}
