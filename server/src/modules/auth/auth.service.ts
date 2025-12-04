import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserDataBaseDto } from "../user/dto/user.dto";
import { Repository } from "typeorm";
import { User } from "src/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { GlobalStatus } from "src/types/global.types";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 验证用户
   * @param userName 用户名
   * @param password 密码
   * @returns 用户信息
   */
  async validateUser(
    userName: string,
    password: string,
  ): Promise<UserDataBaseDto | null> {
    const user = await this.userRepository.findOne({ where: { userName: userName } });
    if (!user) {
      return null;
    }

    // 检查用户状态
    if (user.status !== GlobalStatus.ACTIVE) {
      throw new Error('用户被禁用');
    }

    // 验证密码
    if (await bcrypt.compare(password, user.password)) {
      // 更新最后登录时间
      await this.userRepository.update(user.userId, {
        loginDate: new Date(),
      });

      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  /**
   * 登录
   * @param user 用户信息
   * @returns 登录信息
   */
  async login(user: UserDataBaseDto) {
    const payload = {
      userName: user.userName,
      sub: user.userId,
      nickName: user.nickName,
      status: user.status,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.userId,
        userName: user.userName,
        nickName: user.nickName,
        status: user.status,
        loginDate: user.loginDate,
      },
    };
  }
}