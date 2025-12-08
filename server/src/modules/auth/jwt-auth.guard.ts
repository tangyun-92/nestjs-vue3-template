import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    try {
      const result = await super.canActivate(context);
      if (!result) {
        this.setUnauthorizedResponse(response);
        throw new UnauthorizedException('Token验证失败');
      }
      return true;
    } catch (error) {
      console.log('JWT Auth Error:', error); // 添加调试日志
      this.setUnauthorizedResponse(response);
      throw new UnauthorizedException('Token无效或已过期');
    }
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      let message = '当前用户没有权限访问该接口，请先登录或携带有效的Token';

      if (info) {
        if (info.name === 'TokenExpiredError') {
          message = 'Token已过期，请重新登录';
        } else if (info.name === 'JsonWebTokenError') {
          message = 'Token无效，请重新登录';
        } else if (info.name === 'NotBeforeError') {
          message = 'Token尚未生效';
        }
      }

      // 抛出异常，让canActivate方法的catch块处理
      throw new UnauthorizedException(message);
    }
    return user;
  }

  private setUnauthorizedResponse(response: Response) {
    // 设置一个自定义的响应数据，让响应拦截器能够识别并处理
    (response as any)._authError = {
      code: 401,
      result: false,
      data: null,
      message: 'Token无效或已过期，请重新登录'
    };
  }
}
