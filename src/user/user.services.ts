import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Role } from 'src/auth/enums/role.enum';
import { User } from './entity/user.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { UpdateUserByUserDto } from './dto/update-user-byUser.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // -------------------------
  // 🔒 Password helpers
  // -------------------------
  private isPasswordValid(password: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  // -------------------------
  // 👤 CRUD operations
  // -------------------------
  async create(dto: CreateUserDto): Promise<User> {
    const { email, username, phone, password, role } = dto;

    if (!this.isPasswordValid(password)) {
      throw new InternalServerErrorException(
        'Password must be at least 8 characters long, contain uppercase, lowercase letters, and at least one number.',
      );
    }

    const exists = await this.userRepository.findOne({
      where: [{ username }, { email }, { phone }],
    });
    if (exists) {
      throw new InternalServerErrorException('Username, email, or phone already taken');
    }

    const user = this.userRepository.create({
      ...dto,
      password: await this.hashPassword(password),
      role: role ?? Role.USER,
    });

    return this.userRepository.save(user);
  }

  async findAll({ limit, offset }: PaginationQueryDto): Promise<User[]> {
    return this.userRepository.find({ skip: offset, take: limit });
  }

  async findOneById(id: number): Promise<User> {
    return this.getUserOrThrow(id);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    return this.updateUserData(id, dto);
  }

  async updateUser(id: number, dto: UpdateUserByUserDto): Promise<User> {
    return this.updateUserData(id, dto);
  }

  async toggleRole(userId: number, role: Role): Promise<string> {
    const user = await this.getUserOrThrow(userId);

    user.role = user.role === role ? Role.USER : role;
    await this.userRepository.save(user);

    return `Role updated: ${user.username} is now ${user.role}`;
  }

  async removeById(id: number): Promise<{ message: string }> {
    const user = await this.getUserOrThrow(id);
    await this.userRepository.remove(user);

    return { message: 'User and related tasks deleted successfully' };
  }

  // -------------------------
  // 🔧 Helpers
  // -------------------------
  private async getUserOrThrow(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  private async updateUserData<T extends UpdateUserDto | UpdateUserByUserDto>(
    id: number,
    dto: T,
  ): Promise<User> {
    const user = await this.getUserOrThrow(id);

    const cleaned: Partial<T> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== '' && value !== undefined && value !== null) {
        cleaned[key as keyof T] = value as any;
      }
    }

    if (cleaned.password) {
      cleaned.password = (await this.hashPassword(cleaned.password as string)) as any;
    }

    const updated = this.userRepository.merge(user, cleaned);
    return this.userRepository.save(updated);
  }

  async findAllSortedAndFiltered(
    sortBy: string = 'id',
    sort: 'ASC' | 'DESC' = 'ASC',
    search?: string,
  ) {
    const query = this.userRepository.createQueryBuilder('user');

    // Filter
    if (search) {
      query.where(
        'user.username LIKE :search OR user.email LIKE :search OR user.phone LIKE :search',
        { search: `%${search}%` },
      );
    }

    // Sort
    query.orderBy(`user.${sortBy}`, sort);

    return query.getMany();
  }
}
