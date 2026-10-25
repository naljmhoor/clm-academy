import { CircleHelp } from 'lucide-react';
import { Popover } from '@/clm/components/ui/Popover';
import { useAcademy } from '../academyStore';
import { articleById } from '../knowledge/articles';

/**
 * Contextual help beside complex CLM controls. It is part of the training layer (indigo),
 * never changes the control it sits next to, and can be switched off from the Academy bar.
 * `topic` is a knowledge-base article id.
 */
export function HelpTip({ topic, label }: { topic: string; label?: string }) {
  const enabled = useAcademy((s) => s.helpHints);
  const openAssistant = useAcademy((s) => s.openAssistant);
  const a = articleById(topic);
  if (!enabled || !a) return null;
  return (
    <Popover
      width={300}
      trigger={({ toggle, ref }) => (
        <button
          ref={ref}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          aria-label={`Help: ${label ?? a.title}`}
          title={label ?? a.title}
          data-training-layer
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-academy/70 hover:text-academy"
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      )}
    >
      {(close) => (
        <div className="p-3 text-sm" data-training-layer>
          <div className="text-2xs font-semibold uppercase tracking-wide text-academy">CLM Academy help</div>
          <div className="mt-1 font-semibold">{label ?? a.title}</div>
          <p className="mt-1 text-ink-soft">{a.summary}</p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-academy hover:underline"
            onClick={() => {
              close();
              openAssistant(a.id);
            }}
          >
            Read more
          </button>
        </div>
      )}
    </Popover>
  );
}
