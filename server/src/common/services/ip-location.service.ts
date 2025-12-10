import { Injectable } from '@nestjs/common';
import * as geoip from 'geoip-lite';

@Injectable()
export class IpLocationService {
  /**
   * 根据IP地址获取地理位置信息
   * @param ip IP地址
   * @returns 地理位置
   */
  getLocationByIp(ip: string): string {
    // 清理IP地址（移除IPv6前缀）
    const cleanIp = ip.replace(/^::ffff:/, '');

    // 检查是否是内网IP
    if (this.isPrivateIp(cleanIp)) {
      return '内网IP';
    }

    // 使用geoip-lite查询地理位置
    const geo = geoip.lookup(cleanIp);

    if (geo) {
      // 构建地理位置字符串
      const location: string[] = [];

      if (geo.country) {
        location.push(this.getCountryName(geo.country));
      }

      if (geo.region) {
        location.push(geo.region);
      }

      if (geo.city) {
        location.push(geo.city);
      }

      if (location.length > 0) {
        return location.join('|');
      }
    }

    return '未知地区';
  }

  /**
   * 检查是否是内网IP
   * @param ip IP地址
   * @returns 是否是内网IP
   */
  private isPrivateIp(ip: string): boolean {
    // IPv4 私有地址范围
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./,
      /^::1$/,
      /^localhost$/i,
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * 获取国家名称（中文）
   * @param countryCode 国家代码
   * @returns 国家中文名称
   */
  private getCountryName(countryCode: string): string {
    const countryNames: Record<string, string> = {
      'CN': '中国',
      'US': '美国',
      'JP': '日本',
      'KR': '韩国',
      'GB': '英国',
      'DE': '德国',
      'FR': '法国',
      'RU': '俄罗斯',
      'CA': '加拿大',
      'AU': '澳大利亚',
      'IN': '印度',
      'BR': '巴西',
      'SG': '新加坡',
      'MY': '马来西亚',
      'TH': '泰国',
      'VN': '越南',
      'PH': '菲律宾',
      'ID': '印度尼西亚',
      'HK': '中国香港',
      'TW': '中国台湾',
      'MO': '中国澳门',
    };

    return countryNames[countryCode] || countryCode;
  }
}