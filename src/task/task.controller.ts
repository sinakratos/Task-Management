import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  ParseEnumPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage, File } from 'multer';
import { extname } from 'path';

import { TaskService } from './task.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UserDecorator } from 'src/user/user.decorator';
import { User } from 'src/user/entity/user.entity';

@ApiBearerAuth()
@ApiTags('tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/attachment',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `attachment-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a task with optional attachment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  create(
    @UserDecorator() user: User,
    @Body() createTaskDto: CreateTaskDto,
    @UploadedFile() file: File,
  ) {
    return this.taskService.create(user, createTaskDto, file);
  }

  @Get()
  findAll() {
    return this.taskService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('tasks/filter/:keyword')
  async getTasksFiltered(@Param('keyword') keyword: string) {
    if (!keyword || keyword.trim() === '') {
      throw new BadRequestException('Keyword cannot be empty');
    }
    return this.taskService.findAllSortedAndFiltered('id', 'ASC', keyword);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('tasks/sort/:field/:order')
  async getTasksSorted(
    @Param('field') field: string,
    @Param('order', new ParseEnumPipe(['ASC', 'DESC'])) order: 'ASC' | 'DESC',
  ) {
    if (!field || field.trim() === '') {
      throw new BadRequestException('Sort field cannot be empty');
    }
    return this.taskService.findAllSortedAndFiltered(field, order);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/attachment',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `attachment-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a task (name, description, or attachment)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UserDecorator() user: User,
    @Body() updateTaskDto: UpdateTaskDto,
    @UploadedFile() file: File,
  ) {
    return this.taskService.update(id, user, updateTaskDto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Delete a task ' })
  async delete(@Param('id', ParseIntPipe) id: number, @UserDecorator() user: User) {
    return this.taskService.delete(id, user);
  }
}
