import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpCode } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 增强版全局响应拦截器
 * 自动将响应包装成统一格式，支持智能消息生成
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;

    // 检查是否有认证错误
    if ((response as any)._authError) {
      return new Observable(observer => {
        observer.next((response as any)._authError);
        observer.complete();
      });
    }

    return next.handle().pipe(
      map(data => {
        // 如果已经是标准格式，直接返回
        if (data && typeof data === 'object' && 'code' in data && 'result' in data) {
          return data;
        }

        // 否则包装成标准格式
        return {
          code: 200,
          result: true,
          data,
          message: this.generateSuccessMessage(method, url)
        };
      })
    );
  }

  /**
   * 根据HTTP方法和URL生成智能成功消息
   */
  private generateSuccessMessage(method: string, url: string): string {
    const endpoint = url.split('/').pop() || '操作';

    // 根据常见操作生成消息
    const actionMap = {
      'POST': {
        'login': '登录成功',
        'register': '注册成功',
        'refresh': 'Token刷新成功',
        'logout': '登出成功',
        'create': '创建成功',
        'default': '提交成功'
      },
      'PUT': {
        'default': '更新成功'
      },
      'DELETE': {
        'default': '删除成功'
      },
      'GET': {
        'default': '获取成功'
      }
    };

    const methodActions = actionMap[method] || actionMap[method]?.default;
    return methodActions?.[endpoint] || methodActions?.default || '操作成功';
  }
}
