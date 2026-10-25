import { createHashRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { AppShell } from '@/clm/components/layout/AppShell';
import { CaseQueuePage } from '@/clm/features/case-queue/CaseQueuePage';
import { CaseWorkspacePage } from '@/clm/features/case-workspace/CaseWorkspacePage';
import { EntitiesPage, NotInTrainingPage } from '@/clm/features/entities/EntitiesPage';
import { EntityProfilePage } from '@/clm/features/entities/EntityProfilePage';
import { StatusFlowHost } from '@/clm/features/case-shared/statusFlow';
import { AcademyLayout, RouteTracker } from '@/training/TrainingBar';
import { AcademyHome, KnowledgePage, LearnPage, PracticePage } from '@/training/pages/AcademyPages';
import { TourHost } from '@/training/tours/TourHost';
import { PracticePanel } from '@/training/practice/PracticePanel';
import { AssistantPanel } from '@/training/assistant/AssistantPanel';

/** Global hosts: CLM status dialogs plus the training overlays (tour, practice, assistant). */
function Root() {
  return (
    <>
      <RouteTracker />
      <Outlet />
      <StatusFlowHost />
      <PracticePanel />
      <AssistantPanel />
      <TourHost />
    </>
  );
}

// Hash routing so the app also runs as a single standalone HTML file (file://).
const router = createHashRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Navigate to="/academy" replace /> },
      {
        path: 'academy',
        element: <AcademyLayout />,
        children: [
          { index: true, element: <AcademyHome /> },
          { path: 'learn', element: <LearnPage /> },
          { path: 'practice', element: <PracticePage /> },
          { path: 'kb', element: <KnowledgePage /> },
          { path: 'kb/:articleId', element: <KnowledgePage /> },
        ],
      },
      {
        element: <AppShell />,
        children: [
          { path: 'cases', element: <CaseQueuePage /> },
          { path: 'cases/:caseId', element: <CaseWorkspacePage /> },
          { path: 'entities', element: <EntitiesPage /> },
          { path: 'entities/:entityId', element: <EntityProfilePage /> },
          { path: 'individuals', element: <NotInTrainingPage title="Individuals" /> },
        ],
      },
      { path: '*', element: <Navigate to="/academy" replace /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
