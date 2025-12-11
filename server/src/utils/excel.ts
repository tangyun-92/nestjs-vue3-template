import * as ExcelJS from 'exceljs';

/**
 * Excel 列定义接口
 */
export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Excel 导出选项
 */
export interface ExcelExportOptions {
  /** 工作表名称 */
  sheetName?: string;
  /** 表头背景色（ARGB格式，如 '4472C4'） */
  headerBgColor?: string;
  /** 表头文字颜色（ARGB格式，如 'FFFFFF'） */
  headerTextColor?: string;
  /** 表头行高 */
  headerHeight?: number;
  /** 数据行高 */
  rowHeight?: number;
  /** 是否启用斑马纹 */
  enableZebraStripes?: boolean;
  /** 斑马纹背景色（ARGB格式，如 'F2F2F2'） */
  zebraStripeColor?: string;
}

/**
 * 设置表头样式
 */
function setHeaderStyle(
  worksheet: ExcelJS.Worksheet,
  bgColor: string,
  textColor: string,
  height: number,
): void {
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: textColor } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = height;
}

/**
 * 添加数据行
 */
function addDataRows(
  worksheet: ExcelJS.Worksheet,
  data: any[],
  rowHeight: number,
  enableZebraStripes: boolean,
  zebraStripeColor: string,
): void {
  data.forEach((rowData, index) => {
    const row = worksheet.addRow(rowData);

    // 设置数据行样式
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // 设置行高
    row.height = rowHeight;

    // 斑马纹效果
    if (enableZebraStripes && index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: zebraStripeColor },
        };
      });
    }
  });
}

/**
 * 生成 Excel buffer
 */
async function generateBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    workbook.xlsx
      .writeBuffer()
      .then((buffer: any) => {
        if (buffer && Buffer.isBuffer(buffer)) {
          resolve(buffer);
        } else {
          resolve(Buffer.from(buffer));
        }
      })
      .catch((error) => {
        console.error('生成 Excel 文件失败:', error);
        reject(new Error('生成 Excel 文件失败: ' + error.message));
      });
  });
}

/**
 * Excel 导入行处理函数类型
 */
export interface ExcelImportRowProcessor<T> {
  (rowData: Record<string, string>, index: number): Promise<{
    action: 'create' | 'update' | 'skip';
    data?: T;
    message?: string;
  }>;
}

/**
 * Excel 导入结果
 */
export interface ExcelImportResult {
  /** 导入总数 */
  count: number;
  /** 详细信息列表 */
  details: string[];
  /** 成功导入的数据列表 */
  successData: any[];
  /** 失败的数据列表 */
  failData: Array<{
    row: number;
    data: Record<string, string>;
    error: string;
  }>;
}

/**
 * Excel 导入选项
 */
export interface ExcelImportOptions {
  /** 跳过行数（默认跳过第一行表头） */
  skipRows?: number;
  /** 是否忽略空行 */
  ignoreEmptyRows?: boolean;
  /** 最大处理行数 */
  maxRows?: number;
}

/**
 * 从 Excel 文件读取数据
 * @param fileBuffer Excel 文件 buffer
 * @param processor 行处理函数
 * @param options 导入选项
 * @returns 导入结果
 */
export async function importFromExcel<T = any>(
  fileBuffer: Buffer,
  processor: ExcelImportRowProcessor<T>,
  options: ExcelImportOptions = {},
): Promise<ExcelImportResult> {
  const {
    skipRows = 1,
    ignoreEmptyRows = true,
    maxRows = 10000,
  } = options;

  const workbook = new ExcelJS.Workbook();
  const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return {
      count: 0,
      details: ['Excel 文件中没有工作表'],
      successData: [],
      failData: [],
    };
  }

  // 构建表头映射
  const headerRow = worksheet.getRow(1);
  const headerMap = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    const key = (cell.value || '').toString().trim();
    if (key) {
      headerMap.set(key, colNumber);
    }
  });

  // 获取行数据的辅助函数
  const getRowData = (row: ExcelJS.Row): Record<string, string> => {
    const data: Record<string, string> = {};
    headerMap.forEach((colNum, header) => {
      const val = row.getCell(colNum).text?.trim();
      if (val !== undefined) {
        data[header] = val;
      }
    });
    return data;
  };

  // 检查行是否为空
  const isRowEmpty = (row: ExcelJS.Row): boolean => {
    let hasValue = false;
    row.eachCell((cell) => {
      if (cell.value && cell.value.toString().trim()) {
        hasValue = true;
      }
    });
    return !hasValue;
  };

  const result: ExcelImportResult = {
    count: 0,
    details: [],
    successData: [],
    failData: [],
  };

  let processedCount = 0;

  // 处理数据行
  for (let rowNumber = skipRows + 1; rowNumber <= worksheet.rowCount && processedCount < maxRows; rowNumber++) {
    const row = worksheet.getRow(rowNumber);

    // 跳过空行
    if (ignoreEmptyRows && isRowEmpty(row)) {
      continue;
    }

    const rowData = getRowData(row);
    processedCount++;

    try {
      const processResult = await processor(rowData, processedCount);

      if (processResult.action === 'skip') {
        continue;
      }

      if (processResult.action === 'create' || processResult.action === 'update') {
        result.count++;
        result.details.push(processResult.message || `${result.count}、数据已${processResult.action === 'create' ? '导入' : '更新'}`);
        if (processResult.data) {
          result.successData.push(processResult.data);
        }
      }
    } catch (error) {
      result.failData.push({
        row: rowNumber,
        data: rowData,
        error: error instanceof Error ? error.message : String(error),
      });
      result.details.push(`第 ${rowNumber} 行处理失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return result;
}

/**
 * 导出数据为 Excel
 * @param columns 列定义
 * @param data 数据数组
 * @param options 导出选项
 * @returns Excel buffer
 */
export async function exportToExcel(
  columns: ExcelColumn[],
  data: any[],
  options: ExcelExportOptions = {},
): Promise<Buffer> {
  const {
    sheetName = '数据列表',
    headerBgColor = '4472C4',
    headerTextColor = 'FFFFFF',
    headerHeight = 25,
    rowHeight = 22,
    enableZebraStripes = true,
    zebraStripeColor = 'F2F2F2',
  } = options;

  // 创建工作簿
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // 设置列
  worksheet.columns = columns;

  // 设置表头样式
  setHeaderStyle(worksheet, headerBgColor, headerTextColor, headerHeight);

  // 添加数据行
  addDataRows(worksheet, data, rowHeight, enableZebraStripes, zebraStripeColor);

  // 生成 buffer
  return generateBuffer(workbook);
}
