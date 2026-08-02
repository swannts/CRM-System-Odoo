'use client';

import { useRef, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchPublicWaiverThunk,
  signPublicWaiverThunk,
  selectPublicFlow,
} from 'src/store/slices/public-flow-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function WaiverSignView({ id }: Props) {
  const dispatch = useAppDispatch();
  const { waiver: waiverState } = useAppSelector(selectPublicFlow);
  const { data: waiver, loading: isLoading, error } = waiverState;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const [waiverScrolled, setWaiverScrolled] = useState(false);
  const [waiverChecks, setWaiverChecks] = useState<boolean[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);
  const [signerName, setSignerName] = useState('');
  const [signSuccess, setSignSuccess] = useState(false);
  const [signingFor, setSigningFor] = useState<{ type: 'member' | 'guardian'; id: string | null } | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    dispatch(fetchPublicWaiverThunk(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (waiver) {
      setWaiverChecks(new Array(waiver.waiver?.length || 0).fill(false));
      setQuestionAnswers(new Array(waiver.questions?.length || 0).fill(''));
    }
  }, [waiver]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setWaiverScrolled(true);
    }
  };

  const getPos = (e: any) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handleStart = (e: any) => {
    isDrawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleMove = (e: any) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handleEnd = () => {
    isDrawing.current = false;
  };

  const handleClear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    if (!waiverScrolled || !signingFor) return;
    const signature = canvasRef.current?.toDataURL() || '';
    const payload: any = { signerName, signature, waiverChecks, questionAnswers };
    if (signingFor.type === 'guardian') {
      payload.isGuardian = true;
    } else {
      payload.memberId = signingFor.id;
    }

    try {
      setIsSigning(true);
      await dispatch(signPublicWaiverThunk({ id, payload })).unwrap();
      setSignSuccess(true);
      setSigningFor(null);
      setSignerName('');
      dispatch(fetchPublicWaiverThunk(id));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading && !waiver) return <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error || !waiver) return <Alert severity="error">Failed to load waiver or invalid link.</Alert>;

  const members = waiver.members || [];
  const {guardian} = waiver;
  const isCompleted = waiver.status === 'completed';

  return (
    <Stack spacing={3}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
         <Typography variant="h4" sx={{ mb: 1 }}>{waiver.name || 'Legal Agreement'}</Typography>
         <Typography variant="body2" color="text.secondary">Prepared for: {waiver.contactId?.fullName || 'Participant'}</Typography>
         <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 1 }}>
            <Label color={isCompleted ? 'success' : 'warning'} variant="soft">{waiver.status?.replace('_', ' ')}</Label>
         </Stack>
      </Box>

      <Card sx={{ p: 3 }}>
         <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Iconify icon="solar:document-text-bold" sx={{ mr: 1, color: 'primary.main' }} />
            Waiver Content
         </Typography>
         <Box 
            onScroll={handleScroll}
            sx={{ 
               maxHeight: 400, 
               overflowY: 'auto', 
               p: 2, 
               bgcolor: 'background.neutral', 
               borderRadius: 1.5,
               fontSize: '0.875rem',
               lineHeight: 1.8,
               border: (theme) => `1px solid ${theme.palette.divider}`
            }}
            dangerouslySetInnerHTML={{ __html: waiver.content }}
         />
         {!waiverScrolled && !isCompleted && (
            <Alert severity="warning" sx={{ mt: 2 }}>Please scroll to the bottom to accept the terms.</Alert>
         )}
      </Card>

      {(waiverScrolled || isCompleted) && (
         <>
            {waiver.waiver?.length > 0 && (
               <Card sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>Agreements</Typography>
                  <Stack spacing={1}>
                     {waiver.waiver.map((item: any, idx: number) => (
                        <FormControlLabel
                           key={idx}
                           control={
                              <Checkbox 
                                 checked={waiverChecks[idx]} 
                                 disabled={isCompleted}
                                 onChange={() => {
                                    const next = [...waiverChecks];
                                    next[idx] = !next[idx];
                                    setWaiverChecks(next);
                                 }} 
                              />
                           }
                           label={item.waiver || item.label}
                        />
                     ))}
                  </Stack>
               </Card>
            )}

            <Card sx={{ p: 3 }}>
               <Typography variant="subtitle1" sx={{ mb: 2 }}>Signatures Required</Typography>
               <Stack spacing={2}>
                  {members.map((member: any) => (
                     <Box key={member._id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                           <Typography variant="subtitle2">{member.contactId?.fullName || 'Member'}</Typography>
                           <Typography variant="caption" color="text.secondary">{member.contactId?.email}</Typography>
                        </Box>
                        {member.status === 'signed' ? (
                           <Label color="success" variant="soft">Signed</Label>
                        ) : !isCompleted ? (
                           <Button variant="contained" size="small" onClick={() => setSigningFor({ type: 'member', id: member.contactId?._id || member.contactId })}>Sign Now</Button>
                        ) : <Label color="warning" variant="soft">Pending</Label>}
                     </Box>
                  ))}
                  {guardian && (guardian.fullName || guardian.contactId) && (
                     <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'info.lighter', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                           <Typography variant="subtitle2">{guardian.contactId?.fullName || guardian.fullName} (Guardian)</Typography>
                           <Typography variant="caption" color="info.main">{guardian.relation || 'Parent/Guardian'}</Typography>
                        </Box>
                        {guardian.status === 'signed' ? (
                           <Label color="success" variant="soft">Signed</Label>
                        ) : !isCompleted ? (
                           <Button variant="contained" color="info" size="small" onClick={() => setSigningFor({ type: 'guardian', id: null })}>Sign Now</Button>
                        ) : <Label color="warning" variant="soft">Pending</Label>}
                     </Box>
                  )}
               </Stack>
            </Card>

            {signingFor && (
               <Card sx={{ p: 3, border: (theme) => `2px solid ${theme.palette.primary.main}` }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                     Digital Signature: {signingFor.type === 'guardian' ? 'Guardian' : 'Member'}
                  </Typography>
                  <Stack spacing={3}>
                     <TextField 
                        fullWidth 
                        label="Full Legal Name" 
                        placeholder="Type your full name exactly as it appears above" 
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                     />
                     
                     {signerName && (
                        <Box sx={{ py: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                           <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Signature Preview</Typography>
                           <Typography 
                              variant="h3" 
                              sx={{ 
                                 fontFamily: 'var(--font-dancing-script)', 
                                 color: 'primary.main',
                                 userSelect: 'none'
                              }}
                           >
                              {signerName}
                           </Typography>
                        </Box>
                     )}

                     <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>Draw your signature below</Typography>
                        <Box sx={{ bgcolor: 'white', border: (theme) => `2px dashed ${theme.palette.divider}`, borderRadius: 1.5, position: 'relative' }}>
                           <canvas 
                              ref={canvasRef}
                              width={600}
                              height={200}
                              style={{ width: '100%', height: 200, cursor: 'crosshair', touchAction: 'none' }}
                              onMouseDown={handleStart}
                              onMouseMove={handleMove}
                              onMouseUp={handleEnd}
                              onMouseLeave={handleEnd}
                              onTouchStart={handleStart}
                              onTouchMove={handleMove}
                              onTouchEnd={handleEnd}
                           />
                           <Button 
                              size="small" 
                              variant="soft" 
                              color="inherit" 
                              onClick={handleClear}
                              sx={{ position: 'absolute', bottom: 8, right: 8 }}
                           >
                              Clear
                           </Button>
                        </Box>
                     </Box>

                     <Stack direction="row" spacing={2}>
                        <Button fullWidth variant="outlined" color="inherit" onClick={() => setSigningFor(null)}>Cancel</Button>
                        <LoadingButton 
                           fullWidth 
                           variant="contained" 
                           color="primary" 
                           onClick={handleSubmit}
                           loading={isSigning}
                           disabled={!signerName.trim()}
                        >
                           Submit Signature
                        </LoadingButton>
                     </Stack>
                  </Stack>
               </Card>
            )}

            {signSuccess && !signingFor && (
               <Alert severity="success" variant="filled" sx={{ mt: 2 }}>
                  Signature submitted successfully.
               </Alert>
            )}

            {waiver.questions?.length > 0 && !signingFor && (
               <Card sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>Required Questions</Typography>
                  <Stack spacing={3}>
                     {waiver.questions.map((q: any, idx: number) => (
                        <Box key={idx}>
                           <Typography variant="subtitle2" sx={{ mb: 1 }}>{idx + 1}. {q.question}</Typography>
                           {q.answerType === 'text' ? (
                              <TextField 
                                 fullWidth 
                                 placeholder="Your answer..." 
                                 value={questionAnswers[idx]}
                                 disabled={isCompleted}
                                 onChange={(e) => {
                                    const next = [...questionAnswers];
                                    next[idx] = e.target.value;
                                    setQuestionAnswers(next);
                                 }}
                              />
                           ) : (
                              <RadioGroup 
                                 value={questionAnswers[idx]}
                                 onChange={(e) => {
                                    const next = [...questionAnswers];
                                    next[idx] = e.target.value;
                                    setQuestionAnswers(next);
                                 }}
                              >
                                 {q.choices?.map((choice: string) => (
                                    <FormControlLabel key={choice} value={choice} disabled={isCompleted} control={<Radio />} label={choice} />
                                 ))}
                              </RadioGroup>
                           )}
                        </Box>
                     ))}
                  </Stack>
               </Card>
            )}
         </>
      )}
    </Stack>
  );
}
