import { Controller, Get, Query, Req, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MenuService } from "./menu.service";
import { UserDataBaseDto } from "../user/dto/user.dto";
import type { QueryMenuDto } from "./dto/menu.dto";
import { ResponseWrapper } from "src/common/response.wrapper";

@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('getRouters')
  async getRouters(@Request() req) {
    // 从token中解析出的用户信息
    const user = req.user;

    // 构造UserDataBaseDto格式的用户数据
    const userData: UserDataBaseDto = {
      userId: user.userId,
      userName: user.userName,
      nickName: user.nickName,
      userType: user.userType,
      email: user.email,
      phonenumber: user.phonenumber,
      sex: user.sex,
      avatar: user.avatar,
      status: user.status,
      deptId: user.deptId,
      loginIp: user.loginIp,
      loginDate: user.loginDate,
      remark: user.remark,
      createTime: user.createTime,
      updateTime: user.updateTime,
    };

    return await this.menuService.getRouters(userData);
  }

  @Get()
  async findAll(@Query() query: QueryMenuDto) {
    const result = await this.menuService.findAll(query);
    return ResponseWrapper.success(
      result.menus,
      '获取菜单列表成功',
    );
  }
}