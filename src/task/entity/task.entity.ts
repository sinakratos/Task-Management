import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/user/entity/user.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  attachment: string;

  @JoinColumn({ name: 'userId' })
  @ManyToOne(() => User, user => user.tasks, {
    onDelete: 'CASCADE',
  })
  user: User;
}
