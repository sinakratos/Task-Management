import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from '../enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '09123456789' })
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'StrongPass1',
    description: 'Must be at least 8 characters, 1 uppercase, 1 lowercase, and 1 number',
  })
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Role, default: Role.USER })
  role?: Role;
}
