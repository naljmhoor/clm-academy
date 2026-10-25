import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { BookOpen, CircleHelp, GraduationCap, MessageCircleQuestion, RotateCcw } from 'lucide-react';
import { useClm } from '@/store/caseStore';
import { useQueueUi } from '@/store/queueUiStore';
import { toast } from '@/store/toastStore';
import { Dialog } from '@/clm/components/ui/Dialog';
import { Button } from '@/clm/components/ui/Button';
import { Toaster } from '@/clm/components/ui/misc';
import { useAcademy } from './academyStore';

/**
 * Training layer chrome. Deliberately styled apart from the CLM UI (indigo strip)
 * so trainees can tell what is CLM and what is CLM Academy.
 */
export function TrainingBar() {
  const [confirm, setConfirm] = useState(false);
  const reset = useClm((s) => s.resetAll);
  const navigate = useNavigate();
  const loc = useLocation();
  const { activeTour, activePractice, helpHints, setHelpHints, assistantOpen, openAssistant, closeAssistant, exitTour, exitPractice } = useAcademy();

  const mode = activeTour || loc.pathname.startsWith('/academy/learn') ? 'guided' : activePractice || loc.pathname.startsWith('/academy/practice') ? 'practice' : loc.pathname.startsWith('/academy') ? 'home' : 'explore';
  const modes = [
    { id: 'guided', label: 'Guided learning', to: '/academy/learn' },
    { id: 'explore', label: 'Explore CLM', to: '/cases' },
    { id: 'practice', label: 'Practice', to: '/academy/practice' },
  ];

  return (
    <div className="flex h-9 shrink-0 items-center gap-3 bg-academy px-3 text-xs text-white" data-training-layer>
      <Link to="/academy" className="flex items-center gap-1.5 rounded px-1.5 py-1 font-semibold hover:bg-white/15">
        <GraduationCap className="h-4 w-4" />
        CLM Academy
      </Link>
      <nav className="flex rounded-md bg-white/10 p-0.5" aria-label="Academy mode">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-current={mode === m.id ? 'page' : undefined}
            onClick={() => {
              if (m.id === 'explore') {
                exitTour();
                exitPractice();
              }
              navigate(m.to);
            }}
            className={clsx('rounded px-2.5 py-0.5 font-medium', mode === m.id ? 'bg-white text-academy' : 'text-white/85 hover:text-white')}
          >
            {m.label}
          </button>
        ))}
      </nav>
      <span className="hidden truncate text-white/70 xl:inline">Simulated environment · fictional data · no Manafa systems are called</span>
      <span className="flex-1" />
      <Link to="/academy/kb" className="flex items-center gap-1 rounded px-2 py-1 font-medium hover:bg-white/15">
        <BookOpen className="h-3.5 w-3.5" />
        Knowledge Base
      </Link>
      <button type="button" onClick={() => setHelpHints(!helpHints)} aria-pressed={helpHints} title="Show or hide the ? help icons beside CLM controls" className={clsx('flex items-center gap-1 rounded px-2 py-1 font-medium hover:bg-white/15', !helpHints && 'text-white/60')}>
        <CircleHelp className="h-3.5 w-3.5" />
        Help hints {helpHints ? 'on' : 'off'}
      </button>
      <button type="button" onClick={() => (assistantOpen ? closeAssistant() : openAssistant())} aria-pressed={assistantOpen} className={clsx('flex items-center gap-1 rounded px-2 py-1 font-medium', assistantOpen ? 'bg-white text-academy' : 'hover:bg-white/15')}>
        <MessageCircleQuestion className="h-3.5 w-3.5" />
        Ask CLM
      </button>
      <button type="button" onClick={() => setConfirm(true)} className="flex items-center gap-1 rounded px-2 py-1 font-medium hover:bg-white/15">
        <RotateCcw className="h-3.5 w-3.5" />
        Reset data
      </button>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset training data?"
        description="All cases return to their starting state. Your comments, status changes and edits in this browser are discarded. Learning progress is kept."
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                reset();
                exitTour();
                exitPractice();
                useQueueUi.setState({ search: '', filters: {}, page: 1 });
                setConfirm(false);
                navigate('/cases');
                toast('Training data reset.');
              }}
            >
              Reset
            </Button>
          </>
        }
      />
    </div>
  );
}

/** Keeps the Academy store informed of the current route (used by Ask CLM context). */
export function RouteTracker() {
  const loc = useLocation();
  const setLocation = useAcademy((s) => s.setLocation);
  useEffect(() => setLocation(loc.pathname, loc.search), [loc.pathname, loc.search, setLocation]);
  return null;
}

export function AcademyLayout() {
  const assistantOpen = useAcademy((s) => s.assistantOpen);
  return (
    <div className="flex h-full flex-col">
      <TrainingBar />
      <main className={clsx('min-h-0 flex-1 overflow-y-auto bg-white', assistantOpen && 'pr-[420px]')}>
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
