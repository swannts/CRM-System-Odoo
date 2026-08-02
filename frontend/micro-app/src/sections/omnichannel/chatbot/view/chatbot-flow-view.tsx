'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchOmniChatbotByIdThunk, 
  updateOmniChatbotThunk, 
  selectOmni 
} from 'src/store/slices/omnichannel-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useParams, useRouter } from 'src/routes/hooks';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function ChatbotFlowView() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentChatbot } = useAppSelector(selectOmni);

  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchOmniChatbotByIdThunk(id));
    }
  }, [dispatch, id]);

  const chatbot = currentChatbot.data;
  const isLoading = currentChatbot.loading;

  useEffect(() => {
    if (chatbot?.flowData) {
      setNodes(chatbot.flowData.nodes || []);
      setEdges(chatbot.flowData.edges || []);
    }
  }, [chatbot]);

  const handleAddNode = (type: string) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      data: { label: `New ${type}`, message: '' },
      position: { x: 0, y: nodes.length * 150 },
    };
    setNodes([...nodes, newNode]);
  };

  const handleUpdateNode = (nodeId: string, data: any) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
  };

  const handleRemoveNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dispatch(updateOmniChatbotThunk({
        id,
        data: { flowData: { nodes, edges } }
      })).unwrap();
      toast.success('Flow saved successfully!');
      dispatch(fetchOmniChatbotByIdThunk(id));
    } catch (error) {
      toast.error(error || 'Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !chatbot) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardContent maxWidth="lg">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Edit Bot Flow: {chatbot?.name}</Typography>
          <Typography variant="body2" color="text.secondary">Configure the conversation steps for your assistant.</Typography>
        </Box>
        <LoadingButton variant="contained" loading={isSaving} onClick={handleSave} startIcon={<Iconify icon="eva:save-fill" />}>
          Save Flow
        </LoadingButton>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 3 }}>
        <Stack spacing={3}>
          {nodes.length === 0 && (
            <Alert severity="info">No steps added yet. Start by adding a "Message" or "Input" step.</Alert>
          )}

          {nodes.map((node, index) => (
            <Card key={node.id} sx={{ p: 3, borderLeft: '4px solid', borderColor: 'primary.main' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ bgcolor: 'primary.lighter', color: 'primary.main', p: 1, borderRadius: 1, display: 'flex' }}>
                    <Iconify icon={node.type === 'message' ? 'solar:chat-round-line-bold' : 'solar:user-speak-bold'} />
                  </Box>
                  <Typography variant="subtitle1">Step {index + 1}: {node.type.toUpperCase()}</Typography>
                </Stack>
                <IconButton color="error" onClick={() => handleRemoveNode(node.id)}>
                   <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Stack>

              <Stack spacing={2}>
                <TextField 
                  label="Display Label" 
                  fullWidth 
                  value={node.data.label} 
                  onChange={(e) => handleUpdateNode(node.id, { label: e.target.value })} 
                />
                <TextField 
                  label="Message Content" 
                  fullWidth 
                  multiline 
                  rows={3} 
                  value={node.data.message} 
                  onChange={(e) => handleUpdateNode(node.id, { message: e.target.value })} 
                />
                
                {index < nodes.length - 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                     <Iconify icon="solar:arrow-down-bold" sx={{ color: 'text.disabled' }} />
                  </Box>
                )}
              </Stack>
            </Card>
          ))}

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ py: 3 }}>
             <Button variant="soft" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => handleAddNode('message')}>
                Add Message
             </Button>
             <Button variant="soft" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => handleAddNode('input')}>
                Add User Input
             </Button>
          </Stack>
        </Stack>

        <Card sx={{ p: 3, height: 'fit-content', position: 'sticky', top: 80 }}>
           <Typography variant="h6" sx={{ mb: 2 }}>Flow Settings</Typography>
           <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                This editor uses a linear flow model. Nodes are processed in order from top to bottom.
              </Typography>
              <Divider />
              <Typography variant="caption" color="text.disabled">
                Bot ID: {id}
              </Typography>
           </Stack>
        </Card>
      </Box>
    </DashboardContent>
  );
}
