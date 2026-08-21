import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface ExportSubmission {
  id: string;
  school_name: string;
  teacher_name: string;
  teacher_phone: string;
  teacher_email: string | null;
  series_number: number;
  file_url: string | null;
  file_name: string | null;
  source: string | null;
  status: string;
  created_at: string;
}

interface TypedRow {
  submission_id: string;
  student_name: string;
  subject: string | null;
  marks: number | null;
  grade: string | null;
  position: number | null;
}

const PARSABLE = /\.(xlsx|xls|csv)$/i;

const sanitizeSheetName = (name: string, used: Set<string>) => {
  let base = (name || 'Sheet').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 28) || 'Sheet';
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base.slice(0, 27)}~${i}`;
    i++;
  }
  used.add(candidate.toLowerCase());
  return candidate;
};

const fetchUploadedRows = async (submission: ExportSubmission): Promise<Record<string, any>[] | null> => {
  if (!submission.file_url || !submission.file_name || !PARSABLE.test(submission.file_name)) return null;
  const parts = submission.file_url.split('/result-submissions/');
  if (parts.length < 2) return null;
  const { data, error } = await supabase.storage
    .from('result-submissions')
    .createSignedUrl(parts[1], 120);
  if (error || !data) return null;
  try {
    const res = await fetch(data.signedUrl);
    const buffer = await res.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const first = wb.Sheets[wb.SheetNames[0]];
    if (!first) return null;
    return XLSX.utils.sheet_to_json<Record<string, any>>(first, { defval: '' });
  } catch {
    return null;
  }
};

export const exportCombinedResults = async (
  submissions: ExportSubmission[],
  opts: { series?: number | 'all'; status?: string } = {}
) => {
  const series = opts.series ?? 'all';
  const status = opts.status ?? 'all';

  const filtered = submissions.filter(
    (s) =>
      (series === 'all' || s.series_number === series) &&
      (status === 'all' || s.status === status)
  );

  if (filtered.length === 0) {
    throw new Error('No submissions match the selected filters');
  }

  const { data: typedRows } = await supabase
    .from('result_submission_rows')
    .select('submission_id, student_name, subject, marks, grade, position')
    .in('submission_id', filtered.map((s) => s.id));

  const rowsBySubmission = new Map<string, TypedRow[]>();
  (typedRows || []).forEach((r: any) => {
    const list = rowsBySubmission.get(r.submission_id) || [];
    list.push(r);
    rowsBySubmission.set(r.submission_id, list);
  });

  const workbook = XLSX.utils.book_new();
  const used = new Set<string>();
  const summary: Record<string, any>[] = [];
  const allRows: Record<string, any>[] = [];

  for (const submission of filtered) {
    const typed = rowsBySubmission.get(submission.id) || [];
    let sheetRows: Record<string, any>[] = [];
    let note = '';

    if (typed.length > 0) {
      sheetRows = typed.map((r, i) => ({
        '#': i + 1,
        'Student Name': r.student_name,
        Subject: r.subject || '',
        Marks: r.marks ?? '',
        Grade: r.grade || '',
        Position: r.position ?? '',
      }));
    } else {
      const parsed = await fetchUploadedRows(submission);
      if (parsed && parsed.length > 0) {
        sheetRows = parsed.map((r, i) => ({ '#': i + 1, ...r }));
      } else {
        note = submission.file_name
          ? 'Manual review needed (file could not be read automatically)'
          : 'No result rows';
      }
    }

    summary.push({
      School: submission.school_name,
      Teacher: submission.teacher_name,
      Phone: submission.teacher_phone,
      Email: submission.teacher_email || '',
      Series: `Series ${submission.series_number}`,
      Status: submission.status,
      Source: submission.source === 'typed' ? 'Typed' : 'Upload',
      'Submitted On': format(new Date(submission.created_at), 'dd MMM yyyy HH:mm'),
      Students: sheetRows.length,
      Notes: note,
    });

    if (sheetRows.length > 0) {
      const sheetName = sanitizeSheetName(submission.school_name, used);
      const sheet = XLSX.utils.json_to_sheet(sheetRows);
      sheet['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

      sheetRows.forEach((r) => {
        allRows.push({
          School: submission.school_name,
          Series: `Series ${submission.series_number}`,
          ...r,
        });
      });
    }
  }

  const summarySheet = XLSX.utils.json_to_sheet(summary);
  summarySheet['!cols'] = [
    { wch: 30 }, { wch: 22 }, { wch: 15 }, { wch: 24 }, { wch: 10 },
    { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  // Move Summary to the front
  workbook.SheetNames = ['Summary', ...workbook.SheetNames.filter((n) => n !== 'Summary')];

  if (allRows.length > 0) {
    const allSheet = XLSX.utils.json_to_sheet(allRows);
    allSheet['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 5 }, { wch: 28 }, { wch: 18 }, { wch: 10 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(workbook, allSheet, 'All Results');
  }

  const label = series === 'all' ? 'AllSeries' : `Series${series}`;
  XLSX.writeFile(workbook, `TASSA_Results_${label}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

  return { submissions: filtered.length, rows: allRows.length };
};
