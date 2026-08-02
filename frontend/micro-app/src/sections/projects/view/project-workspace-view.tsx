'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchProjectTasks, 
  fetchBoardById, 
  fetchProjectColumns, 
  fetchProjectCards,
  selectProjects 
} from 'src/store/slices/project-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { FeatureRouteShell } from 'src/sections/parity/feature-route-shell';

// ----------------------------------------------------------------------

type Props = {
  boardId?: string;
  workspaceId?: string;
  mode?: 'tasks' | 'share-board';
};

export function ProjectWorkspaceView({ boardId, workspaceId, mode = 'tasks' }: Props) {
  const dispatch = useAppDispatch();
  const projectState = useAppSelector(selectProjects);
  
  const { tasks } = projectState.currentProject;
  const { data: board, columns, cards, loading: boardLoading } = projectState.currentProject.currentBoard;

  useEffect(() => {
    if (mode === 'tasks') {
      dispatch(fetchProjectTasks('')); // Empty string or default project ID if available
    }
    if (mode === 'share-board' && boardId) {
      dispatch(fetchBoardById(boardId));
      dispatch(fetchProjectColumns(boardId));
      dispatch(fetchProjectCards(boardId));
    }
  }, [dispatch, mode, boardId]);

  const isLoading = boardLoading; // Simplified loading check

  if (isLoading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <FeatureRouteShell
      title={mode === 'share-board' ? 'Shared Board' : 'Project Tasks'}
      description="Legacy project task and shared board routes mapped into the micro-app with real board/task data."
      links={[
        { href: paths.dashboard.projects, label: 'Projects' },
        { href: paths.dashboard.projectTasks, label: 'Tasks' },
      ]}
    >
      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          {mode === 'share-board' ? (
            <>
              <Typography variant="h6">
                {board?.name || board?.title || `Board ${boardId}`}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Workspace: {workspaceId}
              </Typography>
              {(columns || []).map((column: any) => (
                <Box key={column.id || column._id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                  <Typography variant="subtitle2">{column.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {(cards || []).filter((card: any) => card.columnId === (column.id || column._id)).length} cards
                  </Typography>
                </Box>
              ))}
            </>
          ) : (
            (tasks || []).map((task: any) => (
              <Box key={task.id || task._id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                <Typography variant="subtitle2">{task.title || task.name}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {task.status || 'Open'}
                </Typography>
              </Box>
            ))
          )}
        </Stack>
      </Card>
    </FeatureRouteShell>
  );
}
