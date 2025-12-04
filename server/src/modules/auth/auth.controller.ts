import { Body, Controller, Get, Post, UnauthorizedException, UseGuards, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Public } from "./public.decorator";
import { ResponseWrapper } from "src/common/response.wrapper";

@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.userName, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    return this.authService.login(user);
  }

  @Post('logout')
  async logout() {
    return ResponseWrapper.success('', '退出成功');
  }

  @Get('getInfo')
  async getUserInfo(@Request() req) {
    const user = req.user;
    user.roles = ['superadmin'];

    return {
      user
    };
  }

}
