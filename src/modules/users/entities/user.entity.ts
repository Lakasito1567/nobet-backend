import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1000 })
  balance!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToMany(() => User, user => user.friends)
  @JoinTable()
  friends!: User[];
}