import * as XLSX from "xlsx";

export const MAX_STUDENTS = 250;

export interface TemplateOptions {
  schoolName: string;
  studentCount: number;
  averageDivisor: number;
  seriesNumber?: string | number;
}

/**
 * Builds the official TASSA results template workbook for a single school.
 * Columns: No. | Student Name | Geography 1 | Geography 2 | Total | Average
 * Total and Average are live Excel formulas.
 */
export function buildResultTemplateWorkbook({
  schoolName,
  studentCount,
  averageDivisor,
  seriesNumber,
}: TemplateOptions) {
  const count = Math.max(1, Math.min(MAX_STUDENTS, Math.floor(studentCount) || 1));
  const divisor = averageDivisor > 0 ? averageDivisor : 2;

  const rows: (string | number)[][] = [
    ["TANZANIA ADVANCED SOCRATIC SCHOOLS ASSOCIATION"],
    ["RESULTS SUBMISSION TEMPLATE"],
    ["School Name:", schoolName || ""],
    ["Series:", seriesNumber ? `Series ${seriesNumber}` : ""],
    ["Average calculated as Total ÷", divisor],
    [],
    ["No.", "Student Name", "Geography 1", "Geography 2", "Total", "Average"],
  ];

  const headerRow = rows.length; // 1-indexed row of header in Excel
  for (let i = 1; i <= count; i++) {
    const excelRow = headerRow + i;
    rows.push([
      i,
      "",
      "",
      "",
      { f: `IF(COUNT(C${excelRow}:D${excelRow})=0,"",SUM(C${excelRow}:D${excelRow}))` } as unknown as string,
      { f: `IF(COUNT(C${excelRow}:D${excelRow})=0,"",SUM(C${excelRow}:D${excelRow})/${divisor})` } as unknown as string,
    ]);
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 6 },
    { wch: 34 },
    { wch: 13 },
    { wch: 13 },
    { wch: 10 },
    { wch: 10 },
  ];
  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Results");
  return wb;
}

export function downloadResultTemplate(options: TemplateOptions) {
  const wb = buildResultTemplateWorkbook(options);
  const safeName = (options.schoolName || "TASSA").replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
  XLSX.writeFile(wb, `TASSA_Results_Template_${safeName}.xlsx`);
}
