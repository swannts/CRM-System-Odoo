'use client';

import Link from 'next/link';
import { useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchPosOrderThunk,
  fetchOrderShippingThunk,
  fetchDeliveryStatusThunk,
  approveJoinCheckRequestThunk,
  selectPublicFlow,
} from 'src/store/slices/public-flow-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { showToast } from 'src/components/toast';
import { Iconify } from 'src/components/iconify';

type Props = {
  mode: 'table-join-approve' | 'table-register' | 'table-side' | 'deliver';
  orderId?: string;
  roomId?: string;
  table?: string;
  type?: string;
  deliveryId?: string;
};

type OrderRecord = {
  _id?: string;
  id?: string;
  shopId?: string;
  organizationId?: string;
  userId?: string;
  contactName?: string;
  phone?: string;
  guests?: Array<{ phone?: string }>;
  table?: {
    node?: { data?: { label?: string } } | Array<{ data?: { label?: string } }>;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  fulfillmentStatus?: string;
  fulfillmentTrackingNumber?: string;
  orderStatus?: string;
  shippingLabel?: {
    trackingNumber?: string;
    trackingUrl?: string;
    carrier?: string;
    shipmentId?: string;
    selectedRate?: {
      carrier?: string;
      service?: string;
    };
    tracker?: {
      publicUrl?: string;
      status?: string;
      estimatedDeliveryDate?: string;
      trackingDetails?: Array<{
        datetime?: string;
        status?: string;
        message?: string;
        location?: string;
      }>;
    };
    addressTo?: {
      name?: string;
      phone?: string;
      street1?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  };
};

type StatusStep = {
  key: string;
  label: string;
  completed: boolean;
  active: boolean;
};

type DeliveryEvent = {
  id: string;
  title: string;
  description: string;
  at?: string | null;
  location?: string | null;
  completed: boolean;
};

const STATUS_SEQUENCE = ['processing', 'packed', 'shipped', 'delivered'];

function normalizeOrderId(value?: string | null) {
  return value ? String(value) : '';
}

function getTableLabel(order?: OrderRecord | null) {
  const node = order?.table?.node;
  if (Array.isArray(node)) {
    return node[0]?.data?.label || '';
  }
  return node?.data?.label || '';
}

function getOrigin() {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

function normalizeCurrentStatus(order: OrderRecord | null, deliveryStatus: any, shipping: any) {
  const raw =
    String(
      deliveryStatus?.currentStatus ||
        shipping?.fulfillmentStatus ||
        shipping?.shippingLabel?.tracker?.status ||
        order?.fulfillmentStatus ||
        order?.orderStatus ||
        ''
    ).toLowerCase();

  if (raw.includes('deliver')) return 'delivered';
  if (raw.includes('ship') || raw.includes('transit')) return 'shipped';
  if (raw.includes('pack') || raw.includes('label')) return 'packed';
  return 'processing';
}

function buildStatusSteps(currentStatus: string): StatusStep[] {
  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);

  return STATUS_SEQUENCE.map((key, index) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    completed: currentIndex >= index,
    active: currentIndex === index,
  }));
}

function formatAddress(parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(', ');
}

function normalizeDeliveryEvents(order: OrderRecord | null, deliveryStatus: any, shipping: any, currentStatus: string): DeliveryEvent[] {
  const trackingDetails = shipping?.shippingLabel?.tracker?.trackingDetails;

  if (Array.isArray(deliveryStatus?.events) && deliveryStatus.events.length > 0) {
    return deliveryStatus.events.map((event: any, index: number) => ({
      id: String(index),
      title: String(event?.status || 'Status updated'),
      description: String(event?.description || event?.message || 'Shipment activity recorded.'),
      at: event?.date || event?.datetime || event?.time || null,
      location: event?.location || null,
      completed: true,
    }));
  }

  if (Array.isArray(trackingDetails) && trackingDetails.length > 0) {
    return trackingDetails.map((detail: any, index: number) => ({
      id: String(index),
      title: String(detail?.status || 'Carrier update'),
      description: String(detail?.message || 'Carrier provided a tracking update.'),
      at: detail?.datetime || null,
      location: detail?.location || null,
      completed: true,
    }));
  }

  return buildStatusSteps(currentStatus).map((step, index) => ({
    id: step.key,
    title: step.label,
    description: step.completed
      ? `${step.label} has been recorded for this order.`
      : `${step.label} has not happened yet.`,
    at: index === 0 ? order?.id || order?._id || null : null,
    location: null,
    completed: step.completed,
  }));
}

function buildDeliveryModel(order: OrderRecord | null, deliveryStatus: any, shipping: any) {
  const currentStatus = normalizeCurrentStatus(order, deliveryStatus, shipping);
  const trackingNumber =
    deliveryStatus?.trackingNumber ||
    shipping?.trackingNumber ||
    shipping?.shippingLabel?.trackingNumber ||
    order?.fulfillmentTrackingNumber ||
    null;

  const trackingUrl =
    deliveryStatus?.trackingUrl ||
    shipping?.shippingLabel?.trackingUrl ||
    shipping?.shippingLabel?.tracker?.publicUrl ||
    null;

  const deliveryAddress =
    formatAddress([
      shipping?.shippingLabel?.addressTo?.street1,
      shipping?.shippingLabel?.addressTo?.city,
      shipping?.shippingLabel?.addressTo?.state,
      shipping?.shippingLabel?.addressTo?.zip,
      shipping?.shippingLabel?.addressTo?.country,
    ]) ||
    formatAddress([
      order?.shippingAddress?.line1,
      order?.shippingAddress?.city,
      order?.shippingAddress?.state,
      order?.shippingAddress?.postalCode,
      order?.shippingAddress?.country,
    ]) ||
    null;

  return {
    trackingNumber,
    trackingUrl,
    carrier:
      shipping?.shippingLabel?.selectedRate?.carrier ||
      shipping?.shippingLabel?.carrier ||
      deliveryStatus?.carrier ||
      'Carrier pending',
    service:
      shipping?.shippingLabel?.selectedRate?.service ||
      deliveryStatus?.service ||
      'Delivery service',
    recipientName:
      shipping?.shippingLabel?.addressTo?.name ||
      order?.shippingAddress?.fullName ||
      order?.contactName ||
      'Customer',
    recipientPhone:
      shipping?.shippingLabel?.addressTo?.phone ||
      order?.shippingAddress?.phone ||
      order?.phone ||
      null,
    expectedDelivery:
      deliveryStatus?.expectedDelivery ||
      shipping?.shippingLabel?.tracker?.estimatedDeliveryDate ||
      null,
    address: deliveryAddress,
    currentStatus,
    statusSteps: buildStatusSteps(currentStatus),
    events: normalizeDeliveryEvents(order, deliveryStatus, shipping, currentStatus),
  };
}

function copyText(value: string, successMessage: string) {
  if (typeof navigator === 'undefined') return;
  navigator.clipboard
    .writeText(value)
    .then(() => showToast({ message: successMessage, severity: 'success' }))
    .catch(() => showToast({ message: 'Unable to copy link.', severity: 'error' }));
}

function PublicCardShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
        background:
          'radial-gradient(circle at top right, rgba(31,111,235,0.14), transparent 34%), linear-gradient(180deg, #f7f4eb 0%, #f4efe4 100%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 720, borderRadius: 4, boxShadow: '0 20px 60px rgba(36, 33, 23, 0.12)' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>{children}</CardContent>
      </Card>
    </Box>
  );
}

export function PosPublicFlowView({
  mode,
  orderId,
  roomId,
  table,
  type,
  deliveryId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requesterPhone = searchParams.get('requester') || '';

  const dispatch = useAppDispatch();
  const { posOrder, approveJoin } = useAppSelector(selectPublicFlow);

  const orderLookupId = orderId || deliveryId || '';

  useEffect(() => {
    if (orderLookupId) {
      dispatch(fetchPosOrderThunk(orderLookupId));
    }
    if (mode === 'deliver' && deliveryId) {
      dispatch(fetchOrderShippingThunk(deliveryId));
      dispatch(fetchDeliveryStatusThunk(deliveryId));
    }
  }, [dispatch, orderLookupId, mode, deliveryId]);

  const handleApprove = async () => {
    if (orderId && requesterPhone) {
      await dispatch(approveJoinCheckRequestThunk({ orderId, requesterPhone })).unwrap();
      showToast({ message: 'Join check request approved.', severity: 'success' });
    }
  };

  const order = (posOrder.data || null) as OrderRecord | null;

  const inviteLink = useMemo(() => {
    if (!orderId || !roomId || !table || !order?.organizationId || !order?.userId) {
      return '';
    }

    const backTo = encodeURIComponent(`register/${orderId}/${roomId}/${table}`);
    return `${getOrigin()}${paths.public.loginContact(order.organizationId, order.userId)}?backTo=${backTo}`;
  }, [order?.organizationId, order?.userId, orderId, roomId, table]);

  const continueOrderHref = useMemo(() => {
    if (!order?.shopId) return '';
    const params = new URLSearchParams();
    if (roomId) params.set('roomId', roomId);
    if (table) params.set('table', table);
    params.set('paytype', 'true');
    if (orderId) params.set('joinOrderId', orderId);
    const guestPhone =
      typeof window !== 'undefined' ? window.localStorage.getItem('customerPhoneVerified') || '' : '';
    if (guestPhone) params.set('guestPhone', guestPhone);
    return `${paths.public.onlineShop(order.shopId)}?${params.toString()}`;
  }, [order?.shopId, orderId, roomId, table]);

  useEffect(() => {
    if (mode !== 'table-register') return;
    if (!order?.shopId || !continueOrderHref) return;

    if (typeof window !== 'undefined') {
      const guestPhone = window.localStorage.getItem('customerPhoneVerified') || '';
      window.sessionStorage.setItem(
        'pos-public-join-order',
        JSON.stringify({
          orderId: normalizeOrderId(order._id || order.id),
          shopId: order.shopId,
          roomId,
          table,
          guestPhone,
        })
      );
    }

    router.replace(continueOrderHref);
  }, [continueOrderHref, mode, order?._id, order?.id, order?.shopId, roomId, router, table]);

  const isLoading = posOrder.loading || (mode === 'table-register' && posOrder.loading);

  if (isLoading) {
    return (
      <PublicCardShell>
        <Stack spacing={2} alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            Loading your order details...
          </Typography>
        </Stack>
      </PublicCardShell>
    );
  }

  if (posOrder.error) {
    return (
      <PublicCardShell>
        <Stack spacing={3}>
          <Typography variant="h4">Order unavailable</Typography>
          <Alert severity="error">We could not load the order for this link.</Alert>
        </Stack>
      </PublicCardShell>
    );
  }

  if (mode === 'table-register') {
    return (
      <PublicCardShell>
        <Stack spacing={3}>
          <Typography variant="h4">Joining check...</Typography>
          <Typography variant="body1" color="text.secondary">
            We are connecting you to the online ordering flow for table {table || getTableLabel(order)}.
          </Typography>
          {continueOrderHref ? (
            <Button variant="contained" component={Link} href={continueOrderHref}>
              Continue manually
            </Button>
          ) : (
            <Alert severity="warning">This order does not have a shop context yet.</Alert>
          )}
        </Stack>
      </PublicCardShell>
    );
  }

  if (mode === 'table-join-approve') {
    return (
      <PublicCardShell>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Join Check Request</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Approve another guest to join this check and add items to the same table tab.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Order ${normalizeOrderId(order?._id || order?.id) || 'Unknown'}`} variant="outlined" />
            {getTableLabel(order) ? <Chip label={`Table ${getTableLabel(order)}`} color="primary" variant="outlined" /> : null}
          </Stack>

          {!requesterPhone ? (
            <Alert severity="warning">The request link is missing the guest phone number.</Alert>
          ) : (
            <Alert severity="info">Guest phone ending in {requesterPhone.replace(/\D/g, '').slice(-4) || 'unknown'}.</Alert>
          )}

          {approveJoin.success ? (
            <Alert severity="success">The guest has been approved and can now join this check.</Alert>
          ) : null}

          {approveJoin.error ? (
            <Alert severity="error">We could not approve the join request. Please try again.</Alert>
          ) : null}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <LoadingButton
              variant="contained"
              disabled={!requesterPhone}
              loading={approveJoin.loading}
              onClick={handleApprove}
            >
              Approve request
            </LoadingButton>
            {continueOrderHref ? (
              <Button color="inherit" component={Link} href={continueOrderHref}>
                Continue order
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </PublicCardShell>
    );
  }

  if (mode === 'table-side') {
    const isPartyMode = type === 'party';
    const joinHref = orderId && roomId && table ? paths.public.tableRegister(orderId, roomId, table) : '';

    return (
      <PublicCardShell>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">
              {isPartyMode ? 'Invite your party' : 'Join an existing check'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {isPartyMode
                ? 'Share this invite so other guests can join the same table tab.'
                : 'Use the invite flow below to add yourself to this table tab.'}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {getTableLabel(order) ? <Chip label={`Table ${getTableLabel(order)}`} color="primary" variant="outlined" /> : null}
            {roomId ? <Chip label={`Room ${roomId}`} variant="outlined" /> : null}
            {order?.shopId ? <Chip label={`Shop ${order.shopId}`} variant="outlined" /> : null}
          </Stack>

          {isPartyMode ? (
            <>
              {inviteLink ? (
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="subtitle1">Guest invite link</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                        {inviteLink}
                      </Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Button variant="contained" onClick={() => copyText(inviteLink, 'Invite link copied.')}>
                          Copy invite link
                        </Button>
                        <Button
                          color="inherit"
                          onClick={async () => {
                            if (typeof navigator !== 'undefined' && navigator.share) {
                              try {
                                await navigator.share({ title: 'Join my check', url: inviteLink });
                              } catch (_error) {
                                copyText(inviteLink, 'Invite link copied.');
                              }
                            } else {
                              copyText(inviteLink, 'Invite link copied.');
                            }
                          }}
                        >
                          Share invite
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ) : (
                <Alert severity="warning">This order is missing organization/user context for invite generation.</Alert>
              )}

              {continueOrderHref ? (
                <Button variant="text" component={Link} href={continueOrderHref}>
                  Continue current order
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                When you continue, we will attach you to the current table check and open the online ordering view.
              </Typography>
              {joinHref ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button variant="contained" component={Link} href={joinHref}>
                    Join this check
                  </Button>
                  {inviteLink ? (
                    <Button color="inherit" component={Link} href={inviteLink}>
                      Verify phone first
                    </Button>
                  ) : null}
                </Stack>
              ) : (
                <Alert severity="warning">This route is missing order, room, or table details.</Alert>
              )}
            </>
          )}
        </Stack>
      </PublicCardShell>
    );
  }

  const deliveryModel = buildDeliveryModel(order, posOrder.delivery, posOrder.shipping);

  return (
    <PublicCardShell>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Delivery status</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Track the shipping and fulfillment progress for this order.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`Status: ${deliveryModel.currentStatus}`} color="primary" />
          {deliveryModel.trackingNumber ? <Chip label={`Tracking: ${deliveryModel.trackingNumber}`} variant="outlined" /> : null}
          <Chip label={deliveryModel.carrier} variant="outlined" />
        </Stack>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Shipment details</Typography>
              <Typography variant="body2" color="text.secondary">
                {deliveryModel.service}
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">Recipient</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {deliveryModel.recipientName}
                  </Typography>
                  {deliveryModel.recipientPhone ? (
                    <Typography variant="body2" color="text.secondary">
                      {deliveryModel.recipientPhone}
                    </Typography>
                  ) : null}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">Delivery address</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {deliveryModel.address || 'Address pending'}
                  </Typography>
                </Box>
              </Stack>
              {deliveryModel.expectedDelivery ? (
                <Typography variant="body2" color="text.secondary">
                  Expected delivery: {deliveryModel.expectedDelivery}
                </Typography>
              ) : null}
              {deliveryModel.trackingUrl ? (
                <Button component={Link} href={deliveryModel.trackingUrl} target="_blank" rel="noopener noreferrer" variant="contained">
                  Open carrier tracking
                </Button>
              ) : null}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2.5}>
              <Typography variant="h6">Progress</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                {deliveryModel.statusSteps.map((step) => (
                  <Box key={step.key} sx={{ flex: 1, p: 2, borderRadius: 2, bgcolor: step.completed ? 'primary.lighter' : 'background.neutral' }}>
                    <Typography variant="subtitle2">{step.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.completed ? (step.active ? 'Current step' : 'Completed') : 'Pending'}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">Timeline</Typography>
              {deliveryModel.events.map((event, index) => (
                <Box key={event.id}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Chip
                      size="small"
                      color={event.completed ? 'primary' : 'default'}
                      label={event.completed ? 'Done' : 'Pending'}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">{event.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.description}
                      </Typography>
                      {event.at ? (
                        <Typography variant="caption" color="text.secondary">
                          {event.at}
                          {event.location ? ` • ${event.location}` : ''}
                        </Typography>
                      ) : event.location ? (
                        <Typography variant="caption" color="text.secondary">
                          {event.location}
                        </Typography>
                      ) : null}
                    </Box>
                  </Stack>
                  {index < deliveryModel.events.length - 1 ? <Divider sx={{ mt: 2 }} /> : null}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </PublicCardShell>
  );
}
