import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
export class UpdateUserByUserDto {
  @IsOptional()
  @ApiProperty({ required: false, default: '' })
  email?: string;

  @IsOptional()
  @ApiProperty({ required: false, default: '' })
  @IsString()
  phone?: string;

  @IsOptional()
  @ApiProperty({
    required: false,
    default: '',
    description: 'Must be at least 8 characters, 1 uppercase, 1 lowercase, and 1 number',
  })
  @IsString()
  password?: string;
}
