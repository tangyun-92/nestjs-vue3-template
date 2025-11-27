import { User } from 'src/entities/user.entity';
import { QueryUserDto } from './dto/user.dto';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

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
    const { username, role, status, page = 1, pageSize = 10 } = queryUserDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (username) {
      queryBuilder.andWhere('user.username LIKE :username', {
        username: `%${username}%`,
      });
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    const total = await queryBuilder.getCount();
    const users = await queryBuilder
      .orderBy('user.created_dt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      total,
      users,
    };
  }
}
