import * as XLSX from 'xlsx';
import { isStoredFile, resolveResultUrl } from '@/lib/resultFiles';

export interface Candidate {
  no: string;
  name: string;
  sex: string;
  geo1: number | null;
  geo2: number | null;
  total: number | null;
  average: number | null;
  grade: string;
}

export const GRADES = ['A', 'B', 'C', 'D', 'E', 'S', 'F'] as const;

/** NECTA A-level grading scale (percent). */
export function gradeFor(avg: number | null): string {
  if (avg === null || Number.isNaN(avg)) return 'ABS';
  if (avg >= 80) return 'A';
  if (avg >= 70) return 'B';
  if (avg >= 60) return 'C';
  if (avg >= 50) return 'D';
  if (avg >= 40) return 'E';
  if (avg >= 35) return 'S';
  return 'F';
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

/** Parse a TASSA results workbook into candidate rows. */
export function parseBroadsheet(buf: ArrayBuffer): Candidate[] {
  const wb = XLSX.read(buf, { type: 'array' });
  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, defval: '' });
    const hIdx = rows.findIndex((r) => r.some((c) => /name/i.test(String(c))) && r.some((c) => /geo|paper|p\s*1/i.test(String(c))));
    if (hIdx < 0) continue;
    const h = rows[hIdx].map((c) => String(c).toLowerCase().trim());
    const find = (re: RegExp) => h.findIndex((c) => re.test(c));
    const iNo = find(/^(no|s\/?n|cand|index)/);
    const iName = find(/name/);
    const iSex = find(/^(sex|gender)/);
    const iG1 = find(/(geo\w*|paper)\s*(1|i)\b/);
    const iG2 = find(/(geo\w*|paper)\s*(2|ii)\b/);
    const iTot = find(/total/);
    const iAvg = find(/aver|mean|avg/);
    const iGrade = find(/^grade/);
    const out: Candidate[] = [];
    rows.slice(hIdx + 1).forEach((r, i) => {
      const name = String(r[iName] ?? '').trim();
      if (!name) return;
      const geo1 = iG1 >= 0 ? num(r[iG1]) : null;
      const geo2 = iG2 >= 0 ? num(r[iG2]) : null;
      let total = iTot >= 0 ? num(r[iTot]) : null;
      if (total === null && (geo1 !== null || geo2 !== null)) total = (geo1 ?? 0) + (geo2 ?? 0);
      let average = iAvg >= 0 ? num(r[iAvg]) : null;
      if (average === null && total !== null) average = total / 2;
      if (geo1 === null && geo2 === null && total === null) average = null;
      const givenGrade = iGrade >= 0 ? String(r[iGrade] ?? '').trim().toUpperCase() : '';
      out.push({
        no: iNo >= 0 && String(r[iNo]).trim() ? String(r[iNo]).trim() : String(i + 1),
        name: name.toUpperCase(),
        sex: iSex >= 0 ? String(r[iSex] ?? '').trim().toUpperCase().charAt(0) : '',
        geo1, geo2, total,
        average: average !== null ? Math.round(average * 10) / 10 : null,
        grade: givenGrade && /^[A-FS]$|^ABS$/.test(givenGrade) ? givenGrade : gradeFor(average),
      });
    });
    if (out.length) return out;
  }
  return [];
}

/** Only uploaded spreadsheets can be shown on screen; outside links can only be opened. */
export const canRenderBroadsheet = (value?: string | null) =>
  isStoredFile(value) && /\.(xlsx|xls|csv)$/i.test(value!);

export async function loadBroadsheet(value: string): Promise<Candidate[]> {
  const url = await resolveResultUrl(value);
  if (!url) throw new Error('File unavailable');
  const res = await fetch(url);
  if (!res.ok) throw new Error('File unavailable');
  return parseBroadsheet(await res.arrayBuffer());
}

export function summarize(c: Candidate[]) {
  const dist = (list: Candidate[]) => GRADES.map((g) => list.filter((x) => x.grade === g).length);
  const sat = c.filter((x) => x.average !== null);
  const avg = sat.length ? sat.reduce((s, x) => s + (x.average ?? 0), 0) / sat.length : null;
  return {
    female: dist(c.filter((x) => x.sex === 'F')),
    male: dist(c.filter((x) => x.sex === 'M')),
    all: dist(c),
    sat: sat.length,
    absent: c.length - sat.length,
    average: avg !== null ? Math.round(avg * 10) / 10 : null,
    hasSex: c.some((x) => x.sex === 'F' || x.sex === 'M'),
  };
}
