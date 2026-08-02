'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchProjectById, 
  fetchProjectBoards, 
  fetchBoardColumns, 
  fetchBoardCards,
  createColumnThunk,
  updateColumnThunk,
  deleteColumnThunk,
  reorderColumnsThunk,
  createCardThunk,
  updateCardThunk,
  deleteCardThunk,
  selectProjects 
} from 'src/store/slices/project-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { Tab, Tabs } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import { useBoolean } from 'src/hooks/use-boolean';
import { DashboardContent } from 'src/layouts/dashboard';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { toast } from 'src/components/snackbar';

import { ProjectDashboardView } from './project-dashboard-view';
import { TaskDetailDrawer } from '../components/task-detail-drawer';

// ----------------------------------------------------------------------

interface Props {
  id: string;
}

export function ProjectDetailsView({ id }: Props) {
  const dispatch = useAppDispatch();
  const { currentProject } = useAppSelector(selectProjects);
  
  const columnDialog = useBoolean();
  const taskDrawer = useBoolean();
  const confirmDeleteColumn = useBoolean();
  const confirmDeleteCard = useBoolean();
  
  const [columnName, setColumnName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('0');
  
  const [activeColumnId, setActiveColumnId] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuType, setMenuType] = useState<'column' | 'card'>('column');
  const [menuData, setMenuData] = useState<any>(null);

  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [dragOverColumnOrderId, setDragOverColumnOrderId] = useState<string | null>(null);
  const [quickAddTaskColumnId, setQuickAddTaskColumnId] = useState<string | null>(null);
  const [quickAddTaskTitle, setQuickAddTaskTitle] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [currentTab, setCurrentTab] = useState('board');
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [isMutationPending, setIsMutationPending] = useState(false);

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchProjectBoards(id));
    }
  }, [dispatch, id]);

  const activeBoard = currentProject.boards?.[0];

  useEffect(() => {
    if (activeBoard?.id) {
      dispatch(fetchBoardColumns(activeBoard.id));
      dispatch(fetchBoardCards(activeBoard.id));
    }
  }, [dispatch, activeBoard?.id]);

  const project = currentProject.data;
  const columns = currentProject.columns || [];
  const cards = currentProject.cards || [];

  const handleAddColumn = async () => {
    if (columnName.trim() && activeBoard?.id) {
      try {
        setIsMutationPending(true);
        if (selectedColumn) {
          await dispatch(updateColumnThunk({ id: selectedColumn.id, data: { name: columnName } })).unwrap();
        } else {
          await dispatch(createColumnThunk({ boardId: activeBoard.id, data: { name: columnName } })).unwrap();
        }
        dispatch(fetchBoardColumns(activeBoard.id));
        columnDialog.onFalse();
        setColumnName('');
        setSelectedColumn(null);
      } catch (err) {
        toast.error(err || 'Failed to save column');
      } finally {
        setIsMutationPending(false);
      }
    }
  };

  const handleQuickAddTask = async (columnId: string) => {
    if (quickAddTaskTitle.trim() && activeBoard?.id) {
      try {
        setIsMutationPending(true);
        await dispatch(createCardThunk({ boardId: activeBoard.id, data: { columnId, title: quickAddTaskTitle } })).unwrap();
        dispatch(fetchBoardCards(activeBoard.id));
        setQuickAddTaskTitle('');
        setQuickAddTaskColumnId(null);
      } catch (err) {
        toast.error(err || 'Failed to add task');
      } finally {
        setIsMutationPending(false);
      }
    }
  };

  const handleRenameColumn = async (columnId: string) => {
    if (editingColumnName.trim() && activeBoard?.id) {
      try {
        setIsMutationPending(true);
        await dispatch(updateColumnThunk({ id: columnId, data: { name: editingColumnName } })).unwrap();
        dispatch(fetchBoardColumns(activeBoard.id));
        setEditingColumnId(null);
      } catch (err) {
        toast.error(err || 'Failed to rename column');
      } finally {
        setIsMutationPending(false);
      }
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, type: 'column' | 'card', data: any) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuType(type);
    setMenuData(data);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleEditColumn = () => {
    setSelectedColumn(menuData);
    setColumnName(menuData.name || menuData.title);
    columnDialog.onTrue();
    handleCloseMenu();
  };

  const handleDeleteColumn = async () => {
    if (menuData?.id && activeBoard?.id) {
      try {
        setIsMutationPending(true);
        await dispatch(deleteColumnThunk(menuData.id)).unwrap();
        dispatch(fetchBoardColumns(activeBoard.id));
        dispatch(fetchBoardCards(activeBoard.id));
        confirmDeleteColumn.onFalse();
      } catch (err) {
        toast.error(err || 'Failed to delete column');
      } finally {
        setIsMutationPending(false);
      }
    }
  };

  const handleEditCard = (card: any) => {
    setSelectedCard(card);
    setTaskTitle(card.title || card.name);
    setTaskDescription(card.description || '');
    setTaskPriority(card.priority || '0');
    setActiveColumnId(card.columnId);
    taskDrawer.onTrue();
  };

  const handleDeleteCard = async () => {
    if (menuData?.id && activeBoard?.id) {
      try {
        setIsMutationPending(true);
        await dispatch(deleteCardThunk(menuData.id)).unwrap();
        dispatch(fetchBoardCards(activeBoard.id));
        confirmDeleteCard.onFalse();
      } catch (err) {
        toast.error(err || 'Failed to delete task');
      } finally {
        setIsMutationPending(false);
      }
    }
  };

  const handleMoveCard = async (cardId: string, newColumnId: string) => {
    if (!activeBoard?.id) return;
    const card = cards.find((c: any) => String(c.id) === String(cardId));
    if (card && String(card.columnId) !== String(newColumnId)) {
      try {
        await dispatch(updateCardThunk({ 
          id: String(cardId),
          data: { ...card, columnId: String(newColumnId) } 
        })).unwrap();
        dispatch(fetchBoardCards(activeBoard.id));
      } catch (err) {
        toast.error(err || 'Failed to move task');
      }
    }
  };

  const onCardDragStart = (e: React.DragEvent, cardId: string) => {
    e.stopPropagation();
    setDraggingCardId(String(cardId));
    e.dataTransfer.setData('application/x-dnd-type', 'card');
    e.dataTransfer.setData('application/x-card-id', String(cardId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onCardDragEnd = () => {
    setDraggingCardId(null);
    setDragOverColumnId(null);
  };

  const onColumnHandleDragStart = (e: React.DragEvent, columnId: string) => {
    e.stopPropagation();
    setDraggingColumnId(String(columnId));
    e.dataTransfer.setData('application/x-dnd-type', 'column');
    e.dataTransfer.setData('application/x-column-id', String(columnId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onColumnDragEnd = () => {
    setDraggingColumnId(null);
    setDragOverColumnOrderId(null);
  };

  const onColumnDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggingColumnId) {
      setDragOverColumnOrderId(String(columnId));
    } else if (draggingCardId) {
      setDragOverColumnId(String(columnId));
    }
  };

  const onColumnDragLeave = () => {
    if (draggingCardId) setDragOverColumnId(null);
    if (!draggingColumnId) {
      setDragOverColumnOrderId(null);
    }
  };

  const onDropOnColumn = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!activeBoard?.id) return;

    if (draggingColumnId) {
      const ids = columns.map((col: any) => String(col.id));
      const sourceIndex = ids.findIndex((id: string) => id === draggingColumnId);
      const targetIndex = ids.findIndex((id: string) => id === String(targetColumnId));
      if (sourceIndex >= 0 && targetIndex >= 0 && sourceIndex !== targetIndex) {
        const reordered = [...ids];
        const [moved] = reordered.splice(sourceIndex, 1);
        reordered.splice(targetIndex, 0, moved);
        try {
          await dispatch(reorderColumnsThunk({ boardId: activeBoard.id, orderedIds: reordered })).unwrap();
          dispatch(fetchBoardColumns(activeBoard.id));
        } catch (err) {
          setReorderError('Failed to reorder columns.');
        }
      }
      setDraggingColumnId(null);
      setDragOverColumnOrderId(null);
      return;
    }

    if (draggingCardId) {
      await handleMoveCard(draggingCardId, targetColumnId);
      setDraggingCardId(null);
      setDragOverColumnId(null);
    }
  };

  if (currentProject.loading && !project) {
    return <ProjectSkeleton />;
  }

  return (
    <DashboardContent maxWidth={false}>
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>{project?.name || project?.title || 'Project Details'}</Typography>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:clipboard-list-bold" sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle2">{columns.length} Columns</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="solar:checklist-minimalistic-bold" sx={{ color: 'success.main' }} />
              <Typography variant="subtitle2">{cards.length} Tasks</Typography>
            </Stack>
          </Stack>
        </Box>
        
        <Stack direction="row" spacing={1}>
           {currentTab === 'board' && (
             <Button 
               variant="contained" 
               startIcon={<Iconify icon="mingcute:add-line" />}
               onClick={columnDialog.onTrue}
               disabled={isMutationPending}
             >
                New Column
             </Button>
           )}
        </Stack>
      </Box>

      <Tabs
        value={currentTab}
        onChange={handleChangeTab}
        sx={{
          mb: 3,
          '& .MuiTab-root': { typography: 'subtitle2', textTransform: 'none' }
        }}
      >
        <Tab 
          value="board" 
          label="Board" 
          icon={<Iconify icon="solar:bill-list-bold" width={20} />} 
          iconPosition="start" 
        />
        <Tab 
          value="dashboard" 
          label="Dashboard" 
          icon={<Iconify icon="solar:chart-square-bold" width={20} />} 
          iconPosition="start" 
        />
      </Tabs>

      {currentTab === 'dashboard' ? (
        <ProjectDashboardView id={id} />
      ) : (
        <Scrollbar sx={{ pb: 3 }}>
        <Stack direction="row" spacing={3} sx={{ minHeight: '70vh', alignItems: 'flex-start' }}>
          {columns.map((column: any) => (
            <Box 
              key={column.id} 
              sx={{ 
                width: 320, 
                flexShrink: 0,
                borderRadius: 2,
                transition: (theme) => theme.transitions.create(['background-color', 'transform', 'box-shadow']),
                ...(dragOverColumnId === String(column.id) && {
                  bgcolor: 'action.hover',
                }),
                ...(dragOverColumnOrderId === String(column.id) && {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.customShadows.z8,
                }),
              }}
              onDragOver={(e) => onColumnDragOver(e, String(column.id))}
              onDragLeave={onColumnDragLeave}
              onDrop={(e) => onDropOnColumn(e, String(column.id))}
            >
              <Stack
                direction="row"
                alignItems="center"
                sx={{ mb: 2, p: 1.5, borderRadius: 1.5, bgcolor: 'background.neutral' }}
              >
                {editingColumnId === column.id ? (
                  <TextField
                    autoFocus
                    size="small"
                    value={editingColumnName}
                    onChange={(e) => setEditingColumnName(e.target.value)}
                    onBlur={() => handleRenameColumn(column.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameColumn(column.id);
                      if (e.key === 'Escape') setEditingColumnId(null);
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                ) : (
                  <Typography 
                    variant="subtitle1" 
                    onClick={() => {
                      setEditingColumnId(column.id);
                      setEditingColumnName(column.name || column.title);
                    }}
                    sx={{ flexGrow: 1, fontWeight: 'bold', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                  >
                    {column.name || column.title}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'action.selected', mr: 1 }}>
                  {cards.filter((c: any) => String(c.columnId) === String(column.id)).length}
                </Typography>
                <IconButton
                  size="small"
                  draggable={!isMutationPending}
                  onDragStart={(e) => onColumnHandleDragStart(e, column.id)}
                  onDragEnd={onColumnDragEnd}
                  sx={{ cursor: 'grab' }}
                  title="Drag to reorder column"
                >
                  <Iconify icon="solar:hamburger-menu-bold" />
                </IconButton>
                <IconButton size="small" onClick={(e) => handleOpenMenu(e, 'column', column)}>
                   <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              </Stack>

              <Stack spacing={2}>
                {cards
                  .filter((c: any) => String(c.columnId) === String(column.id))
                  .map((card: any) => (
                    <Card 
                      key={card.id} 
                      draggable
                      onDragStart={(e) => onCardDragStart(e, card.id)}
                      onDragEnd={onCardDragEnd}
                      onClick={() => handleEditCard(card)}
                      sx={{ 
                        p: 2, 
                        cursor: 'grab', 
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        boxShadow: (theme) => theme.customShadows.z1,
                        transition: (theme) => theme.transitions.create(['box-shadow', 'transform', 'border-color']),
                        '&:active': { cursor: 'grabbing', transform: 'rotate(2deg) scale(1.02)' },
                        '&:hover': { 
                          boxShadow: (theme) => theme.customShadows.z16,
                          borderColor: 'primary.main'
                        } 
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Label
                          variant="soft"
                          color={
                            (card.priority === '1' && 'error') ||
                            (card.kanban_state === 'done' && 'success') ||
                            (card.kanban_state === 'blocked' && 'warning') ||
                            'default'
                          }
                        >
                          {card.priority === '1' ? 'High' : 'Normal'}
                        </Label>
                        {card.kanban_state === 'blocked' && (
                          <Label variant="filled" color="error">Blocked</Label>
                        )}
                      </Stack>

                      <Typography variant="subtitle2" sx={{ mb: 1 }}>{card.name || card.title}</Typography>

                      {card.description && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary', 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 2 
                          }}
                        >
                          {card.description}
                        </Typography>
                      )}

                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                         <Stack direction="row" spacing={-0.75}>
                            <Avatar 
                              src="/assets/images/avatar/avatar_1.jpg" 
                              sx={{ width: 24, height: 24, border: (theme) => `solid 2px ${theme.palette.background.paper}` }} 
                            />
                         </Stack>

                         <Stack direction="row" alignItems="center" spacing={1.5} sx={{ color: 'text.disabled' }}>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                               <Iconify icon="solar:calendar-date-bold" width={16} />
                               <Typography variant="caption">
                                 {card.createdAt ? new Date(card.createdAt).toLocaleDateString() : 'N/A'}
                               </Typography>
                            </Stack>
                         </Stack>
                      </Stack>
                    </Card>
                  ))}
                
                {dragOverColumnId === String(column.id) && (
                  <Box 
                    sx={{ 
                      height: 80, 
                      borderRadius: 2, 
                      border: '2px dashed', 
                      borderColor: 'primary.main',
                      bgcolor: (theme) => theme.palette.primary.lighter,
                      opacity: 0.5,
                      mb: 2 
                    }} 
                  />
                )}

                {quickAddTaskColumnId === column.id ? (
                  <Card sx={{ p: 1.5, mb: 2 }}>
                    <TextField
                      autoFocus
                      fullWidth
                      multiline
                      placeholder="Enter task title..."
                      value={quickAddTaskTitle}
                      onChange={(e) => setQuickAddTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleQuickAddTask(column.id);
                        }
                        if (e.key === 'Escape') setQuickAddTaskColumnId(null);
                      }}
                      sx={{ 
                        mb: 1.5,
                        '& .MuiInputBase-root': {
                          p: 0,
                          typography: 'subtitle2'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    />
                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                      <Button size="small" color="inherit" onClick={() => setQuickAddTaskColumnId(null)}>Cancel</Button>
                      <Button size="small" variant="contained" onClick={() => handleQuickAddTask(column.id)} disabled={isMutationPending}>Add</Button>
                    </Stack>
                  </Card>
                ) : (
                  <Button 
                    fullWidth 
                    variant="soft" 
                    color="inherit" 
                    startIcon={<Iconify icon="mingcute:add-line" />}
                    onClick={() => setQuickAddTaskColumnId(column.id)}
                    disabled={isMutationPending}
                  >
                    Add Task
                  </Button>
                )}
              </Stack>
            </Box>
          ))}

          {columns.length === 0 && !currentProject.loading && (
            <Box sx={{ textAlign: 'center', py: 10, width: '100%', bgcolor: 'background.neutral', borderRadius: 2 }}>
               <Typography variant="h6" color="text.secondary">No columns yet. Start by adding one!</Typography>
            </Box>
          )}
        </Stack>
      </Scrollbar>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={menuType === 'column' ? handleEditColumn : () => handleEditCard(menuData)}>
          <Iconify icon="solar:pen-bold" sx={{ mr: 1 }} />
          Edit {menuType === 'column' ? 'Column' : 'Task'}
        </MenuItem>

        {menuType === 'card' && (
          <MenuItem disabled>
            <Iconify icon="solar:reorder-bold" sx={{ mr: 1 }} />
            Move to...
          </MenuItem>
        )}
        {menuType === 'card' && columns.map((col: any) => (
          <MenuItem 
            key={col.id} 
            onClick={() => {
              handleMoveCard(menuData.id, col.id);
              handleCloseMenu();
            }}
            selected={menuData?.columnId === col.id}
            sx={{ pl: 4, typography: 'caption' }}
          >
            {col.name || col.title}
          </MenuItem>
        ))}

        <MenuItem onClick={menuType === 'column' ? () => confirmDeleteColumn.onTrue() : () => confirmDeleteCard.onTrue()} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
          Delete {menuType === 'column' ? 'Column' : 'Task'}
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={confirmDeleteColumn.value}
        onClose={confirmDeleteColumn.onFalse}
        title="Delete Column"
        content="Are you sure you want to delete this column and all its tasks? This action cannot be undone."
        action={
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteColumn}
            disabled={isMutationPending}
          >
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmDeleteCard.value}
        onClose={confirmDeleteCard.onFalse}
        title="Delete Task"
        content="Are you sure you want to delete this task?"
        action={
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteCard}
            disabled={isMutationPending}
          >
            Delete
          </Button>
        }
      />

      <Dialog open={columnDialog.value} onClose={columnDialog.onFalse} fullWidth maxWidth="xs">
        <DialogTitle>{selectedColumn ? 'Edit Column' : 'New Column'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Column Name"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="inherit" onClick={columnDialog.onFalse}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddColumn} 
            disabled={!columnName.trim() || isMutationPending}
          >
             {isMutationPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <TaskDetailDrawer
        open={taskDrawer.value}
        onClose={taskDrawer.onFalse}
        task={selectedCard}
        columns={columns}
        onUpdate={async (data) => {
          if (!selectedCard?.id || !activeBoard?.id) return;
          try {
            await dispatch(updateCardThunk({ id: selectedCard.id, data })).unwrap();
            dispatch(fetchBoardCards(activeBoard.id));
          } catch (err) {
            toast.error(err || 'Failed to update task');
          }
        }}
        onDelete={() => {
          setMenuData(selectedCard);
          confirmDeleteCard.onTrue();
          taskDrawer.onFalse();
        }}
      />

      <Snackbar
        open={Boolean(reorderError)}
        autoHideDuration={3000}
        onClose={() => setReorderError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setReorderError(null)}>
          {reorderError}
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}

function ProjectSkeleton() {
  return (
    <DashboardContent maxWidth={false}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box><Skeleton variant="text" width={300} height={40} /><Skeleton variant="text" width={200} /></Box>
        <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
      </Stack>
      <Skeleton variant="rectangular" height={48} sx={{ mb: 3 }} />
      <Stack direction="row" spacing={3} sx={{ minHeight: '70vh' }}>
        {[...Array(4)].map((_, i) => (
          <Box key={i} sx={{ width: 320, flexShrink: 0 }}>
            <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1.5, mb: 2 }} />
            <Stack spacing={2}>
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </DashboardContent>
  );
}
