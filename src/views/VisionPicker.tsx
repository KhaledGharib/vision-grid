import { useState } from 'react';
import type { BoardElement } from '../types';
import { useImage } from '../hooks/useImage';
import { useT } from '../useT';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Target } from 'lucide-react';

function Thumb({ el, size = 34 }: { el: BoardElement; size?: number }) {
  const url = useImage(el.imageId);
  return url ? (
    <img
      src={url}
      alt=""
      className="shrink-0 rounded-md border border-[#262c38] object-cover"
      style={{ width: size, height: size }}
      draggable={false}
    />
  ) : (
    <div
      className="grid shrink-0 place-items-center rounded-md border border-[#262c38] bg-[#1b2029] text-[#8b93a4]"
      style={{ width: size, height: size }}
    >
      <Target className="h-4 w-4" />
    </div>
  );
}

/**
 * Vision picker showing the actual picture.
 *
 * A native <select> can only render text, so choosing which vision a goal
 * serves meant reading filenames like "Screenshot 2026-05-31" — the whole
 * point of a vision board is that you recognise the image, not the name.
 */
export default function VisionPicker({
  visions,
  value,
  onChange,
}: {
  visions: BoardElement[];
  value: string;
  onChange: (id: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const picked = visions.find((v) => v.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2.5 rounded-[10px] border border-[#262c38] bg-[#0d0f14]',
            'px-3 py-2 text-start text-[13.5px] text-[#e6e9ef] transition-colors',
            'hover:border-[#7a5c14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c14]/50',
          )}
        >
          {picked ? (
            <>
              <Thumb el={picked} />
              <span className="min-w-0 flex-1 truncate">{picked.title}</span>
            </>
          ) : (
            <span className="min-w-0 flex-1 truncate text-[#8b93a4]">{t('pickVision')}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#8b93a4]" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="max-h-[260px] w-[var(--radix-popover-trigger-width)] overflow-y-auto"
      >
        {visions.map((v) => (
          <button
            type="button"
            key={v.id}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-2.5 py-[7px] text-start text-[13.5px]',
              'transition-colors hover:bg-[#1b2029]',
              v.id === value && 'bg-[#f0b429]/10',
            )}
            onClick={() => { onChange(v.id); setOpen(false); }}
          >
            <Thumb el={v} size={42} />
            <span className="min-w-0 flex-1 truncate">{v.title}</span>
            {v.id === value && <Check className="h-4 w-4 shrink-0 text-[#f0b429]" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
