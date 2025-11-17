import { Controller, Get, Post, Query } from "@nestjs/common";
import type { QueryUserDto } from "./dto/query-user.dto";
import { UserService } from "./user.service";
import { ResponseWrapper } from "src/common/response.wrapper";

@Controller('user')
export class UserController { 
  constructor(
    private readonly userService: UserService
  ) {
  }

  @Get()
  async findAll(@Query() query: QueryUserDto) {
    const result = await this.userService.findAll(query);
    return ResponseWrapper.successWithPagination(
      result.users.map(user => {
        const { password, ...userWithoutPassword} = user;
        return userWithoutPassword;
      }),
      result.total,
      query.page || 1,
      query.pageSize || 10,
      '获取用户列表成功'
    )
  }
}