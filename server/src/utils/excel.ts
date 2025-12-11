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
