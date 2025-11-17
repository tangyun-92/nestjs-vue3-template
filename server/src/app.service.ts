import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}
  getHello(): string {
    return 'Hello World!';
  }

  async onModuleInit() {
    await this.initializeDatabase();
  }

  initializeDatabase() {
    try {
      console.log('数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error.message);
    }
  }
}
