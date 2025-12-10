import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginInfo } from '../../../entities/login-log.entity';
import { LoginInfoService } from './login-log.service';
import { LoginInfoController } from './login-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoginInfo])],
  controllers: [LoginInfoController],
  providers: [LoginInfoService],
  exports: [LoginInfoService],
})
export class LoginInfoModule {}