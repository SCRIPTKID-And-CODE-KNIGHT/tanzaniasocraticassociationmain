import { useEffect, useMemo, useState } from 'react';
import { Printer, Search, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Candidate, GRADES, canRenderBroadsheet, loadBroadsheet, summarize } from '@/lib/broadsheet';
import { openResultFile } from '@/lib/resultFiles';

interface Props {
  fileValue: string;
  schoolName: string;
  region?: string;
  district?: string;
  centreNo?: string;
  series: number;
}

const cell = 'border border-foreground/40 px-2 py-1';

export default function ExamBroadsheet({ fileValue, schoolName, region, district, centreNo, series }: Props) {
  const [rows, setRows] = useState<Candidate[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const renderable = canRenderBroadsheet(fileValue);

  useEffect(() => {
    setRows(null); setError('');
    if (!renderable) return;
    loadBroadsheet(fileValue)
      .then((r) => (r.length ? setRows(r) : setError('No candidate rows were found in this file.')))
      .catch(() => setError('The results file could not be read.'));
  }, [fileValue, renderable]);

  const s = useMemo(() => (rows ? summarize(rows) : null), [rows]);
  const shown = useMemo(
    () => (rows || []).filter((r) => !q || r.name.includes(q.toUpperCase()) || r.no.includes(q)),
    [rows, q],
  );
  const open = () => openResultFile(fileValue).catch(() => undefined);

  if (!renderable || error) {
    return (
      <div className="space-y-3">
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        <Button onClick={open}>Open school results <ExternalLink className="h-4 w-4 ml-2" /></Button>
      </div>
    );
  }
  if (!rows || !s) {
    return <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading broadsheet…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search candidate name or number" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="outline" onClick={open}>Original file <ExternalLink className="h-4 w-4 ml-2" /></Button>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print broadsheet</Button>
      </div>

      <div id="broadsheet" className="bg-card text-foreground font-mono text-xs sm:text-sm">
        <div className="text-center leading-relaxed border-b-2 border-foreground pb-3 mb-4">
          <p className="font-bold tracking-wide">TANZANIA ADVANCED SOCRATIC SCHOOLS ASSOCIATION</p>
          <p>ACADEMIC SECRETARIAT &amp; EVALUATION COMMITTEE</p>
          <p className="font-bold">SERIES {series} JOINT GEOGRAPHY EXAMINATION RESULTS</p>
          <p className="font-bold mt-1">
            {centreNo ? `${centreNo} — ` : ''}{schoolName.toUpperCase()}
            {region ? ` (${[district, region].filter(Boolean).join(', ').toUpperCase()})` : ''}
          </p>
        </div>

        <p className="font-bold mb-1">DIVISION / GRADE PERFORMANCE SUMMARY</p>
        <div className="overflow-x-auto mb-2">
          <table className="border-collapse w-full text-center">
            <thead>
              <tr className="bg-muted">
                <th className={`${cell} text-left`}>SEX</th>
                {GRADES.map((g) => <th key={g} className={cell}>{g}</th>)}
                <th className={cell}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {s.hasSex && (['F', 'M'] as const).map((k) => {
                const d = k === 'F' ? s.female : s.male;
                return (
                  <tr key={k}>
                    <td className={`${cell} text-left`}>{k}</td>
                    {d.map((n, i) => <td key={i} className={cell}>{n}</td>)}
                    <td className={cell}>{d.reduce((a, b) => a + b, 0)}</td>
                  </tr>
                );
              })}
              <tr className="font-bold">
                <td className={`${cell} text-left`}>T</td>
                {s.all.map((n, i) => <td key={i} className={cell}>{n}</td>)}
                <td className={cell}>{s.all.reduce((a, b) => a + b, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mb-5">
          CANDIDATES: {rows.length} · SAT: {s.sat} · ABSENT: {s.absent} · CENTRE AVERAGE: {s.average ?? '—'}
        </p>

        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead>
              <tr className="bg-muted text-center">
                <th className={cell}>CNO</th>
                <th className={`${cell} text-left`}>CANDIDATE NAME</th>
                {s.hasSex && <th className={cell}>SEX</th>}
                <th className={cell}>GEO 1</th>
                <th className={cell}>GEO 2</th>
                <th className={cell}>TOTAL</th>
                <th className={cell}>AVG</th>
                <th className={cell}>GRADE</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={`${r.no}-${i}`} className="text-center even:bg-muted/40">
                  <td className={cell}>{r.no.padStart(3, '0')}</td>
                  <td className={`${cell} text-left whitespace-nowrap`}>{r.name}</td>
                  {s.hasSex && <td className={cell}>{r.sex}</td>}
                  <td className={cell}>{r.geo1 ?? '-'}</td>
                  <td className={cell}>{r.geo2 ?? '-'}</td>
                  <td className={cell}>{r.total ?? '-'}</td>
                  <td className={cell}>{r.average ?? '-'}</td>
                  <td className={`${cell} font-bold`}>{r.grade}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={8} className={`${cell} text-center text-muted-foreground`}>No candidate matches your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          KEY: A 80–100 · B 70–79 · C 60–69 · D 50–59 · E 40–49 · S 35–39 · F 0–34 · ABS absent
        </p>
      </div>
    </div>
  );
}
