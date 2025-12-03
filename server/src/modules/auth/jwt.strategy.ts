import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { GlobalStatus } from 'src/types/global.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { user_id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.status !== GlobalStatus.ACTIVE) {
      throw new UnauthorizedException('用户账户已被禁用');
    }

    return {
      user_id: user.user_id,
      user_name: user.user_name,
      nick_name: user.nick_name,
      status: user.status,
      remark: user.remark,
      create_time: user.create_time,
      update_time: user.update_time,
      login_date: user.login_date,
      login_ip: user.login_ip,
      avatar: user.avatar,
      sex: user.sex,
      dept_id: user.dept_id,
      user_type: user.user_type,
      email: user.email,
      phonenumber: user.phonenumber,
    };
  }
}
