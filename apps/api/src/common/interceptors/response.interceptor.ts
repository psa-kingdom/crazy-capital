import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@cc/types';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If response already matches standard format, return as-is
        if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
          return res;
        }
        return {
          success: true,
          message: res?.message || 'Operation successful',
          data: res?.data !== undefined ? res.data : res,
        };
      }),
    );
  }
}
