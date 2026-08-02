'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchCheckoutPageThunk,
  fetchQrPayPageThunk,
  fetchPublicWaiverThunk,
  generatePhoneVerificationThunk,
  trackQrPayPaymentThunk,
  selectPublicFlow,
} from 'src/store/slices/public-flow-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { PublicOrgView } from './public-org-view';
import { WaiverSignView } from './waiver-sign-view';
import { PublicEventView } from './public-event-view';
import { PublicPagesView } from './public-pages-view';
import { PublicSupportView } from './public-support-view';
import { PublicCommerceView } from './public-commerce-view';
import { PublicMembershipView } from './public-membership-view';

// ----------------------------------------------------------------------

type PublicMode =
  | 'checkout'
  | 'qrpay'
  | 'waiver'
  | 'phone-auth'
  | 'code-auth'
  | 'verify-email'
  | 'preview-form'
  | 'onboarding'
  | 'verified'
  | 'notifications'
  | 'mobile-settings'
  | 'mobile-menu'
  | 'integration-callback'
  | 'forgot-password'
  | 'generic-auth'
  | 'payment-method'
  | 'affiliate-signup'
  | 'event-checkin'
  | 'event-bracket'
  | 'fundraising-preview'
  | 'ticket-feedback'
  | 'chatbot-feedback'
  | 'feedback'
  | 'help-center'
  | 'help-article'
  | 'membership-checkout'
  | 'membership-sign'
  | 'organization-onboarding'
  | 'organization-verified'
  | 'organization-plans'
  | 'organization-payment'
  | 'organization-success'
  | 'token-auth'
  | 'fdd-public'
  | 'quote-view'
  | 'quote-accept'
  | 'mobile-sign'
  | 'checkout-page'
  | 'qr-pay'
  | 'a2p-legal'
  | 'a2p-optin'
  | 'verify-email'
  | 'board-invitation'
  | 'contact-phone-auth'
  | 'sign-in-code'
  | 'web-preview'
  | 'board-share'
  | 'online-shop'
  | 'product-detail'
  | 'order-pay'
  | 'shipping-pay'
  | 'checkout-preauth'
  | 'shop-receipt'
  | 'shop-login'
  | 'shop-signup'
  | 'customer-orders'
  | 'pos-main'
  | 'kds-display'
  | 'cfd-display'
  | 'kiosk-mode';

type Props = {
  mode: PublicMode;
  slug?: string;
  id?: string;
  organizationId?: string;
  location?: string;
  contactTypeId?: string;
  assignerId?: string;
  contactId?: string;
  email?: string;
  formId?: string;
  formPageId?: string;
  referralCode?: string;
  eventId?: string;
  type?: string;
  guestId?: string;
  campaignId?: string;
  ticketId?: string;
  chatbotId?: string;
  sessionId?: string;
  contractId?: string;
  planId?: string;
  token?: string;
  duration?: string;
  userId?: string;
  shopId?: string;
  productId?: string;
  orderId?: string;
  workspaceId?: string;
  boardId?: string;
  cartId?: string;
};

export function PublicFlowWorkspaceView(props: Props) {
  const {
    mode,
    slug,
    id,
    organizationId,
    location,
    contactTypeId,
    assignerId,
    contactId,
    email,
    formId,
    formPageId,
    referralCode,
    eventId,
    campaignId,
    ticketId,
    chatbotId,
    contractId,
    planId,
    token,
    userId,
    shopId,
    productId,
    orderId,
    workspaceId,
    boardId,
    cartId,
  } = props;

  const dispatch = useAppDispatch();
  const { checkoutPage, qrPayPage, waiver, verification } = useAppSelector(selectPublicFlow);

  const [qrTracked, setQrTracked] = useState(false);

  const phoneMethods = useForm({
    defaultValues: {
      phoneNumber: '',
      source: '',
    },
  });

  const qrMethods = useForm({
    defaultValues: {
      amount: '',
      email: '',
      phone: '',
    },
  });

  const affiliateMethods = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      referralCode: referralCode || '',
    },
  });

  useEffect(() => {
    if (mode === 'checkout' && slug) {
      dispatch(fetchCheckoutPageThunk(slug));
    }
    if (mode === 'qrpay' && slug) {
      dispatch(fetchQrPayPageThunk(slug));
    }
    if (mode === 'waiver' && id) {
      dispatch(fetchPublicWaiverThunk(id));
    }
  }, [dispatch, mode, slug, id]);

  const handlePhoneSubmit = async (values: any) => {
    await dispatch(generatePhoneVerificationThunk({
      ...values,
      userId: location,
      organizationId,
    })).unwrap();
  };

  const handleQrTrackSubmit = async (values: any) => {
    if (slug) {
      await dispatch(trackQrPayPaymentThunk({ slug, values })).unwrap();
      setQrTracked(true);
    }
  };

  const isLoading = checkoutPage.loading || qrPayPage.loading || waiver.loading;

  if (isLoading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const checkoutData = checkoutPage.data;
  const qrPayData = qrPayPage.data;

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">
            {mode === 'checkout'
              ? 'Checkout'
              : mode === 'qrpay'
                ? 'QR Pay'
                : mode === 'waiver'
                  ? 'Waiver Signature'
                  : mode === 'phone-auth'
                    ? 'Phone Verification'
                    : mode === 'code-auth'
                      ? 'Sign In With Code'
                      : mode === 'verify-email'
                        ? 'Email Verification'
                        : mode === 'preview-form'
                          ? 'Form Preview'
                          : mode === 'onboarding'
                            ? 'Onboarding'
                            : mode === 'verified'
                              ? 'Verified'
                              : mode === 'notifications'
                                ? 'Notifications'
                                : mode === 'mobile-settings'
                                  ? 'Mobile Settings'
                                  : mode === 'mobile-menu'
                                    ? 'Mobile Menu'
                                    : mode === 'integration-callback'
                                      ? 'Integration Callback'
                                      : mode === 'forgot-password'
                                        ? 'Forgot Password'
                                        : mode === 'affiliate-signup'
                                          ? 'Join the Partner Program'
                                          : mode === 'payment-method'
                                            ? 'Update Payment Method'
                                            : 'Authentication'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {mode === 'payment-method' 
               ? 'Securely update your credit card or billing information on file.' 
               : 'Legacy public and mobile flow routes mapped into the micro-app with compatibility data where available.'}
          </Typography>
        </Box>

        {mode === 'payment-method' ? null : (
           <Card sx={{ p: 3 }}>
             <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
               <Button component={Link} href={paths.public.login} variant="soft" color="inherit">
                 Login
               </Button>
               <Button component={Link} href={paths.public.register} variant="soft" color="inherit">
                 Register
               </Button>
               <Button component={Link} href={paths.public.onboarding} variant="soft" color="inherit">
                 Onboarding
               </Button>
               <Button component={Link} href={paths.public.notifications} variant="soft" color="inherit">
                 Notifications
               </Button>
             </Stack>
           </Card>
        )}

        {mode === 'payment-method' && (
           <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} md={6}>
                 <Card sx={{ p: 4 }}>
                    <Stack spacing={3}>
                       <Box sx={{ textAlign: 'center' }}>
                          <Iconify icon="solar:shield-check-bold-duotone" width={60} sx={{ color: 'success.main', mb: 2 }} />
                          <Typography variant="h5">Secure Payment Update</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Organization ID: {organizationId}</Typography>
                       </Box>

                       <Alert severity="info">
                          Your information is encrypted and securely processed. We do not store your full card number.
                       </Alert>

                       <Stack spacing={2.5}>
                          <TextField fullWidth label="Cardholder Name" placeholder="John Doe" />
                          <TextField fullWidth label="Card Number" placeholder="**** **** **** ****" />
                          <Stack direction="row" spacing={2}>
                             <TextField fullWidth label="Expiry Date" placeholder="MM/YY" />
                             <TextField fullWidth label="CVV" placeholder="***" />
                          </Stack>
                          <TextField fullWidth label="Billing ZIP / Postal Code" />
                          <Button fullWidth size="large" variant="contained" color="primary">Update Billing Information</Button>
                       </Stack>

                       <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <Iconify icon="logos:visa" width={32} sx={{ mr: 1 }} />
                          <Iconify icon="logos:mastercard" width={32} sx={{ mr: 1 }} />
                          <Iconify icon="logos:stripe" width={40} />
                       </Box>
                    </Stack>
                 </Card>
              </Grid>
           </Grid>
        )}

        {mode === 'affiliate-signup' && (
           <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} md={6}>
                 <Card sx={{ p: 4 }}>
                    <Stack spacing={3}>
                       <Box sx={{ textAlign: 'center' }}>
                          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'primary.lighter', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                             <Iconify icon="solar:star-bold-duotone" width={40} />
                          </Box>
                          <Typography variant="h5">Partner with Us</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Earn rewards for every successful referral.</Typography>
                       </Box>

                       <Stack spacing={2.5}>
                          <TextField fullWidth label="Full Name" {...affiliateMethods.register('fullName')} />
                          <TextField fullWidth label="Email Address" {...affiliateMethods.register('email')} />
                          <TextField fullWidth label="Password" type="password" {...affiliateMethods.register('password')} />
                          <TextField 
                             fullWidth 
                             label="Referral Code" 
                             disabled={Boolean(referralCode)} 
                             {...affiliateMethods.register('referralCode')} 
                          />
                          <Button fullWidth size="large" variant="contained">Create Partner Account</Button>
                       </Stack>
                    </Stack>
                 </Card>
              </Grid>
           </Grid>
        )}

        {mode === 'checkout' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {checkoutData?.title || checkoutData?.name || slug}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  {checkoutData?.description || 'Public checkout page compatibility route.'}
                </Typography>
                <Stack spacing={1}>
                  {Array.isArray(checkoutData?.products) &&
                    checkoutData.products.slice(0, 8).map((product: any, index: number) => (
                      <Box key={product._id || product.id || index} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                        <Typography variant="subtitle2">{product.label || product.name || `Product ${index + 1}`}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          ${Number(product.price || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Current Compatibility
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Public checkout content now loads in the new app. Full checkout payment UX and event tracking still need a dedicated frontend parity pass.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {mode === 'qrpay' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {qrPayData?.title || qrPayData?.name || slug}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  {qrPayData?.description || 'Public QR pay page compatibility route.'}
                </Typography>
                <Stack
                  component="form"
                  spacing={2}
                  onSubmit={qrMethods.handleSubmit(handleQrTrackSubmit)}
                >
                  <TextField label="Amount" {...qrMethods.register('amount')} />
                  <TextField label="Email" {...qrMethods.register('email')} />
                  <TextField label="Phone" {...qrMethods.register('phone')} />
                  <LoadingButton type="submit" variant="contained" loading={qrPayPage.loading}>
                    Track Payment Intent
                  </LoadingButton>
                </Stack>
                {qrTracked && <Alert severity="success" sx={{ mt: 2 }}>Payment tracking request sent.</Alert>}
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  QR Pay Context
                </Typography>
                <Typography variant="body2">slug: {slug}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Public QR pay data now loads through the gateway, including tracking endpoint support.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {mode === 'waiver' && (
           <WaiverSignView id={id!} />
        )}

        {mode === 'phone-auth' && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Contact Phone Verification
            </Typography>
            <Stack
              component="form"
              spacing={2}
              onSubmit={phoneMethods.handleSubmit(handlePhoneSubmit)}
            >
              <TextField label="Phone Number" {...phoneMethods.register('phoneNumber')} />
              <TextField label="Back To / Source" {...phoneMethods.register('source')} />
              <LoadingButton type="submit" variant="contained" loading={verification.loading}>
                Send Verification
              </LoadingButton>
            </Stack>
            {verification.result && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Verification request sent. organizationId: {organizationId}, location: {location}
              </Alert>
            )}
          </Card>
        )}

        {mode === 'code-auth' && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Device Code Sign-In
            </Typography>
            <Alert severity="info">
              The legacy POS/device code route now exists in the new app. Full device-auth behavior still depends on the legacy auth/device stack and will need a dedicated migration pass.
            </Alert>
          </Card>
        )}

        {mode === 'verify-email' && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Verify Email
            </Typography>
            <Typography variant="body2">verification id: {id}</Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              Legacy email verification route parity is present. Verification execution still depends on the existing authentication/email system.
            </Alert>
          </Card>
        )}

        {mode === 'preview-form' && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Form Preview
            </Typography>
            <Typography variant="body2">formId: {formId}</Typography>
            <Typography variant="body2">formPageId: {formPageId}</Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              The preview route exists in the new app. Full rendered page parity still depends on the legacy form/page runtime.
            </Alert>
          </Card>
        )}

        {mode === 'onboarding' && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Onboarding
            </Typography>
            <Alert severity="info">
              Onboarding route parity is now present in the micro-app. The deeper onboarding workflow still needs a dedicated migration from the legacy onboarding stack.
            </Alert>
          </Card>
        )}

        {mode === 'verified' && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Verified
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              This confirmation route from the legacy onboarding flow now resolves in the new app.
            </Typography>
          </Card>
        )}

        {(mode === 'notifications' || mode === 'mobile-settings' || mode === 'mobile-menu') && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {mode === 'notifications'
                ? 'Notifications'
                : mode === 'mobile-settings'
                  ? 'Mobile Settings'
                  : 'Mobile Menu'}
            </Typography>
            <Alert severity="info">
              This legacy mobile entry route is now exposed in the new app. Full mobile-native interaction parity still requires a dedicated mobile UX migration.
            </Alert>
          </Card>
        )}

        {(mode === 'integration-callback' || mode === 'forgot-password' || mode === 'generic-auth') && (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {mode === 'integration-callback'
                ? 'Uber Eats Callback'
                : mode === 'forgot-password'
                  ? 'Forgot Password'
                  : 'Legacy Authentication Route'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              organizationId: {organizationId || 'n/a'} | contactTypeId: {contactTypeId || 'n/a'} | assignerId:{' '}
              {assignerId || 'n/a'} | contactId: {contactId || 'n/a'} | email: {email || 'n/a'}
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              The legacy route is now present in the micro-app. Full parity for this auth/integration flow still depends on remaining compatibility and auth migration work.
            </Alert>
          </Card>
        )}

        {mode === 'event-checkin' && (
           <PublicEventView mode="checkin" eventId={eventId} />
        )}

        {mode === 'event-bracket' && (
           <PublicEventView mode="bracket" eventId={eventId} />
        )}

        {mode === 'fundraising-preview' && (
           <PublicEventView mode="fundraising" campaignId={campaignId} />
        )}

        {(mode === 'ticket-feedback' || mode === 'chatbot-feedback' || mode === 'feedback') && (
           <PublicSupportView mode={mode} ticketId={ticketId} chatbotId={chatbotId} />
        )}

        {(mode === 'help-center' || mode === 'help-article') && (
           <PublicSupportView mode={mode} id={id} />
        )}

        {(mode === 'membership-checkout' || mode === 'membership-sign') && (
           <PublicMembershipView 
             mode={mode === 'membership-checkout' ? 'checkout' : 'sign'} 
             contractId={contractId} 
             contactId={contactId} 
           />
        )}

        {(mode === 'organization-onboarding' || 
          mode === 'organization-verified' || 
          mode === 'organization-plans' || 
          mode === 'organization-payment' || 
          mode === 'organization-success' || 
          mode === 'token-auth' || 
          mode === 'fdd-public') && (
           <PublicOrgView 
             mode={mode.replace('organization-', '') as any} 
             orgId={organizationId} 
             planId={planId} 
             token={token}
             formId={formId}
             userId={userId}
           />
        )}

        {(mode === 'quote-view' || 
          mode === 'quote-accept' || 
          mode === 'mobile-sign' || 
          mode === 'checkout-page' || 
          mode === 'qr-pay' || 
          mode === 'a2p-legal' || 
          mode === 'a2p-optin' || 
          mode === 'verify-email' || 
          mode === 'board-invitation' || 
          mode === 'contact-phone-auth' || 
          mode === 'sign-in-code') && (
           <PublicPagesView 
             mode={mode} 
             slug={slug} 
             id={id} 
             token={token}
             formId={formId}
             userId={userId}
             organizationId={organizationId}
             location={location}
           />
        )}

        {(mode === 'board-share' || 
          mode === 'online-shop' || 
          mode === 'product-detail' || 
          mode === 'order-pay' || 
          mode === 'shipping-pay' || 
          mode === 'checkout-preauth' || 
          mode === 'shop-receipt' || 
          mode === 'shop-login' || 
          mode === 'shop-signup' || 
          mode === 'customer-orders' || 
          mode === 'pos-main' || 
          mode === 'kds-display' || 
          mode === 'cfd-display' || 
          mode === 'kiosk-mode') && (
           <PublicCommerceView 
             mode={mode} 
             shopId={shopId} 
             productId={productId} 
             orderId={orderId}
             workspaceId={workspaceId}
             boardId={boardId}
             cartId={cartId}
           />
        )}
      </Stack>
    </Container>
  );
}
