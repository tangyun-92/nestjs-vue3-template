import { Body, Controller, Get, Post, UnauthorizedException, UseGuards, Request, Headers } from "@nestjs/common";
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
  async login(@Body() loginDto: LoginDto, @Request() req) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
      req,
    );

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const result = this.authService.login(user);

    return result;
  }

  @Public()
  @Post('logout')
  async logout(@Request() req) {
    // 获取用户信息（token有效时会有user，token过期时为空）
    const userName = req.user?.userName || '已过期用户';

    // 记录退出日志
    await this.authService.recordLogoutLog(userName, req);

    return ResponseWrapper.success('', '退出成功');
  }

  @Get('getInfo')
  async getUserInfo(@Request() req) {
    const user = req.user;
    return await this.authService.getUserInfo(user);
  }

  
  @Get('check-token')
  async checkToken(
    @Request() req,
    @Headers('authorization') authHeader: string,
  ) {
    // 提取 token
    const token = authHeader?.replace('Bearer ', '');

    // 手动解码 JWT 来查看过期时间
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.decode(token, { complete: true });
      const now = Math.floor(Date.now() / 1000);
      const isExpired = decoded.payload.exp < now;
      const expirationDate = new Date(decoded.payload.exp * 1000);

      return {
        tokenInfo: {
          issuedAt: new Date(decoded.payload.iat * 1000),
          expiresAt: expirationDate,
          isExpired: isExpired,
          timeToExpiry: decoded.payload.exp - now,
          payload: decoded.payload,
        },
      };
    } catch (error) {
      return {
        error: 'Invalid token',
        message: error.message,
      };
    }
  }
}
