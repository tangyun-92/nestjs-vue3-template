import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { GlobalStatus } from 'src/types/global.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // 确保不忽略过期时间
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { userId: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status !== GlobalStatus.ACTIVE) {
      throw new UnauthorizedException('用户账户已被禁用');
    }

    return {
      userId: user.userId,
      userName: user.userName,
      nickName: user.nickName,
      status: user.status,
      remark: user.remark,
      createTime: user.createTime,
      updateTime: user.updateTime,
      loginDate: user.loginDate,
      loginIp: user.loginIp,
      avatar: user.avatar,
      sex: user.sex,
      deptId: user.deptId,
      userType: user.userType,
      email: user.email,
      phonenumber: user.phonenumber,
    };
  }
}
