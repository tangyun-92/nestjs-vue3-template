import { Controller, Get, Req, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MenuService } from "./menu.service";
import { UserDataBaseDto } from "../user/dto/user.dto";

@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
  ) {
  }

  @Get('getRouters')
  async getRouters(@Request() req) {
    // 从token中解析出的用户信息
    const user = req.user;

    // 构造UserDataBaseDto格式的用户数据
    const userData: UserDataBaseDto = {
      user_id: user.user_id,
      user_name: user.user_name,
      nick_name: user.nick_name,
      user_type: user.user_type,
      email: user.email,
      phonenumber: user.phonenumber,
      sex: user.sex,
      avatar: user.avatar,
      status: user.status,
      dept_id: user.dept_id,
      login_ip: user.login_ip,
      login_date: user.login_date,
      remark: user.remark,
      create_time: user.create_time,
      update_time: user.update_time
    };

    return await this.menuService.getRouters(userData);
  }
}