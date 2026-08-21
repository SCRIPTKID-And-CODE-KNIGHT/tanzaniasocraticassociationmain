# One Combined XLS for Submitted Results

Teachers can either upload a file (as today) or type student results directly into the form. Admins get a single button that packs everything for a series into one Excel workbook, with one sheet per school.

## Teacher side (Submit Results page)

- Two tabs on the form: **Upload file** (current behaviour, unchanged) and **Enter results** (new).
- "Enter results" shows an editable table: Student Name, Subject, Marks, Grade (auto-suggested from marks, still editable), plus Add row / Remove row and paste-from-Excel support for a whole block of rows.
- Same school / teacher / series / notes fields apply to both modes; the existing deadline and on-off master switch keep blocking both modes.
- On submit in typed mode, rows are saved as structured records and a submission entry is still created so it appears in the admin list (marked as "typed" rather than a file).

## Admin side (Results Submissions page)

- New **Export combined XLS** control with a series selector (All / Series 1-8) and status filter (All / Approved only).
- Clicking it builds one `.xlsx`:
  - **Summary** sheet: school, teacher, phone, series, submission date, source (typed/upload), student count.
  - **One sheet per school**: student rows with Name, Subject, Marks, Grade, Position.
  - **All Results** sheet: every row flattened with School and Series columns.
- Uploaded Excel/CSV files are also pulled in and merged: each such file is downloaded, its first sheet parsed, and its rows added under that school's sheet. Non-parsable uploads (PDF/Word) are listed on the Summary sheet as "manual review needed" so nothing silently disappears.
- Existing per-row download, status and delete actions stay as they are.

## Technical details

- New table `public.result_submission_rows` (submission_id, student_name, subject, marks, grade, position) with grants and RLS: public insert allowed only while `public.submissions_open()` is true, admin read/delete, cascade delete with the parent submission.
- `result_submissions` gets a `source` column (`upload` | `typed`) and `file_url`/`file_name` become optional for typed entries; the existing insert policy keeps enforcing the deadline switch.
- Export uses the `xlsx` package already in the project (as in `src/lib/almanacExport.ts`); a new `src/lib/resultsExport.ts` holds the workbook-building logic.
- Uploaded files are fetched through signed storage URLs, same pattern as the current download button, and parsed client-side with `XLSX.read`.
- Sheet names are sanitised and truncated to Excel's 31-character limit, with numeric suffixes for duplicate school names.
