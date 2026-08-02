'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchCommerceProducts, selectCommerce } from 'src/store/slices/commerce-slice';
import { 
  fetchPosOrderThunk, 
  fetchDeliveryStatusThunk, 
  selectPublicFlow 
} from 'src/store/slices/public-flow-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  mode: string;
  shopId?: string;
  productId?: string;
  orderId?: string;
  workspaceId?: string;
  boardId?: string;
  cartId?: string;
};

export function PublicCommerceView({ mode, shopId, productId, orderId, workspaceId, boardId, cartId }: Props) {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector(selectCommerce);
  const { posOrder } = useAppSelector(selectPublicFlow);

  useEffect(() => {
    if (mode === 'online-shop' && shopId) {
      dispatch(fetchCommerceProducts({ orgId: shopId }));
    }
    if ((mode === 'order-pay' || mode === 'delivery-status' || mode === 'shop-receipt') && orderId) {
      dispatch(fetchPosOrderThunk(orderId));
      if (mode === 'delivery-status') {
        dispatch(fetchDeliveryStatusThunk(orderId));
      }
    }
  }, [dispatch, mode, shopId, orderId]);

  const isLoading = products.loading || posOrder.loading;

  if (isLoading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={10}>
          {/* Online Shop Flow */}
          {mode === 'online-shop' && (
            <Stack spacing={4}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h3">Organizational Storefront</Typography>
                  <Button variant="soft" startIcon={<Iconify icon="solar:cart-bold" />}>Cart (0)</Button>
               </Box>
               
               <Grid container spacing={3}>
                  {products.items.map((product) => (
                    <Grid item xs={12} sm={6} md={3} key={product.id}>
                       <Card sx={{ p: 0, overflow: 'hidden' }}>
                          <Box sx={{ height: 160, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             {product.image ? (
                               <Box component="img" src={product.image} sx={{ height: 1, width: 1, objectFit: 'cover' }} />
                             ) : (
                               <Iconify icon="solar:box-bold" width={48} color="text.disabled" />
                             )}
                          </Box>
                          <Box sx={{ p: 2 }}>
                             <Typography variant="subtitle2" noWrap>{product.name}</Typography>
                             <Typography variant="h6" color="primary" sx={{ mt: 0.5 }}>${product.price}</Typography>
                             <Button fullWidth variant="contained" sx={{ mt: 2 }} size="small">Add to Cart</Button>
                          </Box>
                       </Card>
                    </Grid>
                  ))}
                  {products.items.length === 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'background.neutral', borderRadius: 2 }}>
                        <Iconify icon="solar:box-minimalistic-bold-duotone" width={64} sx={{ mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" color="text.secondary">No products found in this shop.</Typography>
                      </Box>
                    </Grid>
                  )}
               </Grid>
            </Stack>
          )}

          {/* Table-side Ordering Flow */}
          {(mode === 'table-ordering' || mode === 'pos-main') && (
            <Stack spacing={4} sx={{ textAlign: 'center' }}>
               <Iconify icon="solar:tuning-square-2-bold-duotone" width={80} color="primary.main" sx={{ mx: 'auto' }} />
               <Typography variant="h3">POS Orchestration</Typography>
               <Typography variant="body1" color="text.secondary">
                  Scanning Table {boardId || 'N/A'} in Room {workspaceId || 'N/A'}...
               </Typography>
               <Box sx={{ p: 4, bgcolor: 'background.neutral', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Join Existing Order?</Typography>
                  <Button variant="contained" fullWidth size="large">Sync with Table</Button>
               </Box>
            </Stack>
          )}

          {/* Delivery Status Flow */}
          {(mode === 'delivery-status' || mode === 'order-pay' || mode === 'shop-receipt') && (
            <Stack spacing={4} sx={{ textAlign: 'center' }}>
               <Typography variant="h4">Order Tactical Monitor</Typography>
               <Card sx={{ p: 4, textAlign: 'left' }}>
                  <Typography variant="h6" gutterBottom>Order #{posOrder.data?.ticketNo || orderId}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Status: <Box component="span" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{posOrder.data?.status || 'Processing'}</Box>
                  </Typography>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Stack spacing={3}>
                     {[
                       { step: 'Order Placed', time: '10:00 AM', completed: true },
                       { step: 'Preparing', time: '10:05 AM', completed: posOrder.data?.status === 'ready' || posOrder.data?.status === 'completed' },
                       { step: 'Out for Delivery', time: 'Pending', completed: posOrder.data?.status === 'completed' },
                     ].map((step, i) => (
                        <Stack key={i} direction="row" spacing={2} alignItems="center">
                           <Box sx={{ 
                              width: 24, height: 24, borderRadius: '50%', 
                              bgcolor: step.completed ? 'success.main' : 'background.neutral',
                              border: (theme) => `2px solid ${theme.palette.divider}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                           }}>
                              {step.completed && <Iconify icon="solar:check-circle-bold" width={16} color="common.white" />}
                           </Box>
                           <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle2" sx={{ opacity: step.completed ? 1 : 0.4 }}>{step.step}</Typography>
                              <Typography variant="caption" color="text.secondary">{step.time}</Typography>
                           </Box>
                        </Stack>
                     ))}
                  </Stack>
               </Card>
               <Button variant="soft" fullWidth size="large">Contact Support</Button>
            </Stack>
          )}

          {/* Board Share Flow */}
          {mode === 'board-share' && (
            <Card sx={{ p: 5, textAlign: 'center' }}>
               <Iconify icon="solar:users-group-rounded-bold-duotone" width={80} color="primary.main" sx={{ mb: 2 }} />
               <Typography variant="h4">Shared Project Board</Typography>
               <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  You have been granted tactical access to view and collaborate on the <strong>Organizational Roadmap</strong> board.
               </Typography>
               <Button variant="contained" size="large">Accept Invitation & View Board</Button>
            </Card>
          )}

          {/* POS/Display Modes Placeholder */}
          {['kds-display', 'cfd-display', 'kiosk-mode'].includes(mode) && (
            <Box sx={{ 
               height: '70vh', 
               bgcolor: 'common.black', 
               color: 'common.white', 
               borderRadius: 2, 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center',
               flexDirection: 'column',
               p: 4,
               textAlign: 'center'
            }}>
               <Iconify icon="solar:monitor-bold-duotone" width={100} sx={{ mb: 3, opacity: 0.4 }} />
               <Typography variant="h3" sx={{ textTransform: 'uppercase', letterSpacing: 2 }}>{mode.replace('-', ' ')}</Typography>
               <Typography variant="body1" sx={{ mt: 2, opacity: 0.7 }}>
                  Orchestrating high-fidelity operational display mode for organizational POS terminals...
               </Typography>
            </Box>
          )}

          {/* Default Placeholder */}
          {!['online-shop', 'board-share', 'pos-main', 'kds-display', 'cfd-display', 'kiosk-mode', 'delivery-status', 'order-pay', 'shop-receipt', 'table-ordering'].includes(mode) && (
            <Card sx={{ p: 5, textAlign: 'center' }}>
               <Typography variant="h4">Tactical Commerce Component: {mode.toUpperCase()}</Typography>
               <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Orchestrating high-fidelity guest-facing commerce orchestration...
               </Typography>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
