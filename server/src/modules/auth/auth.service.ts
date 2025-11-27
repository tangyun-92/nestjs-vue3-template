import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserDataBaseDto } from "../user/dto/user.dto";
import { Repository } from "typeorm";
import { User, UserRole, UserStatus } from "src/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import bcrypt from "bcryptjs";

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
  }

  /**
   * 验证用户
   * @param username 用户名
   * @param password 密码
   * @returns 用户信息
   */
  async validateUser(username: string, password: string): Promise<UserDataBaseDto | null> {
    const user = await this.userRepository.findOne({ where: { username} });
    if (!user) {
      return null;
    }

    // 检查用户状态
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('用户被禁用');
    }

    // 验证密码
    if (await bcrypt.compare(password, user.password)) {
      // 更新最后登录时间
      await this.userRepository.update(user.id, {
        last_login_time: new Date(),
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

    return {
      user: {
        id: user.id,
        username: user.username,
        roles: user.role,
        status: user.status,
        last_login_time: user.last_login_time,
      }
    }
  }

  /**
   * 注册
   * @param username 用户名
   * @param password 密码
   * @param role 角色
   * @returns 注册信息
   */
  async register(username: string, password: string, role: UserRole = UserRole.USER): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      role,
      status: UserStatus.ACTIVE,
    });

    // 查看数据库中用户名是否已存在
    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new UnauthorizedException('用户名已存在');
    }

    return this.userRepository.save(user);
  }
}