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
  | { kind: 'confirm'; title: string; body?: string; danger?: boolean;
      okLabel?: string; cancelLabel?: string;
      /** Shows a "remember this" checkbox; its value reaches onOk and onCancel. */
      rememberLabel?: string;
      onOk: (remember: boolean) => void; onCancel?: (remember: boolean) => void }
  | null;

export default function Ask({ state, onClose }: { state: AskState; onClose: () => void }) {
  const [val, setVal] = useState('');
  const [remember, setRemember] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();

  useEffect(() => {
    setRemember(false);
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
      state.onOk(remember);
    }
    onClose();
  };

  /** Dismissing is a real answer when the dialog offers to remember it. */
  const dismiss = () => {
    if (state?.kind === 'confirm') state.onCancel?.(remember);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && dismiss()}>
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

        {state.kind === 'confirm' && state.rememberLabel && (
          <label className="mt-1 flex cursor-pointer select-none items-center gap-2.5 text-[12.5px] text-[#8b93a4]">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-[#f0b429]"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            {state.rememberLabel}
          </label>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={dismiss}>
            {(state.kind === 'confirm' && state.cancelLabel) || t('cancel')}
          </Button>
          <Button
            variant={state.kind === 'confirm' && state.danger ? 'destructive' : 'primary'}
            disabled={state.kind === 'prompt' && !val.trim()}
            onClick={submit}
          >
            {state.kind === 'prompt'
              ? (state.okLabel ?? t('create'))
              : (state.okLabel ?? t('confirmBtn'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
