import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { diskStorage, File } from 'multer';

import { Task } from './entity/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

import { User } from 'src/user/entity/user.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(user: User, dto: CreateTaskDto, file?: File) {
    const userLink = await this.userRepo.findOne({ where: { id: user.id } });
    if (!userLink) throw new NotFoundException('User not found');

    console.log(user, dto, userLink);
    const task = this.taskRepo.create({
      ...dto,
      attachment: file ? file.filename : null,
      user: userLink,
    });
    console.log(task);

    return this.taskRepo.save(task);
  }
  findAll() {
    return this.taskRepo.find({ relations: ['user'] });
  }

  async findOne(id: number) {
    const task = await this.taskRepo.findOne({ where: { id }, relations: ['user'] });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: number, dto: UpdateTaskDto) {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.taskRepo.delete(id);
  }
}
