import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Markdown {
  @PrimaryGeneratedColumn()
  markdownId: number;

  @Column({ type: 'text', nullable: true })
  markdownContent: string;

  @Column({ type: 'text', nullable: true })
  htmlContent: string;

  @Column({ type: 'text', nullable: true })
  shortDescription: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ nullable: true })
  createdBy?: number;

  @Column({ nullable: true })
  updatedBy?: number;

  @Column({ nullable: true })
  deletedBy?: number;
}
