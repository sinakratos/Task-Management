import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { File } from 'multer';

import { Task } from './entity/task.entity';
import { User } from 'src/user/entity/user.entity';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // -------------------------
  // Create a new task
  // -------------------------
  async create(user: User, dto: CreateTaskDto, file?: File) {
    const userLink = await this.getUserOrThrow(user.id);

    const task = this.taskRepo.create({
      ...dto,
      attachment: file ? file.filename : null,
      user: userLink,
    });

    return this.taskRepo.save(task);
  }

  // -------------------------
  // Get all tasks with user
  // -------------------------
  findAll() {
    return this.taskRepo.find({ relations: ['user'] });
  }

  // -------------------------
  // Get a single task
  // -------------------------
  async findOne(id: number) {
    const task = await this.taskRepo.findOne({ where: { id }, relations: ['user'] });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // -------------------------
  // Update a task
  // -------------------------
  async update(id: number, user: User, dto: UpdateTaskDto, file?: File) {
    const task = await this.getTaskOrThrow(id, user.id);

    if (dto.name) task.name = dto.name;
    if (dto.description) task.description = dto.description;
    if (file) task.attachment = file.filename;

    return this.taskRepo.save(task);
  }

  // -------------------------
  // Delete a task
  // -------------------------
  async delete(id: number, user: User) {
    const task = await this.getTaskOrThrow(id, user.id);

    if (task.attachment) this.deleteFile(task.attachment);

    await this.taskRepo.remove(task);
    return { message: 'Task deleted successfully' };
  }

  // -------------------------
  // Helpers
  // -------------------------
  private async getUserOrThrow(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async getTaskOrThrow(taskId: number, userId: number): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId, user: { id: userId } },
      relations: ['user'],
    });
    if (!task) throw new NotFoundException('Task not found or not owned by user');
    return task;
  }

  private deleteFile(filename: string) {
    const filePath = join(process.cwd(), 'uploads/attachment', filename);
    try {
      unlinkSync(filePath);
    } catch (err) {
      console.warn(`Could not delete file: ${filePath}`, err.message);
    }
  }
}
