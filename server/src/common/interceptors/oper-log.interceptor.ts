import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';
import { OperLogMiddlewareService } from '../services/oper-log.service';
import { BusinessType } from '../../modules/monitor/operlog/dto/oper-log.dto';

@Injectable()
export class OperLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(OperLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly operLogService: OperLogMiddlewareService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 获取操作日志元数据
    const operLogMeta = this.reflector.get<{
      title?: string;
      businessType?: number;
      operatorType?: number;
    }>('operLog', context.getHandler());

    // 如果没有标记，直接放行
    if (!operLogMeta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    // 获取用户信息
    const user = (request as any).user;
    const userName = user?.userName || '匿名用户';

    // 获取客户端信息
    const clientInfo = this.getClientInfo(request);

    return next.handle().pipe(
      tap((response) => {
        // 成功响应时记录日志
        this.recordLog({
          ...operLogMeta,
          userName,
          request,
          clientInfo,
          response,
          startTime,
          status: 0,
          errorMsg: '',
        });
      }),
      catchError((error) => {
        // 错误响应时记录日志
        this.recordLog({
          ...operLogMeta,
          userName,
          request,
          clientInfo,
          response: null,
          startTime,
          status: 1,
          errorMsg: error.message || '操作失败',
        });
        return throwError(() => error);
      }),
    );
  }

  private recordLog(options: {
    title?: string;
    businessType?: number;
    operatorType?: number;
    userName: string;
    request: Request;
    clientInfo: { ip: string; location: string };
    response: any;
    startTime: number;
    status: number;
    errorMsg: string;
  }) {
    const endTime = Date.now();
    const costTime = endTime - options.startTime;

    const operLogData = {
      tenantId: '000000',
      title: options.title || this.getDefaultTitle(options.request),
      businessType: options.businessType || BusinessType.OTHER,
      method: `${options.request.method} ${options.request.path}`,
      requestMethod: options.request.method,
      operatorType: options.operatorType || 1,
      operName: options.userName,
      deptName: (options.request as any).user?.deptName || '',
      operUrl: options.request.path,
      operIp: options.clientInfo.ip,
      operLocation: options.clientInfo.location,
      operParam: this.getOperParam(options.request),
      jsonResult: this.getJsonResult(options.response),
      status: options.status,
      errorMsg: options.errorMsg,
      operTime: new Date(),
      costTime: costTime,
    };

    // 异步记录操作日志
    this.operLogService.createAsync(operLogData);
  }

  private getDefaultTitle(req: Request): string {
    const method = req.method;
    const path = req.path;

    if (method === 'GET' && path.includes('/list')) {
      return '查询列表';
    } else if (method === 'GET' && path.match(/\/\d+$/)) {
      return '查询详情';
    } else if (method === 'POST') {
      return '新增';
    } else if (method === 'PUT') {
      return '修改';
    } else if (method === 'DELETE') {
      return '删除';
    }

    return '其他操作';
  }

  private getClientInfo(req: Request) {
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
    const cleanIp = ip.replace(/^::ffff:/, '');

    return {
      ip: cleanIp,
      location: '内网IP', // 可以集成之前创建的IP定位服务
    };
  }

  private getOperParam(req: Request): string {
    try {
      let paramData: any = {};

      if (req.method === 'GET' && Object.keys(req.query).length > 0) {
        paramData = { ...req.query };
      } else if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        paramData = { ...req.body };
        delete paramData.password;
        delete paramData.oldPassword;
        delete paramData.newPassword;
      }

      return JSON.stringify(paramData);
    } catch (error) {
      return '{}';
    }
  }

  private getJsonResult(data: any): string {
    try {
      if (!data) return '';
      const dataStr = JSON.stringify(data);
      return dataStr.length > 2000 ? dataStr.substring(0, 2000) + '...' : dataStr;
    } catch (error) {
      return '';
    }
  }
}