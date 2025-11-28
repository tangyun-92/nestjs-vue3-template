import { User } from 'src/entities/user.entity';
import { CreateUserDto, QueryUserDto, UserDataBaseDto } from './dto/user.dto';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { GlobalStatus } from 'src/types/global.types';
import { UnauthorizedException } from '@nestjs/common';

export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 查询所有用户
   * @param queryUserDto 查询参数
   * @returns 用户列表
   */
  async findAll(
    queryUserDto: QueryUserDto,
  ): Promise<{ users: User[]; total: number }> {
    const { user_name, status, page = 1, pageSize = 10 } = queryUserDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (user_name) {
      queryBuilder.andWhere('user.user_name LIKE :user_name', {
        user_name: `%${user_name}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    const total = await queryBuilder.getCount();
    const users = await queryBuilder
      .orderBy('user.created_time', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      total,
      users,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const {
      user_name,
      password,
      nick_name,
      email,
      phonenumber,
      sex,
      status,
      remark,
    } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      user_name,
      password: hashedPassword,
      nick_name: nick_name,
      email: email,
      phonenumber: phonenumber,
      sex: sex,
      status: status,
      remark: remark,
    });

    // 查看数据库中用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { user_name },
    });
    if (existingUser) {
      throw new UnauthorizedException('用户名已存在');
    }

    return this.userRepository.save(user);
  }
}
