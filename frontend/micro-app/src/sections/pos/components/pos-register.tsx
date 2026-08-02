import { useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  selectPos, 
  fetchPosContext, 
  fetchPosProducts, 
  fetchPosOrders, 
  initializeCart, 
  addProductToCart, 
  updateCartQuantity, 
  removeProductFromCart, 
  processCheckout, 
  refundPosOrder,
  clearCheckoutState
} from 'src/store/slices/pos-slice';

import { posService } from '../services/pos-service';
import { PosProductGrid } from './pos-product-grid';
import { PosCart } from './pos-cart';
import { PosCustomerSelector } from './pos-customer-selector';
import { PosPaymentPanel } from './pos-payment-panel';
import { PosCheckoutDialog } from './pos-checkout-dialog';
import { PosOrdersTable } from './pos-orders-table';
import { PosReceiptDialog } from './pos-receipt-dialog';
import { PosRefundDialog } from './pos-refund-dialog';
import { showToast } from 'src/components/toast';

import { CartItem } from '../types';

// ----------------------------------------------------------------------

function hasNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toValidNumber(value: unknown): number | null {
  const num = typeof value === 'string' ? Number(value) : value;
  return typeof num === 'number' && Number.isFinite(num) ? num : null;
}

function normalizePaymentMethods(methods: unknown): Array<{ value: string; label: string }> {
  if (!Array.isArray(methods)) return [];
  return methods
    .map((method) => {
      if (typeof method === 'string') {
        return { value: method, label: method };
      }
      if (method && typeof method === 'object') {
        const value = (method as any).value || (method as any).id || (method as any).code;
        const label = (method as any).label || (method as any).name || value;
        if (typeof value === 'string' && typeof label === 'string') {
          return { value, label };
        }
      }
      return null;
    })
    .filter((method): method is { value: string; label: string } => method !== null);
}

type Props = {
  mode?: string;
  shopId?: string;
  deliveryId?: string;
  orderId?: string;
  [key: string]: any;
};

export function PosRegister({ mode, shopId, deliveryId, orderId, ...other }: Props) {
  const dispatch = useAppDispatch();
  const { 
    context, 
    products: productsState, 
    orders: ordersState, 
    cart: cartState, 
    checkout: checkoutState 
  } = useAppSelector(selectPos);

  const [activeTab, setActiveTab] = useState('register');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const [receiptData, setReceiptData] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Initial data loading
  useEffect(() => {
    dispatch(fetchPosContext());
    dispatch(fetchPosOrders());
    dispatch(initializeCart());
  }, [dispatch]);

  // Product searching
  useEffect(() => {
    dispatch(fetchPosProducts(searchQuery || undefined));
  }, [dispatch, searchQuery]);

  const handleAddToCart = async (product: any) => {
    if (!cartState.id) {
      showToast('Cart sync failed', 'error');
      return;
    }

    const productId = product?.id || product?.sku;
    if (!productId) {
      showToast('Invalid product', 'error');
      return;
    }

    const existing = cartState.items.find((item: any) => item.productId === String(productId));

    if (existing) {
      dispatch(updateCartQuantity({
        cartId: cartState.id,
        lineId: existing.id,
        qty: existing.qty + 1,
      }));
      return;
    }

    dispatch(addProductToCart({
      cartId: cartState.id,
      productId: String(productId),
      qty: 1,
    }));
  };

  const handleUpdateQuantity = async (lineId: string, qty: number) => {
    if (!cartState.id) {
      showToast('Cart sync failed', 'error');
      return;
    }

    if (qty <= 0) {
      await handleRemoveItem(lineId);
      return;
    }

    dispatch(updateCartQuantity({
      cartId: cartState.id,
      lineId,
      qty,
    }));
  };

  const handleRemoveItem = async (lineId: string) => {
    if (!cartState.id) {
      showToast('Cart sync failed', 'error');
      return;
    }

    dispatch(removeProductFromCart({
      cartId: cartState.id,
      lineId,
    }));
  };

  const handleClearCart = async () => {
    setConfirmClearOpen(false);
    dispatch(initializeCart());
  };

  const paymentMethods = useMemo(() => normalizePaymentMethods(context.data?.paymentMethods), [context.data?.paymentMethods]);
  const taxRate = toValidNumber(context.data?.taxRate);
  const subtotal = cartState.items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = hasNumber(taxRate) ? subtotal * taxRate : null;
  const total = subtotal + (tax ?? 0);

  const contextUnavailable = context.error || (!context.loading && !context.data);
  const paymentMethodsUnavailable = !context.loading && paymentMethods.length === 0;
  
  const cartReady = !!cartState.id && !cartState.loading && !cartState.error;

  const checkoutDisabledReason = (() => {
    if (!cartReady) return cartState.error || 'Cart is not ready';
    if (!context.data || contextUnavailable || context.loading) return 'POS settings unavailable';
    if (paymentMethodsUnavailable) return 'Payment methods unavailable';
    if (cartState.loading) return 'Cart is not ready';
    if (!cartState.items.length) return 'Cart is not ready';
    return null;
  })();

  const handleCheckoutConfirm = async (paymentMethod: string, amount: number) => {
    if (!cartState.id) {
      showToast('Cart is not ready', 'error');
      return;
    }

    try {
      const res = await dispatch(processCheckout({
        cartId: cartState.id,
        customerId: selectedCustomer?.id === 'walk-in-ui-only' ? null : selectedCustomer?.id || null,
        paymentMethod,
        amountGiven: amount,
      })).unwrap();

      showToast('Order successful!', 'success');
      setSelectedCustomer(null);
      setCheckoutOpen(false);
      
      setReceiptData(res.receiptData || res);
      setReceiptOpen(true);
      
      dispatch(fetchPosOrders());
    } catch (error: any) {
      showToast(error || 'Checkout failed', 'error');
    }
  };

  const handleSubmitBarcode = () => {
    const code = barcodeInput.trim();
    if (!code) return;

    const matched = (productsState.data || []).find((product: any) => String(product.barcode || product.sku || '') === code);
    if (!matched) {
      showToast('No product matches this barcode', 'error');
      return;
    }

    handleAddToCart(matched);
    setBarcodeInput('');
  };

  return (
    <Box display="flex" flexDirection="column" height="100vh" overflow="hidden" bgcolor="background.default">
      <Box px={3} pt={2} borderBottom={1} borderColor="divider" bgcolor="background.paper">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" fontWeight="bold">Point of Sale</Typography>
        </Box>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Register" value="register" />
          <Tab label="Orders" value="orders" />
        </Tabs>
      </Box>

      {activeTab === 'register' && (
        <Box display="flex" flex={1} overflow="hidden">
          <Box flex={2} borderRight={1} borderColor="divider" bgcolor="background.paper" overflow="hidden">
            <PosProductGrid
              products={productsState.data || []}
              isLoading={productsState.loading}
              isError={!!productsState.error}
              onRetry={() => dispatch(fetchPosProducts(searchQuery || undefined))}
              onAddToCart={handleAddToCart}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              barcodeInput={barcodeInput}
              onBarcodeInputChange={setBarcodeInput}
              onSubmitBarcode={handleSubmitBarcode}
              addDisabled={!cartReady || context.loading}
              addDisabledReason={checkoutDisabledReason}
            />
          </Box>

          <Box flex={1} display="flex" flexDirection="column" minWidth={350} bgcolor="background.paper">
            {context.loading && (
              <Box px={2} pt={2}>
                <Alert severity="info">Loading POS settings...</Alert>
              </Box>
            )}
            {context.error && (
              <Box px={2} pt={2}>
                <Alert
                  severity="error"
                  action={
                    <Button size="small" color="inherit" onClick={() => dispatch(fetchPosContext())}>
                      Retry
                    </Button>
                  }
                >
                  POS settings unavailable
                </Alert>
              </Box>
            )}
            {cartState.loading && (
              <Box px={2} pt={2}>
                <Alert icon={<CircularProgress size={16} />} severity="info">Processing cart...</Alert>
              </Box>
            )}
            {cartState.error && (
              <Box px={2} pt={2}>
                <Alert severity="error">Cart sync failed: {cartState.error}</Alert>
              </Box>
            )}

            <PosCustomerSelector
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
            />
            <Box flex={1} overflow="hidden">
              <PosCart
                items={cartState.items}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={() => setConfirmClearOpen(true)}
                disabled={!cartReady || cartState.loading}
              />
            </Box>
            <Box borderTop={1} borderColor="divider">
              <PosPaymentPanel
                subtotal={subtotal}
                tax={tax}
                total={total}
                onCheckout={() => setCheckoutOpen(true)}
                disabled={!!checkoutDisabledReason || checkoutState.loading}
                disabledReason={checkoutDisabledReason}
              />
            </Box>
          </Box>
        </Box>
      )}

      {activeTab === 'orders' && (
        <Box flex={1} overflow="auto" bgcolor="background.paper" p={2}>
          <PosOrdersTable
            orders={ordersState.data}
            isLoading={ordersState.loading}
            isError={!!ordersState.error}
            onRetry={() => dispatch(fetchPosOrders())}
            onViewReceipt={async (id) => {
              try {
                const receipt = await posService.getReceipt(id);
                setReceiptData(receipt.data || receipt);
                setReceiptOpen(true);
              } catch {
                showToast('Failed to load receipt', 'error');
              }
            }}
            onRefund={(order) => {
              setSelectedOrder(order);
              setRefundOpen(true);
            }}
          />
        </Box>
      )}

      <Dialog open={confirmClearOpen} onClose={() => setConfirmClearOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Clear Cart</DialogTitle>
        <DialogContent>Are you sure you want to remove all items from the cart?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClearOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleClearCart}>Clear All</Button>
        </DialogActions>
      </Dialog>

      <PosCheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        totalAmount={total}
        paymentMethods={paymentMethods}
        onConfirmPayment={handleCheckoutConfirm}
      />
      <PosReceiptDialog
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        data={receiptData}
      />
      {selectedOrder && (
        <PosRefundDialog
          open={refundOpen}
          onClose={() => setRefundOpen(false)}
          orderId={selectedOrder.ticketNo || selectedOrder.id}
          maxAmount={selectedOrder.totalAmount}
          onRefund={async (reason, amount) => {
            try {
              await dispatch(refundPosOrder({ id: selectedOrder.id, reason, amount })).unwrap();
              showToast('Refund successful', 'success');
              dispatch(fetchPosOrders());
            } catch (error: any) {
              showToast(error || 'Refund failed', 'error');
            }
          }}
        />
      )}
    </Box>
  );
}
