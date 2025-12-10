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
export class AutoOperLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AutoOperLogInterceptor.name);

  // 排除的路径列表
  private readonly excludedPaths = [
    '/auth/login',
    '/auth/logout',
    '/auth/getInfo',
    '/auth/check-token',
    '/monitor/operlog',
    '/monitor/logininfor',
    '/health',
    '/favicon.ico',
    '/static',
    '/assets',
    '/public',
  ];

  constructor(
    private readonly reflector: Reflector,
    private readonly operLogService: OperLogMiddlewareService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // 检查是否需要排除
    if (this.shouldExclude(request)) {
      return next.handle();
    }

    // 获取操作日志元数据（如果有手动标记的装饰器）
    const operLogMeta = this.reflector.get<{
      title?: string;
      businessType?: number;
      operatorType?: number;
    }>('operLog', context.getHandler());

    const startTime = Date.now();

    // 获取用户信息
    const user = (request as any).user;
    const userName = user?.userName || '匿名用户';

    // 获取客户端信息
    const clientInfo = this.getClientInfo(request);

    // 自动生成日志信息
    const autoLogInfo = this.generateAutoLogInfo(request);

    return next.handle().pipe(
      tap((response) => {
        // 成功响应时记录日志
        this.recordLog({
          title: operLogMeta?.title || autoLogInfo.title,
          businessType: operLogMeta?.businessType || autoLogInfo.businessType,
          operatorType: operLogMeta?.operatorType || 1,
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
          title: operLogMeta?.title || autoLogInfo.title,
          businessType: operLogMeta?.businessType || autoLogInfo.businessType,
          operatorType: operLogMeta?.operatorType || 1,
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

  /**
   * 检查是否应该排除该路径
   */
  private shouldExclude(req: Request): boolean {
    const path = req.path;
    const method = req.method;

    // 排除所有GET请求（查询操作）
    if (method === 'GET') {
      return true;
    }

    // 检查排除列表
    for (const excludePath of this.excludedPaths) {
      if (path.includes(excludePath)) {
        return true;
      }
    }

    // 排除静态文件
    const ext = path.split('.').pop()?.toLowerCase();
    const staticExts = ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'];
    if (ext && staticExts.includes(ext)) {
      return true;
    }

    // 排除健康检查和系统接口
    if (path.startsWith('/_next') || path.startsWith('/webpack')) {
      return true;
    }

    return false;
  }

  /**
   * 自动生成日志信息
   */
  private generateAutoLogInfo(req: Request) {
    const method = req.method;
    const path = req.path;

    // 从路径中提取模块和操作信息
    const pathParts = path.split('/').filter(part => part && !part.match(/^\d+$/));
    const module = pathParts[0] || '系统';
    const resource = pathParts[1] || '资源';

    // 默认标题
    let title = '';
    let businessType = BusinessType.OTHER;

    // 根据HTTP方法和路径判断操作类型
    if (method === 'GET') {
      if (path.includes('/list') || path.endsWith('s')) {
        title = `查询${this.getDisplayName(resource)}列表`;
        businessType = BusinessType.SELECT;
      } else if (path.match(/\/\d+$/)) {
        title = `查询${this.getDisplayName(resource)}详情`;
        businessType = BusinessType.SELECT;
      } else {
        title = `获取${this.getDisplayName(resource)}`;
        businessType = BusinessType.SELECT;
      }
    } else if (method === 'POST') {
      if (path.includes('/import')) {
        title = `导入${this.getDisplayName(resource)}`;
        businessType = BusinessType.IMPORT;
      } else if (path.includes('/export')) {
        title = `导出${this.getDisplayName(resource)}`;
        businessType = BusinessType.EXPORT;
      } else {
        title = `新增${this.getDisplayName(resource)}`;
        businessType = BusinessType.INSERT;
      }
    } else if (method === 'PUT' || method === 'PATCH') {
      title = `修改${this.getDisplayName(resource)}`;
      businessType = BusinessType.UPDATE;
    } else if (method === 'DELETE') {
      if (path.includes('/clean')) {
        title = `清空${this.getDisplayName(resource)}`;
        businessType = BusinessType.CLEAN;
      } else {
        title = `删除${this.getDisplayName(resource)}`;
        businessType = BusinessType.DELETE;
      }
    } else {
      title = `${method} ${this.getDisplayName(resource)}`;
    }

    // 特殊处理一些常见的路径
    if (path.includes('/dict/') && path.includes('/data')) {
      const operation = this.inferDictOperation(path, method);
      title = operation.title;
      businessType = operation.businessType;
    }

    return { title, businessType };
  }

  /**
   * 获取资源的显示名称
   */
  private getDisplayName(resource: string): string {
    const nameMap: Record<string, string> = {
      'user': '用户',
      'role': '角色',
      'menu': '菜单',
      'dept': '部门',
      'post': '岗位',
      'dict': '字典',
      'config': '配置',
      'notice': '公告',
      'operlog': '操作日志',
      'logininfor': '登录日志',
      'login': '登录',
      'logout': '退出',
      'profile': '个人信息',
      'password': '密码',
      'upload': '文件上传',
      'download': '文件下载',
      'export': '导出',
      'import': '导入',
    };

    // 复数转单数
    const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;

    return nameMap[singular] || nameMap[resource] || this.capitalize(resource);
  }

  /**
   * 首字母大写
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 推断字典操作
   */
  private inferDictOperation(path: string, method: string) {
    if (path.includes('/type')) {
      if (method === 'POST') return { title: '新增字典类型', businessType: BusinessType.INSERT };
      if (method === 'PUT') return { title: '修改字典类型', businessType: BusinessType.UPDATE };
      if (method === 'DELETE') return { title: '删除字典类型', businessType: BusinessType.DELETE };
    } else if (path.includes('/data')) {
      if (method === 'POST') return { title: '新增字典数据', businessType: BusinessType.INSERT };
      if (method === 'PUT') return { title: '修改字典数据', businessType: BusinessType.UPDATE };
      if (method === 'DELETE') return { title: '删除字典数据', businessType: BusinessType.DELETE };
    }
    return { title: '字典操作', businessType: BusinessType.OTHER };
  }

  private recordLog(options: {
    title: string;
    businessType: number;
    operatorType: number;
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
      title: options.title,
      businessType: options.businessType,
      method: `${options.request.method} ${options.request.path}`,
      requestMethod: options.request.method,
      operatorType: options.operatorType,
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