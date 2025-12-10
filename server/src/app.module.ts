import { MiddlewareConsumer, Module, OnModuleInit, ValidationPipe } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport'
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './entities/user.entity';
import { OperLog } from './entities/oper-log.entity';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { JwtModule } from '@nestjs/jwt';
import { LoggerMiddleware } from './common/logger.middleware';
import { OperLogMiddlewareService } from './common/services/oper-log.service';
import { AutoOperLogInterceptor } from './common/interceptors/auto-oper-log.interceptor';
import { MenuModule } from './modules/menu/menu.module';
import { DictModule } from './modules/dict/dict.module';
import { ConfigModule } from './modules/config/config.module';
import { RoleModule } from './modules/role/role.module';
import { DeptModule } from './modules/dept/dept.module';
import { PostModule } from './modules/post/post.module';
import { NoticeModule } from './modules/notice/notice.module';
import { OperLogModule } from './modules/monitor/operlog/oper-log.module';
import { LoginInfoModule } from './modules/monitor/loginlog/login-log.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        charset: configService.get('DB_CHARSET'),
        timezone: configService.get('DB_TIMEZONE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    MenuModule,
    DictModule,
    ConfigModule,
    RoleModule,
    DeptModule,
    PostModule,
    NoticeModule,
    OperLogModule,
    LoginInfoModule,
    TypeOrmModule.forFeature([User, OperLog]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局验证管道
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: false, // 只保留DTO中定义的属性
          forbidNonWhitelisted: false, // 拒绝未定义的属性
          transform: true, // 自动转换类型
          transformOptions: {
            enableImplicitConversion: true, // 启用隐式类型转换
          },
        }),
    },
    // 全局响应拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // 操作日志中间件服务
    OperLogMiddlewareService,
    // 操作日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: AutoOperLogInterceptor,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private appService: AppService) {}

  async onModuleInit() {
    await this.appService.initializeDatabase;
  }

  // 配置中间件
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*'); // 应用到所有路由
  }
}
