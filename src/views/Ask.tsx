import { useEffect, useRef, useState } from 'react';
import { useT } from '../useT';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * In-app replacement for window.prompt / window.confirm.
 *
 * Native dialogs are unreliable: browsers suppress repeat dialogs, some
 * embedded/automated contexts never show them at all, and while one is open
 * the whole page is frozen. That made buttons look broken.
 *
 * Now built on Radix Dialog, which brings focus trapping, restore-focus on
 * close, aria wiring and scroll locking — all things the hand-rolled overlay
 * silently lacked.
 */
export type AskState =
  | { kind: 'prompt'; title: string; body?: string; placeholder?: string; initial?: string;
      value?: string; okLabel?: string; onOk: (v: string) => void }
  | { kind: 'confirm'; title: string; body?: string; danger?: boolean; onOk: () => void }
  | null;

export default function Ask({ state, onClose }: { state: AskState; onClose: () => void }) {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  useEffect(() => {
    if (state?.kind === 'prompt') {
      setVal(state.value ?? '');
      // select after paint so the caret actually lands in the field
      setTimeout(() => inputRef.current?.select(), 40);
    }
  }, [state]);

  if (!state) return null;

  const submit = () => {
    if (state.kind === 'prompt') {
      const v = val.trim();
      if (!v) return;
      state.onOk(v);
    } else {
      state.onOk();
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent onOpenAutoFocus={(e) => {
        // let the input keep focus rather than the close button
        if (state.kind === 'prompt') e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle>{state.title}</DialogTitle>
          {state.body && <DialogDescription>{state.body}</DialogDescription>}
        </DialogHeader>

        {state.kind === 'prompt' && (
          <Input
            ref={inputRef}
            value={val}
            placeholder={state.placeholder}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); submit(); }
            }}
          />
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button
            variant={state.kind === 'confirm' && state.danger ? 'destructive' : 'primary'}
            disabled={state.kind === 'prompt' && !val.trim()}
            onClick={submit}
          >
            {state.kind === 'prompt' ? (state.okLabel ?? t('create')) : t('confirmBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
