import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.services';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from './enums/role.enum';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Find all users' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.userService.findAll(paginationQuery);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Find user by ID' })
  async findOneById(@Param('id') id: string) {
    return this.userService.findOneById(+id);
  }

  @Roles(Role.ADMIN)
  @Get('findByUsername/:username')
  @ApiOperation({ summary: 'Find user by Username' })
  async findByUsername(@Param('username') username: string) {
    console.log(username);
    return this.userService.findByUsername(username);
  }

  @Roles(Role.ADMIN)
  @Patch('update/:id')
  @ApiOperation({ summary: 'Update user by ID' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove user by ID' })
  async remove(@Param('id') id: string) {
    return this.userService.removeById(+id);
  }
}
