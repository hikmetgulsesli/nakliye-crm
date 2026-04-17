import ExcelJS from 'exceljs';

export async function generateExcelReport(
  title: string,
  columns: { header: string; key: string; width: number }[],
  rows: Record<string, unknown>[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NakliyeCRM';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Rapor');

  // Title row - merged across all columns
  const colCount = columns.length;
  worksheet.mergeCells(1, 1, 1, colCount);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF1976D2' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Date row
  worksheet.mergeCells(2, 1, 2, colCount);
  const dateCell = worksheet.getCell('A2');
  dateCell.value = `Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`;
  dateCell.font = { size: 10, italic: true, color: { argb: 'FF666666' } };
  dateCell.alignment = { horizontal: 'center' };

  // Empty row
  worksheet.addRow([]);

  // Header row (row 4)
  const headerRow = worksheet.addRow(columns.map((c) => c.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });
  headerRow.height = 24;

  // Set column widths
  columns.forEach((col, idx) => {
    const wsCol = worksheet.getColumn(idx + 1);
    wsCol.width = col.width;
    wsCol.key = col.key;
  });

  // Data rows
  for (const row of rows) {
    const dataRow = worksheet.addRow(columns.map((c) => row[c.key] ?? ''));
    dataRow.eachCell((cell) => {
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
      cell.alignment = { vertical: 'middle' };
    });
  }

  // Alternate row coloring
  for (let i = 5; i <= worksheet.rowCount; i++) {
    if (i % 2 === 0) {
      worksheet.getRow(i).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
