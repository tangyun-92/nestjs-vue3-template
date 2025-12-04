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
    const { userName, status, page = 1, pageSize = 10 } = queryUserDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (userName) {
      queryBuilder.andWhere('user.userName LIKE :userName', {
        userName: `%${userName}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    const total = await queryBuilder.getCount();
    const users = await queryBuilder
      .orderBy('user.createTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      total,
      users,
    };
  }

  /**
   * 创建用户
   * @param createUserDto 创建用户参数
   * @returns 创建的用户信息
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const {
      userName,
      password,
      nickName,
      email,
      phonenumber,
      sex,
      status,
      remark,
    } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      userName,
      password: hashedPassword,
      nickName: nickName,
      email: email,
      phonenumber: phonenumber,
      sex: sex,
      status: status,
      remark: remark,
    });

    // 查看数据库中用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { userName },
    });
    if (existingUser) {
      throw new UnauthorizedException('用户名已存在');
    }

    return this.userRepository.save(user);
  }

}
