import { cloudEnabled, type SyncStatus } from '../cloud';
import { useT } from '../useT';
import { SyncDone, SyncError, SyncUp } from '../icons';
import { cn } from '@/lib/utils';

/**
 * Is my work saved? — in the toolbar, and only once there's an account.
 *
 * This lived inside the settings menu, which is the wrong place for a status:
 * you had to go looking to find out whether a push had landed. Signing in is
 * an action and stays in the menu; this is the readout.
 *
 * Nothing renders when signed out — an idle cloud on a toolbar just raises a
 * question the user can't answer from here.
 */
export default function SyncChip({
  status,
  onOpen,
}: {
  status: SyncStatus;
  onOpen: () => void;
}) {
  const t = useT();
  const signedIn = status === 'synced' || status === 'syncing' || status === 'error';
  if (!cloudEnabled || !signedIn) return null;

  // Short enough to sit in a chip; the full explanation is the tooltip, since
  // "your work is still saved on this device" is the reassuring part and does
  // not need to be shouted in the toolbar.
  const label =
    status === 'syncing' ? t('syncingMsg')
    : status === 'error' ? t('syncFailedShort')
    : t('syncedShort');
  const tip = status === 'error' ? t('syncErrorMsg') : label;

  return (
    <button
      className={cn(
        'btn-reset flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px]',
        'transition-colors',
        status === 'error'
          ? 'border-[#f87171]/40 bg-[#f87171]/[.08] text-[#f87171] hover:bg-[#f87171]/[.14]'
          : status === 'syncing'
            ? 'border-[#7a5c14] bg-[#f0b429]/[.08] text-[#f0b429]'
            : 'border-[#34d399]/35 bg-[#34d399]/[.08] text-[#34d399] hover:bg-[#34d399]/[.14]',
      )}
      onClick={onOpen}
      title={tip}
      role="status"
      aria-live="polite"
      aria-label={tip}
    >
      {status === 'error' ? <SyncError className="icon" />
        : status === 'syncing' ? <SyncUp className="icon spin" />
        : <SyncDone className="icon" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
