import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DictService } from './dict.service';
import { ResponseWrapper } from 'src/common/response.wrapper';

@UseGuards(JwtAuthGuard)
@Controller('dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get('type/:dictType')
  async getDictDataByType(@Param('dictType') dictType: string) {
    const data = await this.dictService.getDictDataByType(dictType);
    return ResponseWrapper.success(data, '操作成功');
  }
}