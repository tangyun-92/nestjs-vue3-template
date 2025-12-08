// 查询参数DTO
export interface QueryConfigDto {
  pageNum?: number;
  pageSize?: number;
  configName?: string;
  configKey?: string;
  configType?: string;
  beginTime?: string;
  endTime?: string;
  params?: {
    beginTime?: string;
    endTime?: string;
  };
}

// 创建配置DTO
export interface CreateConfigDto {
  configName: string;
  configKey: string;
  configValue: string;
  configType?: string;
  remark?: string;
}

// 更新配置DTO
export interface UpdateConfigDto {
  configId: number;
  configName?: string;
  configKey?: string;
  configValue?: string;
  configType?: string;
  remark?: string;
}

// 数据库返回的配置数据
export interface ConfigDataBaseDto {
  configId: number;
  tenantId: string;
  configName: string;
  configKey: string;
  configValue: string;
  configType: string;
  createDept?: number;
  createBy?: number;
  updateBy?: number;
  createTime: Date;
  updateTime: Date;
  remark?: string;
}

// 响应配置数据
export interface ConfigDataDto extends Omit<ConfigDataBaseDto, 'createTime' | 'updateTime'> {
  createTime: string;
  updateTime: string;
}