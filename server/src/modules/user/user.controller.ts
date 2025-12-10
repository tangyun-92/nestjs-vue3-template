import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import type { CreateUserDto, QueryUserDto, UserDataBaseDto } from "./dto/user.dto";
import { UserService } from "./user.service";
import { ResponseWrapper } from "src/common/response.wrapper";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OperLog, LogInsert, LogUpdate, LogDelete, LogSelect } from "src/common/decorators/oper-log.decorator";

@UseGuards(JwtAuthGuard)
@Controller('system/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 查询用户列表
   * @param query 查询参数
   * @returns 用户列表
   */
  @Get()
  @LogSelect('查询用户列表')
  async findAll(@Query() query: QueryUserDto) {
    const result = await this.userService.findAll(query);
    return ResponseWrapper.successWithPagination(
      result.users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }),
      result.total,
      query.page || 1,
      query.pageSize || 10,
      '获取用户列表成功',
    );
  }

  @Post()
  @LogInsert('创建用户')
  async create(@Body() createUserDto: CreateUserDto) {
    if (
      !createUserDto.userName ||
      !createUserDto.password ||
      !createUserDto.nickName
    ) {
      throw new BadRequestException('用户名、密码、昵称不能为空');
    }

    const user = await this.userService.create(createUserDto);
    const { password, ...userWithoutPassword } = user;
    return ResponseWrapper.success(userWithoutPassword, '创建用户成功');
  }

}