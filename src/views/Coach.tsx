import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

/**
 * Help that stays out of the way.
 *
 * The old version was an inline card, open by default, ~480px tall — it filled
 * the whole screen and pushed the user's actual goals below the fold. You had
 * to scroll past a lecture to see your own work. Now it's a small "?" next to
 * the heading that opens a dialog on demand.
 */
export function Coach({
  title,
  children,
}: {
  /** kept for call-site clarity; no longer used for persistence */
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="ms-2 inline-grid h-5 w-5 place-items-center rounded-full border border-[#262c38] bg-[#1b2029] align-middle text-[#8b93a4] transition-colors hover:border-[#7a5c14] hover:text-[#f0b429] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c14]"
        onClick={() => setOpen(true)}
        title={title}
        aria-label={title}
      >
        <HelpCircle className="h-3 w-3" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[520px] max-h-[78vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>💡 {title}</DialogTitle>
          </DialogHeader>
          <div className="coach-body">{children}</div>
          <DialogFooter>
            <Button variant="primary" onClick={() => setOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** A good/bad example pair. */
export function Example({ bad, good, why }: { bad: string; good: string; why: string }) {
  return (
    <div className="mb-3 rounded-[10px] border border-[#262c38] bg-[#0d0f14] p-3">
      <div className="mb-1.5 flex items-start gap-2 text-[13px] text-[#8b93a4]">
        <span className="mt-px shrink-0 font-bold text-[#f87171]">✗</span>
        <span className="line-through">{bad}</span>
      </div>
      <div className="flex items-start gap-2 text-[13.5px] text-[#e6e9ef]">
        <span className="mt-px shrink-0 font-bold text-[#34d399]">✓</span>
        <span>{good}</span>
      </div>
      <div className="mt-2 text-[12px] italic text-[#8b93a4]">{why}</div>
    </div>
  );
}
