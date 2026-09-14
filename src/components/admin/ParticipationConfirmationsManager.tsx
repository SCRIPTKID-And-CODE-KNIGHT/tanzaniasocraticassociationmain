import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Trash2, Search, RefreshCw } from 'lucide-react';

interface ConfirmationRow {
  id: string;
  series_number: number;
  confirmed_by: string;
  number_of_students: number | null;
  notes: string | null;
  created_at: string;
  schools: { school_name: string; region: string; district: string } | null;
}

const ParticipationConfirmationsManager = () => {
  const [rows, setRows] = useState<ConfirmationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [seriesFilter, setSeriesFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clearAll, setClearAll] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [activeSeries, setActiveSeries] = useState<string>('1');
  const [isOpen, setIsOpen] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('participation_settings')
      .select('id, active_series_number, is_open')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setSettingsId(data.id);
      setActiveSeries(String(data.active_series_number));
      setIsOpen(data.is_open);
    }
  };

  const saveSettings = async (nextSeries: string, nextOpen: boolean) => {
    setSavingSettings(true);
    const payload = { active_series_number: parseInt(nextSeries), is_open: nextOpen };
    const { data, error } = settingsId
      ? await supabase.from('participation_settings').update(payload).eq('id', settingsId).select('id').maybeSingle()
      : await supabase.from('participation_settings').insert(payload).select('id').maybeSingle();
    setSavingSettings(false);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    if (data?.id) setSettingsId(data.id);
    setActiveSeries(nextSeries);
    setIsOpen(nextOpen);
    toast({ title: 'Saved', description: `Schools now confirm for Series ${nextSeries}.` });
  };

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('participation_confirmations')
      .select('*, schools(school_name, region, district)')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setRows((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('participation_confirmations').delete().eq('id', id);
    setDeleteId(null);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: 'Confirmation removed.' });
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = async () => {
    const ids = filtered.map((r) => r.id);
    setClearAll(false);
    if (!ids.length) return;
    const { error } = await supabase.from('participation_confirmations').delete().in('id', ids);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Cleared', description: `${ids.length} confirmation(s) deleted.` });
    setRows((prev) => prev.filter((r) => !ids.includes(r.id)));
  };

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      r.schools?.school_name?.toLowerCase().includes(q) ||
      r.confirmed_by?.toLowerCase().includes(q) ||
      r.schools?.region?.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Participation Confirmations
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchRows}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={filtered.length === 0}
              onClick={() => setClearAll(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete shown
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search school, region or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Series</TableHead>
                <TableHead>Confirmed By</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.schools?.school_name || 'Unknown school'}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.schools?.district}, {r.schools?.region}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">Series {r.series_number}</Badge></TableCell>
                  <TableCell>{r.confirmed_by}</TableCell>
                  <TableCell>{r.number_of_students ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No confirmations found.</div>
          )}
          {loading && <div className="text-center py-8 text-muted-foreground">Loading...</div>}
        </div>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this confirmation?</AlertDialogTitle>
            <AlertDialogDescription>
              The school's participation confirmation will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearAll} onOpenChange={setClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all shown confirmations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {filtered.length} confirmation record(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearAll}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ParticipationConfirmationsManager;
