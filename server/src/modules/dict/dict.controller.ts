import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DictService } from './dict.service';
import { DictDataService } from './dict-data.service';
import { ResponseWrapper } from 'src/common/response.wrapper';

@UseGuards(JwtAuthGuard)
@Controller('system/dict')
export class DictController {
  constructor(
    private readonly dictService: DictService,
    private readonly dictDataService: DictDataService,
  ) {}

  @Get('dictType/:dictType')
  async getDictDataByType(@Param('dictType') dictType: string) {
    const data = await this.dictService.getDictDataByType(dictType);
    return ResponseWrapper.success(data, '操作成功');
  }
}