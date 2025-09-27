import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlinkSync } from 'fs';
import { Repository } from 'typeorm';
import { join } from 'path';
import { File } from 'multer';

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

  async update(id: number, user: User, dto: UpdateTaskDto, file?: File) {
    const task = await this.taskRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['user'],
    });

    if (!task) {
      throw new NotFoundException('Task not found or not owned by user');
    }

    if (dto.name) task.name = dto.name;
    if (dto.description) task.description = dto.description;
    if (file) task.attachment = file.filename;

    return this.taskRepo.save(task);
  }

  async delete(id: number, user: User) {
    const task = await this.taskRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['user'],
    });

    if (!task) {
      throw new NotFoundException('Task not found!');
    }

    if (task.attachment) {
      const filePath = join(process.cwd(), 'uploads/attachment', task.attachment);
      try {
        await unlinkSync(filePath);
      } catch (err) {
        console.warn(`Could not delete file: ${filePath}`, err.message);
      }
    }

    await this.taskRepo.remove(task);
    return { message: 'Task deleted successfully' };
  }
}
