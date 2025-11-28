import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import type { CreateUserDto, QueryUserDto, UserDataBaseDto } from "./dto/user.dto";
import { UserService } from "./user.service";
import { ResponseWrapper } from "src/common/response.wrapper";

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 查询用户列表
   * @param query 查询参数
   * @returns 用户列表
   */
  @Get()
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
  async create(@Body() createUserDto: CreateUserDto) {
    if (!createUserDto.user_name || !createUserDto.password || !createUserDto.nick_name) {
      throw new BadRequestException('用户名、密码、昵称不能为空');
    }

    const user = await this.userService.create(createUserDto);
    const { password, ...userWithoutPassword } = user;
    return ResponseWrapper.success(userWithoutPassword, '创建用户成功');
  }
}