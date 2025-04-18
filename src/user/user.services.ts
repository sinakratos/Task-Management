import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entity/user.entity';
import * as bcrypt from 'bcryptjs';
import { Role } from './enums/role.enum';
import { PaginationQueryDto } from './dto/pagination-query.dto';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Validate password strength (min 8 chars, at least 1 upper, 1 lower)
  private isPasswordValid(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
  }

  async create(createUserDto: CreateUserDto) {
    const { email, username, phone, password } = createUserDto;
    //
    if (!this.isPasswordValid(password)) {
      throw new InternalServerErrorException(
        'Password must be at least 8 characters long, contain both uppercase and lowercase letters, and include at least one number.',
      );
    }
    //
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }, { phone }],
    });
    if (existingUser) {
      throw new InternalServerErrorException('Username, email, or phone already taken');
    }
    //
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role ?? Role.USER,
    });

    return this.userRepository.save(user);
  }

  findAll(paginationQuery: PaginationQueryDto) {
    const { limit, offset } = paginationQuery;
    return this.userRepository.find({
      skip: offset,
      take: limit,
    });
  }

  findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }
}
