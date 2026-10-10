import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadResultFile, isStoredFile, fileLabel } from '@/lib/resultFiles';

interface Props {
  id: string;
  label: string;
  value: string;
  folder: string;
  required?: boolean;
  onChange: (v: string) => void;
}

export function ResultLinkField({ id, label, value, folder, required, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadResultFile(file, folder));
      toast({ title: 'File uploaded', description: file.name });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{required && ' *'}</Label>
      {isStoredFile(value) ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate flex-1">{fileLabel(value)}</span>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange('')}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste a link, or upload a file →"
            required={required && !value}
          />
          <Button type="button" variant="outline" disabled={busy} asChild>
            <label className="cursor-pointer shrink-0">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              {!busy && 'Upload'}
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv,.pdf,.doc,.docx" onChange={onFile} disabled={busy} />
            </label>
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Excel, PDF, Word or CSV, up to 20MB — or a Google Drive link.</p>
    </div>
  );
}
