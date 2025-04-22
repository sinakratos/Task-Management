import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Role } from './enums/role.enum';
import { User } from './entity/user.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserByUserDto } from './dto/update-user-byUser.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Validate password strength (min 8 chars, at least 1 upper, 1 lower)
  private isPasswordValid(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }
  //
  private async hashPassword(entryPassword: string) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(entryPassword, salt);
    return hashedPassword;
  }

  async create(createUserDto: CreateUserDto) {
    const { email, username, phone, password, role } = createUserDto;
    console.log(createUserDto);
    //
    if (!this.isPasswordValid(password)) {
      throw new InternalServerErrorException(
        'Password must be at least 8 characters long, contain both uppercase and lowercase letters, and include at least one number.',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }, { phone }],
    });
    if (existingUser) {
      throw new InternalServerErrorException('Username, email, or phone already taken');
    }
    //
    const user = this.userRepository.create({
      ...createUserDto,
      password: await this.hashPassword(createUserDto.password),
      role: role ?? Role.USER,
    });
    const result = await this.userRepository.save(user);
    return result;
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { limit, offset } = paginationQuery;
    const result = await this.userRepository.find({
      skip: offset,
      take: limit,
    });

    return result;
  }

  async findOneById(id: number) {
    const result = await this.userRepository.findOne({ where: { id } });
    return result;
  }

  async findByUsername(username: string) {
    const result = await this.userRepository.findOne({ where: { username } });
    return result;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Create a clean object with only non-empty fields
    const cleanedData: Partial<UpdateUserDto> = {};
    for (const [key, value] of Object.entries(updateUserDto)) {
      if (value !== '' && value !== undefined && value !== null) {
        cleanedData[key] = value;
      }
    }

    if (cleanedData.password) {
      cleanedData.password = await this.hashPassword(cleanedData.password);
    }

    const updatedUser = this.userRepository.merge(user, cleanedData);
    const result = await this.userRepository.save(updatedUser);
    return result;
  }

  async updateUser(id: number, updateUserByUserDto: UpdateUserByUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Create a clean object with only non-empty fields
    const cleanedData: Partial<UpdateUserByUserDto> = {};
    for (const [key, value] of Object.entries(updateUserByUserDto)) {
      if (value !== '' && value !== undefined && value !== null) {
        cleanedData[key] = value;
      }
    }
    if (cleanedData.password) {
      cleanedData.password = await this.hashPassword(cleanedData.password);
    }

    const updatedUser = this.userRepository.merge(user, cleanedData);
    const result = await this.userRepository.save(updatedUser);
    return result;
  }

  async toggleRole(userId: number, role: Role) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    user.role = user.role === role ? Role.USER : role;

    await this.userRepository.save(user);

    return `Role updated: ${user.username} is now ${user.role}`;
  }

  async removeById(id: number) {
    await this.userRepository.delete(id);
    return 'User deleted successfully';
  }
}
