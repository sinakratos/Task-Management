import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
