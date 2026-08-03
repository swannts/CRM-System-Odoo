import type {
  ICommerceCoupon,
  ICommerceProduct,
  ICommerceInventoryItem,
} from 'src/services/commerce-service';

import Link from 'next/link';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Menu from '@mui/material/Menu';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Form, RHFTextField } from 'src/components/hook-form';

import { COMMERCE_DASHBOARD_MODULES } from './commerce-workspace.types';
import {
  getBasePrice,
  getProductHref,
  inventoryStatus,
  orderStatusColor,
  getAvailableStock,
  getInventoryTotal,
  isProductPurchasable,
  getStorefrontHomeHref,
} from './commerce-workspace.utils';

import type {
  CartLine,
  LocalOrder,
  ProductFormValues,
  CommerceDashboardModule,
} from './commerce-workspace.types';
import {event} from "next/dist/build/output/log";

type SummaryCardsProps = {
  products: ICommerceProduct[];
  orders: LocalOrder[];
  cartItems?: CartLine[];
};

export function CommerceSummaryCards({
  products,
  orders,
  cartItems = [],
  topProducts,
}: SummaryCardsProps & { topProducts?: any[] }) {
  const grossRevenueCents = orders.reduce((sum, item) => sum + (item.totalAmountCents || 0), 0);
  const paidOrders = orders.filter((item) =>
    ['paid', 'complete', 'completed'].includes(String(item.paymentStatus || '').toLowerCase())
  );
  const paidRevenueCents = paidOrders.reduce((sum, item) => sum + (item.totalAmountCents || 0), 0);
  const avgOrderCents = orders.length ? Math.round(grossRevenueCents / orders.length) : 0;
  const uniqueCustomers = new Set(
    orders
      .map((item) => {
        const shipping = item.shippingAddress as Record<string, any> | undefined;
        const email = shipping?.email ? String(shipping.email).toLowerCase() : '';
        const fallbackName = shipping?.customerName
          ? String(shipping.customerName).toLowerCase()
          : '';
        return email || fallbackName || '';
      })
      .filter(Boolean)
  ).size;
  const activeProducts = products.filter((product) => product.status === 'active').length;

  const statusGroups = [
    {
      label: 'Pending',
      color: 'warning' as const,
      count: orders.filter((item) =>
        ['pending', 'new', 'pending_payment'].includes(item.status.toLowerCase())
      ).length,
    },
    {
      label: 'Processing',
      color: 'info' as const,
      count: orders.filter((item) => ['processing'].includes(item.status.toLowerCase())).length,
    },
    {
      label: 'Completed',
      color: 'success' as const,
      count: orders.filter((item) =>
        ['complete', 'completed', 'paid'].includes(item.status.toLowerCase())
      ).length,
    },
    {
      label: 'Cancelled',
      color: 'error' as const,
      count: orders.filter((item) =>
        ['cancelled', 'closed', 'canceled', 'failed'].includes(item.status.toLowerCase())
      ).length,
    },
  ];

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        {[
          {
            label: 'Products',
            value: products.length,
            icon: 'solar:box-bold-duotone',
            helper: `${activeProducts} active listings`,
          },
          {
            label: 'Orders',
            value: orders.length,
            icon: 'solar:cart-large-bold-duotone',
            helper: `${paidOrders.length} paid orders`,
          },
          {
            label: 'Gross Revenue',
            value: fCurrency(grossRevenueCents / 100),
            icon: 'solar:wad-of-money-bold-duotone',
            helper: `${cartItems.length} items currently in cart`,
          },
          {
            label: 'Paid Revenue',
            value: fCurrency(paidRevenueCents / 100),
            icon: 'solar:wallet-money-bold-duotone',
            helper: `${orders.length - paidOrders.length} not fully paid`,
          },
          {
            label: 'Average Order',
            value: fCurrency(avgOrderCents / 100),
            icon: 'solar:chart-2-bold-duotone',
            helper: 'Average order value',
          },
          {
            label: 'Customers',
            value: uniqueCustomers,
            icon: 'solar:users-group-two-rounded-bold-duotone',
            helper: 'Distinct shoppers in current data',
          },
        ].map((item) => (
          <Grid item xs={12} md={6} xl={4} key={item.label}>
            <Card sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: 'background.neutral',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon={item.icon} width={28} />
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h4">{item.value}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {item.helper}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Order Pipeline
            </Typography>
            <Stack spacing={2}>
              {statusGroups.map((group) => {
                const percentage = orders.length
                  ? Math.round((group.count / orders.length) * 100)
                  : 0;
                return (
                  <Stack key={group.label} spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{group.label}</Typography>
                      <Chip
                        size="small"
                        color={group.color}
                        label={`${group.count} (${percentage}%)`}
                        variant="soft"
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      color={
                        group.color === 'error'
                          ? 'error'
                          : group.color === 'success'
                            ? 'success'
                            : 'primary'
                      }
                    />
                  </Stack>
                );
              })}
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Orders
            </Typography>
            <Stack spacing={1.5}>
              {recentOrders.length === 0 ? (
                <Alert severity="info">No orders available yet.</Alert>
              ) : (
                recentOrders.map((order) => (
                  <Stack
                    key={order.id}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">{String(order.id).slice(0, 12)}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(order.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Chip
                        size="small"
                        label={order.status}
                        color={orderStatusColor(order.status)}
                        variant="outlined"
                      />
                      <Typography variant="subtitle2">
                        {fCurrency((order.totalAmountCents || 0) / 100)}
                      </Typography>
                    </Stack>
                  </Stack>
                ))
              )}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {topProducts && topProducts.length > 0 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Top Selling Products
          </Typography>
          <Stack spacing={2}>
            {topProducts.map((p, index) => (
              <Stack key={p.name} direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: 'background.neutral',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                >
                  {index + 1}
                </Box>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {p.name}
                </Typography>
                <Typography variant="subtitle2">{fCurrency(p.revenue / 100)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  ({p.quantity} sold)
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

type ProductsTableProps = {
  filteredProducts: ICommerceProduct[];
  categories: Array<{ id: string; name: string; productCount?: number }>;
  resolvedShopKey: string;
  search: string;
  categoryFilter: string;
  statusFilter: string;
  onCreate: () => void;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onEdit: (product: ICommerceProduct) => void;
  onDelete: (id: string) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[], checked: boolean) => void;
  onBulkActivate: () => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  enableBulkStatusActions?: boolean;
  onQuickInventorySave: (sku: string, qty: number, sourceCode: string) => void;
  isBulkUpdating?: boolean;
  isBulkDeleting?: boolean;
  isQuickInventorySaving?: boolean;
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (pageSize: number) => void;
};

export function CommerceProductsTable({
  filteredProducts,
  categories,
  resolvedShopKey,
  search,
  categoryFilter,
  statusFilter,
  onCreate,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onBulkActivate,
  onBulkArchive,
  onBulkDelete,
  enableBulkStatusActions = true,
  onQuickInventorySave,
  isBulkUpdating = false,
  isBulkDeleting = false,
  isQuickInventorySaving = false,
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}: ProductsTableProps) {
  const activeProducts = filteredProducts.filter((product) => product.status === 'active').length;
  const lowStockProducts = filteredProducts.filter((product) => {
    const inventory = product.variants?.length ? getInventoryTotal(product) : 0;
    const threshold = product.lowStockThreshold || 5;
    return product.variants?.length ? inventory > 0 && inventory <= threshold : false;
  }).length;
  const [inventoryDrafts, setInventoryDrafts] = useState<
    Record<string, { qty: string; sourceCode: string }>
  >({});
  const [inventoryQuickEditTarget, setInventoryQuickEditTarget] = useState<ICommerceProduct | null>(
    null
  );
  const hasActiveFilters =
    Boolean(search.trim()) || categoryFilter !== 'all' || statusFilter !== 'all';
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(null);
  const [activeActionProduct, setActiveActionProduct] = useState<ICommerceProduct | null>(null);
  const actionsMenuOpen = Boolean(actionsAnchorEl && activeActionProduct);

  const openActionsMenu = (event: React.MouseEvent<HTMLElement>, product: ICommerceProduct) => {
    setActionsAnchorEl(event.currentTarget);
    setActiveActionProduct(product);
  };

  const closeActionsMenu = () => {
    setActionsAnchorEl(null);
    setActiveActionProduct(null);
  };

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Stack spacing={2.25} sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
        >
          <Box>
            <Typography variant="h5">Catalog</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Create and review the products sold through your shop.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }} useFlexGap>
              <Chip
                size="small"
                label={`${filteredProducts.length} shown`}
                variant="soft"
                color="default"
              />
              <Chip
                size="small"
                label={`${activeProducts} active`}
                variant="soft"
                color="success"
              />
              <Chip
                size="small"
                label={`${lowStockProducts} low stock`}
                variant="soft"
                color={lowStockProducts ? 'warning' : 'default'}
              />
              {selectedIds.length > 0 && (
                <Chip
                  size="small"
                  label={`${selectedIds.length} selected`}
                  variant="soft"
                  color="info"
                />
              )}
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }} useFlexGap>
            {selectedIds.length > 0 && (
              <>
                {enableBulkStatusActions && (
                  <>
                    <Button
                      size="small"
                      color="success"
                      variant="outlined"
                      onClick={onBulkActivate}
                      disabled={isBulkUpdating || isBulkDeleting}
                    >
                      Activate ({selectedIds.length})
                    </Button>
                    <Button
                      size="small"
                      color="warning"
                      variant="outlined"
                      onClick={onBulkArchive}
                      disabled={isBulkUpdating || isBulkDeleting}
                    >
                      Archive
                    </Button>
                  </>
                )}
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  onClick={onBulkDelete}
                  disabled={isBulkDeleting || isBulkUpdating}
                >
                  {isBulkDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={onCreate}
            >
              New product
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            size="small"
            placeholder="Search products"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { md: 280 } }}
          />
          <TextField
            select
            size="small"
            label="Category"
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
            sx={{ minWidth: { md: 220 } }}
          >
            <MenuItem value="all">All categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
                {typeof category.productCount === 'number' ? ` (${category.productCount})` : ''}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            sx={{ minWidth: { md: 180 } }}
          >
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>
          {hasActiveFilters && (
            <Button
              size="small"
              color="inherit"
              variant="text"
              startIcon={<Iconify icon="solar:restart-bold" width={16} />}
              onClick={() => {
                onSearchChange('');
                onCategoryFilterChange('all');
                onStatusFilterChange('all');
              }}
            >
              Reset
            </Button>
          )}
        </Stack>
      </Stack>
      <Divider />
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'background.neutral',
          borderBottom: (theme) => `1px dashed ${theme.palette.divider}`,
        }}
      >
        <Grid container spacing={2}>
          {[
            {
              label: 'Visible products',
              value: filteredProducts.length,
              helper: 'Results in the current view',
            },
            { label: 'Active listings', value: activeProducts, helper: 'Products ready for sale' },
            {
              label: 'Low stock alerts',
              value: lowStockProducts,
              helper: 'Tracked variants below threshold',
            },
          ].map((item) => (
            <Grid key={item.label} item xs={12} md={4}>
              <Stack spacing={0.25}>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  {item.label}
                </Typography>
                <Typography variant="h5">{item.value}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {item.helper}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>
      <TableContainer sx={{ maxHeight: 760 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedIds.length > 0 && selectedIds.length < filteredProducts.length
                  }
                  checked={
                    filteredProducts.length > 0 && selectedIds.length === filteredProducts.length
                  }
                  onChange={(event) =>
                    onToggleSelectAll(
                      filteredProducts.map((p) => p.id),
                      event.target.checked
                    )
                  }
                />
              </TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Catalog</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Pricing</TableCell>
              <TableCell>Inventory</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => {
              const hasTrackedInventory = Boolean(product.variants?.length);
              const inventory = hasTrackedInventory ? getInventoryTotal(product) : 0;
              const inventoryState = hasTrackedInventory
                ? inventoryStatus(inventory)
                : { label: 'Available', color: 'success' as const };

              return (
                <TableRow
                  key={product.id}
                  hover
                  sx={{
                    '&:last-of-type td': { borderBottom: 0 },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(product.id)}
                      onChange={() => onToggleSelect(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar
                        src={product.photos?.[0]}
                        variant="rounded"
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          bgcolor: 'background.neutral',
                        }}
                      >
                        <Iconify icon="solar:box-bold-duotone" width={24} />
                      </Avatar>
                      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap sx={{ maxWidth: 260 }}>
                          {product.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {product.description || 'No description provided yet.'}
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            label={product.sku || 'No SKU'}
                            variant="soft"
                            color="default"
                          />
                          {product.photos?.length ? (
                            <Chip
                              size="small"
                              label={`${product.photos.length} image${product.photos.length > 1 ? 's' : ''}`}
                              variant="soft"
                              color="info"
                            />
                          ) : null}
                        </Stack>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.75}>
                      <Typography variant="body2">
                        SKU: <strong>{product.sku || 'Not set'}</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Category: {product.categoryName || 'Uncategorized'}
                      </Typography>
                      {product.tags?.length ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {product.tags.slice(0, 2).map((tag) => (
                            <Chip key={tag} size="small" label={tag} variant="outlined" />
                          ))}
                          {product.tags.length > 2 && (
                            <Chip
                              size="small"
                              label={`+${product.tags.length - 2}`}
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          No tags yet
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={String(product.status || 'draft').toUpperCase()}
                      color="primary"
                      variant="outlined"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        px: 0.5,
                        minWidth: 76,
                        justifyContent: 'center',
                        textTransform: 'uppercase',
                        borderColor: 'primary.main',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2">
                        {fCurrency(getBasePrice(product) / 100)}
                      </Typography>
                      {(product.compareAtPriceCents || 0) > getBasePrice(product) && (
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', textDecoration: 'line-through' }}
                        >
                          {fCurrency((product.compareAtPriceCents || 0) / 100)}
                        </Typography>
                      )}
                      {(product.costCents || 0) > 0 && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Cost: {fCurrency((product.costCents || 0) / 100)}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1} alignItems="flex-start">
                      <Tooltip title="Click to quick edit inventory" arrow>
                        <Chip
                          size="small"
                          label={`${inventoryState.label}${hasTrackedInventory && inventory ? ` (${inventory})` : ''}`}
                          color={inventoryState.color}
                          variant="soft"
                          onClick={() => setInventoryQuickEditTarget(product)}
                          sx={{
                            cursor: 'pointer',
                            fontWeight: 600,
                            '&:hover': {
                              opacity: 0.72,
                            },
                          }}
                        />
                      </Tooltip>
                      {hasTrackedInventory && (
                        <Box sx={{ width: 1, px: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={inventory > 0 ? Math.min(100, inventory * 5) : 0}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Actions">
                      <IconButton
                        size="small"
                        onClick={(event) => openActionsMenu(event, product)}
                        aria-label={`Open actions for ${product.name}`}
                      >
                        <Iconify icon="solar:menu-dots-bold" width={20} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      mx: 'auto',
                      mb: 1.5,
                      borderRadius: 2,
                      bgcolor: 'background.neutral',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon="solar:box-minimalistic-bold-duotone" width={28} />
                  </Box>
                  <Typography variant="subtitle1">No products found.</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {hasActiveFilters
                      ? 'Try resetting filters or search terms.'
                      : 'Create your first product to get started.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalRows}
        page={page}
        onPageChange={(_event, nextPage) => onPageChange(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
        rowsPerPageOptions={[10, 20, 50]}
      />
      <Menu
        anchorEl={actionsAnchorEl}
        open={actionsMenuOpen}
        onClose={closeActionsMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          component={Link}
          href={getProductHref(resolvedShopKey, activeActionProduct?.id || '')}
          onClick={closeActionsMenu}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:eye-bold-duotone" width={16} />
            <span>Preview</span>
          </Stack>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (activeActionProduct) onEdit(activeActionProduct);
            closeActionsMenu();
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:pen-2-bold-duotone" width={16} />
            <span>Edit</span>
          </Stack>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (activeActionProduct) onDelete(activeActionProduct.id);
            closeActionsMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
            <span>Delete</span>
          </Stack>
        </MenuItem>
      </Menu>

      <Dialog
        open={Boolean(inventoryQuickEditTarget)}
        onClose={() => setInventoryQuickEditTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Quick edit inventory</DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          {inventoryQuickEditTarget && (
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="subtitle1" noWrap>
                  {inventoryQuickEditTarget.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  SKU: {inventoryQuickEditTarget.sku || 'N/A'}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={
                  inventoryDrafts[inventoryQuickEditTarget.id]?.qty ??
                  String(getInventoryTotal(inventoryQuickEditTarget))
                }
                onChange={(event) =>
                  setInventoryDrafts((prev) => ({
                    ...prev,
                    [inventoryQuickEditTarget.id]: {
                      qty: event.target.value,
                      sourceCode: prev[inventoryQuickEditTarget.id]?.sourceCode ?? 'default',
                    },
                  }))
                }
              />

              <TextField
                fullWidth
                select
                label="Inventory Source"
                value={inventoryDrafts[inventoryQuickEditTarget.id]?.sourceCode ?? 'default'}
                onChange={(event) =>
                  setInventoryDrafts((prev) => ({
                    ...prev,
                    [inventoryQuickEditTarget.id]: {
                      qty:
                        inventoryDrafts[inventoryQuickEditTarget.id]?.qty ??
                        String(getInventoryTotal(inventoryQuickEditTarget)),
                      sourceCode: event.target.value,
                    },
                  }))
                }
              >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="warehouse">Warehouse</MenuItem>
                <MenuItem value="storefront">Storefront</MenuItem>
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setInventoryQuickEditTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={isQuickInventorySaving || !inventoryQuickEditTarget}
            onClick={() => {
              if (!inventoryQuickEditTarget) return;
              const draft = inventoryDrafts[inventoryQuickEditTarget.id];
              onQuickInventorySave(
                inventoryQuickEditTarget.sku || inventoryQuickEditTarget.id,
                Number(draft?.qty ?? getInventoryTotal(inventoryQuickEditTarget)),
                draft?.sourceCode ?? 'default'
              );
              setInventoryQuickEditTarget(null);
            }}
          >
            {isQuickInventorySaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

type InventoryTableProps = {
  items: ICommerceInventoryItem[];
  products: Array<{ id: string; name: string; sku?: string }>;
  locations: Array<{ id: string; fullName: string }>;
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: (input: { productId: number; locationId: number; quantity: number }) => void;
  onSave: (id: string, qty: number) => void;
  onDelete: (id: string) => void;
  isCreating?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (pageSize: number) => void;
  inventory?: any;
};

export function CommerceInventoryTable({
  items,
  products,
  locations,
  search,
  onSearchChange,
  onCreate,
  onSave,
  onDelete,
  isCreating = false,
  isSaving = false,
  isDeleting = false,
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  inventory,
}: InventoryTableProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newInventory, setNewInventory] = useState({
    productId: '',
    locationId: '',
    quantity: '0',
  });
  const [editItem, setEditItem] = useState<ICommerceInventoryItem | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [createTouched, setCreateTouched] = useState(false);
  const lowStockCount = items.filter(
    (item) => item.availableQuantity > 0 && item.availableQuantity <= 5
  ).length;
  const selectedCreateProduct = products.find((p) => p.id === newInventory.productId) || null;
  const selectedCreateLocation = locations.find((l) => l.id === newInventory.locationId) || null;
  const createQuantityNumber = Number(newInventory.quantity);
  const createProductError = createTouched && !newInventory.productId;
  const createLocationError = createTouched && !newInventory.locationId;
  const createQuantityError =
    createTouched &&
    (!newInventory.quantity.trim() ||
      !Number.isFinite(createQuantityNumber) ||
      createQuantityNumber < 0);
  const canCreateInventory =
    Boolean(newInventory.productId) &&
    Boolean(newInventory.locationId) &&
    Number.isFinite(createQuantityNumber) &&
    createQuantityNumber >= 0;

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Stack spacing={2.25} sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
        >
          <Box>
            <Typography variant="h5">Inventory</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Track stock by Odoo quant and update quantities per location.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }} useFlexGap>
              <Chip size="small" label={`${items.length} records`} variant="soft" color="default" />
              <Chip
                size="small"
                label={`${lowStockCount} low stock`}
                variant="soft"
                color={lowStockCount ? 'warning' : 'default'}
              />
            </Stack>
          </Box>
        </Stack>

        <TextField
          size="small"
          placeholder="Search inventory by product"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:magnifer-bold-duotone" width={18} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 360 }}
        />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <Autocomplete
            size="small"
            options={products}
            value={selectedCreateProduct}
            onChange={(_event, value) =>
              setNewInventory((prev) => ({ ...prev, productId: value?.id || '' }))
            }
            getOptionLabel={(option) => `${option.name}${option.sku ? ` (${option.sku})` : ''}`}
            sx={{ minWidth: 280 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product"
                placeholder="Search product"
                error={createProductError}
                helperText={createProductError ? 'Select a product.' : ' '}
              />
            )}
          />
          <Autocomplete
            size="small"
            options={locations}
            value={selectedCreateLocation}
            onChange={(_event, value) =>
              setNewInventory((prev) => ({ ...prev, locationId: value?.id || '' }))
            }
            getOptionLabel={(option) => option.fullName}
            sx={{ minWidth: 280 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Location"
                placeholder="Search location"
                error={createLocationError}
                helperText={createLocationError ? 'Select a location.' : ' '}
              />
            )}
          />
          <TextField
            size="small"
            label="Quantity"
            type="number"
            value={newInventory.quantity}
            onChange={(event) =>
              setNewInventory((prev) => ({ ...prev, quantity: event.target.value }))
            }
            sx={{ maxWidth: 130 }}
            error={createQuantityError}
            helperText={createQuantityError ? 'Enter a quantity >= 0.' : ' '}
          />
          <Button
            size="small"
            variant="contained"
            disabled={isCreating || !canCreateInventory}
            onClick={() => {
              setCreateTouched(true);
              if (!canCreateInventory) return;
              onCreate({
                productId: Number(newInventory.productId),
                locationId: Number(newInventory.locationId),
                quantity: createQuantityNumber,
              });
              setNewInventory({ productId: '', locationId: '', quantity: '0' });
              setCreateTouched(false);
            }}
          >
            {isCreating ? 'Creating...' : 'New inventory record'}
          </Button>
        </Stack>
      </Stack>

      <Divider />
      <TableContainer sx={{ maxHeight: 760 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Reserved</TableCell>
              <TableCell>Available</TableCell>
              <TableCell>Total Qty</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography variant="subtitle2">{item.productName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Quant ID: {item.id}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{item.locationName || '-'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={item.sourceCode || 'default'}
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{item.reservedQuantity}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      color: item.availableQuantity <= 5 ? 'warning.main' : 'success.main',
                      fontWeight: 600,
                    }}
                  >
                    {item.availableQuantity}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="Click to quick edit quantity" arrow>
                    <Chip
                      size="small"
                      label={item.quantity}
                      color="default"
                      variant="soft"
                      onClick={() => {
                        setEditItem(item);
                        setDrafts((prev) => ({ ...prev, [item.id]: String(item.quantity) }));
                      }}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 600,
                        '&:hover': { opacity: 0.72 },
                      }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setEditItem(item);
                        setDrafts((prev) => ({ ...prev, [item.id]: String(item.quantity) }));
                      }}
                    >
                      <Iconify icon="solar:pen-bold-duotone" width={20} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setPendingDeleteId(item.id)}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="subtitle1">No inventory records found.</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Try another search or verify stock quant data in Odoo.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalRows}
        page={page}
        onPageChange={(_event, nextPage) => onPageChange(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
        rowsPerPageOptions={[10, 20, 50]}
      />

      <Dialog open={Boolean(editItem)} onClose={() => setEditItem(null)} fullWidth maxWidth="xs">
        <DialogTitle>Quick edit quantity</DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          {editItem && (
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="subtitle1">{editItem.productName}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Location: {editItem.locationName || 'N/A'}
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="New Quantity"
                type="number"
                value={drafts[editItem.id] ?? ''}
                onChange={(event) =>
                  setDrafts((prev) => ({ ...prev, [editItem.id]: event.target.value }))
                }
                autoFocus
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItem(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={isSaving || !editItem}
            onClick={() => {
              if (editItem) {
                onSave(editItem.id, Number(drafts[editItem.id] ?? editItem.quantity));
                setEditItem(null);
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(pendingDeleteId)} onClose={() => setPendingDeleteId(null)}>
        <DialogTitle>Delete inventory record?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This will permanently delete quant record for{' '}
            {items.find((i) => i.id === pendingDeleteId)?.productName || 'this item'}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDeleteId(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={isDeleting || !pendingDeleteId}
            onClick={() => {
              if (!pendingDeleteId) return;
              onDelete(pendingDeleteId);
              setPendingDeleteId(null);
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

type ProductFormCardProps = {
  activeTab: 'general' | 'variants' | 'modifiers';
  onTabChange: (value: 'general' | 'variants' | 'modifiers') => void;
  productMethods: any;
  variantFields: Array<{ id: string }>;
  appendVariant: (value: ProductFormValues['variants'][number]) => void;
  removeVariant: (index: number) => void;
  modifierGroupFields: Array<{ id: string }>;
  appendModifierGroup: (value: ProductFormValues['modifierGroups'][number]) => void;
  removeModifierGroup: (index: number) => void;
  categories: Array<{ id: string; name: string }>;
  onUploadImages: (files: File[]) => void;
  isUploadingImages: boolean;
  onSubmit: () => void;
  isPending: boolean;
  editingId?: string | null;
  onCreateCategory: () => void;
  onCancelEdit?: () => void;
  modal?: boolean;
};

export function CommerceProductFormCard({
  activeTab,
  onTabChange,
  productMethods,
  variantFields,
  appendVariant,
  removeVariant,
  modifierGroupFields,
  appendModifierGroup,
  removeModifierGroup,
  categories,
  onUploadImages,
  isUploadingImages,
  onSubmit,
  isPending,
  editingId,
  onCreateCategory,
  onCancelEdit,
  modal = false,
}: ProductFormCardProps) {
  const isEditing = Boolean(editingId);
  const currentPhotoUrls = Array.isArray(productMethods.watch('photos'))
    ? productMethods.watch('photos')
    : [];

  const removePhoto = (indexToRemove: number) => {
    const nextUrls = currentPhotoUrls.filter((_: string, index: number) => index !== indexToRemove);
    productMethods.setValue('photos', nextUrls, { shouldDirty: true, shouldTouch: true });
  };
  return (
    <Card
      sx={{
        position: modal ? 'static' : 'sticky',
        top: modal ? 0 : 88,
        overflow: 'hidden',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        boxShadow: modal ? 'none' : undefined,
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: 'background.neutral',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Product Editor
            </Typography>
            <Typography variant="h6">{isEditing ? 'Edit Product' : 'Create Product'}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {isEditing
                ? `Modifying product ID: ${editingId}`
                : 'Build the product details, images, pricing, and options from one place.'}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={isEditing ? 'Editing' : 'Drafting'}
            color={isEditing ? 'warning' : 'default'}
            variant="soft"
          />
        </Stack>
      </Box>
      <Divider />
      <Form methods={productMethods} onSubmit={onSubmit}>
        <Stack spacing={3} sx={{ p: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_event, value) => onTabChange(value)}
            variant="fullWidth"
          >
            <Tab value="general" label="General" />
            <Tab value="variants" label="Variants" />
            <Tab value="modifiers" label="Modifiers" />
          </Tabs>

          {activeTab === 'general' && (
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                }}
              >
                <Typography variant="subtitle2">Core details</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Start with the identity of the product shoppers will see first.
                </Typography>
              </Box>
              <RHFTextField name="name" label="Product name" />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <RHFTextField name="sku" label="SKU" />
                <RHFTextField name="barcode" label="Barcode" />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                <Box sx={{ flexGrow: 1 }}>
                  <RHFTextField
                    name="categoryId"
                    label="Category"
                    select
                    helperText="Assign the product to an existing category."
                  >
                    <MenuItem value="">Uncategorized</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </RHFTextField>
                </Box>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={onCreateCategory}
                  sx={{ mt: { sm: 0.5 } }}
                >
                  New category
                </Button>
              </Stack>
              <RHFTextField name="description" label="Description" multiline rows={4} />
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                }}
              >
                <Typography variant="subtitle2">Pricing and stock</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Set the commercial numbers that drive storefront pricing and alerts.
                </Typography>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <RHFTextField
                  name="priceCents"
                  label="Base price (cents)"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <RHFTextField
                  name="compareAtPriceCents"
                  label="Compare at price (cents)"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <RHFTextField
                  name="costCents"
                  label="Cost per item (cents)"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <RHFTextField name="lowStockThreshold" label="Low stock threshold" type="number" />
              </Stack>
              <RHFTextField
                name="inventorySourceCode"
                label="Inventory Source Code"
                helperText="Inventory source code (default: default)"
              />
              <RHFTextField name="tagsText" label="Tags" placeholder="summer, bestseller, new" />
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="subtitle2">Product images</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Upload one or more images and they will be attached to this product.
                    </Typography>
                  </Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={
                      isUploadingImages ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <Iconify icon="solar:camera-add-bold-duotone" />
                      )
                    }
                    disabled={isUploadingImages}
                  >
                    Upload images
                    <input
                      hidden
                      multiple
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const files = Array.from(event.target.files || []);
                        if (files.length) {
                          onUploadImages(files);
                        }
                        event.currentTarget.value = '';
                      }}
                    />
                  </Button>
                </Stack>

                {currentPhotoUrls.length > 0 ? (
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                    {currentPhotoUrls.map((photoUrl: string, index: number) => (
                      <Card
                        key={`${photoUrl}-${index}`}
                        variant="outlined"
                        sx={{ width: 120, overflow: 'hidden', position: 'relative' }}
                      >
                        <Box
                          component="img"
                          src={photoUrl}
                          alt={`Product image ${index + 1}`}
                          sx={{
                            width: 1,
                            height: 96,
                            objectFit: 'cover',
                            display: 'block',
                            bgcolor: 'background.neutral',
                          }}
                        />
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ p: 1 }}
                        >
                          <Typography variant="caption" noWrap sx={{ maxWidth: 72 }}>
                            Image {index + 1}
                          </Typography>
                          <IconButton size="small" color="error" onClick={() => removePhoto(index)}>
                            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info">No product images uploaded yet.</Alert>
                )}
              </Stack>
              <RHFTextField name="status" label="Status" select>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </RHFTextField>
            </Stack>
          )}

          {activeTab === 'variants' && (
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => appendVariant({ name: '', sku: '', priceCents: 0, stock: 0 })}
              >
                Add variant
              </Button>
              {variantFields.map((field, index) => (
                <Card key={field.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <RHFTextField name={`variants.${index}.name`} label="Variant name" />
                      <RHFTextField name={`variants.${index}.sku`} label="Variant SKU" />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <RHFTextField
                        name={`variants.${index}.priceCents`}
                        label="Price (cents)"
                        type="number"
                      />
                      <RHFTextField name={`variants.${index}.stock`} label="Stock" type="number" />
                    </Stack>
                    <Button color="error" onClick={() => removeVariant(index)}>
                      Remove variant
                    </Button>
                  </Stack>
                </Card>
              ))}
              {variantFields.length === 0 && (
                <Alert severity="info">
                  Add variants if the product has different sizes or options.
                </Alert>
              )}
            </Stack>
          )}

          {activeTab === 'modifiers' && (
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() =>
                  appendModifierGroup({
                    name: '',
                    minSelected: 0,
                    maxSelected: 1,
                    modifiers: [{ name: '', priceCents: 0 }],
                  })
                }
              >
                Add modifier group
              </Button>

              {modifierGroupFields.map((group, groupIndex) => {
                const modifiers =
                  productMethods.watch(`modifierGroups.${groupIndex}.modifiers`) || [];

                return (
                  <Card key={group.id} variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <RHFTextField name={`modifierGroups.${groupIndex}.name`} label="Group name" />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <RHFTextField
                          name={`modifierGroups.${groupIndex}.minSelected`}
                          label="Minimum selected"
                          type="number"
                        />
                        <RHFTextField
                          name={`modifierGroups.${groupIndex}.maxSelected`}
                          label="Maximum selected"
                          type="number"
                        />
                      </Stack>
                      {modifiers.map((_: unknown, modifierIndex: number) => (
                        <Stack
                          key={`${group.id}-${modifierIndex}`}
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={2}
                        >
                          <RHFTextField
                            name={`modifierGroups.${groupIndex}.modifiers.${modifierIndex}.name`}
                            label="Modifier name"
                          />
                          <RHFTextField
                            name={`modifierGroups.${groupIndex}.modifiers.${modifierIndex}.priceCents`}
                            label="Extra price (cents)"
                            type="number"
                          />
                        </Stack>
                      ))}
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            const current = productMethods.getValues(
                              `modifierGroups.${groupIndex}.modifiers`
                            );
                            productMethods.setValue(`modifierGroups.${groupIndex}.modifiers`, [
                              ...(current || []),
                              { name: '', priceCents: 0 },
                            ]);
                          }}
                        >
                          Add modifier
                        </Button>
                        <Button color="error" onClick={() => removeModifierGroup(groupIndex)}>
                          Remove group
                        </Button>
                      </Stack>
                    </Stack>
                  </Card>
                );
              })}

              {modifierGroupFields.length === 0 && (
                <Alert severity="info">
                  Add modifier groups if customers can customize the product at checkout.
                </Alert>
              )}
            </Stack>
          )}

          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={isPending}
              size="large"
              sx={{ flexGrow: 1 }}
            >
              {isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : isEditing ? (
                'Update product'
              ) : (
                'Save product'
              )}
            </Button>
            {(isEditing || modal) && (
              <Button variant="outlined" color="inherit" size="large" onClick={onCancelEdit}>
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>
      </Form>
    </Card>
  );
}

type OrdersTableProps = {
  orders: LocalOrder[];
  search: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onView: (orderId: string) => void;
  onPay: (orderId: string) => void;
  onReceipt: (orderId: string) => void;
  onMarkProcessing: (orderId: string) => void;
  onMarkCompleted: (orderId: string) => void;
};

export function CommerceOrdersTable({
  orders,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onView,
  onPay,
  onReceipt: _onReceipt,
  onMarkProcessing,
  onMarkCompleted,
}: OrdersTableProps) {
  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        sx={{ p: 3 }}
      >
        <Box>
          <Typography variant="h5">Orders</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Review paid and pending orders created through the shop.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            size="small"
            placeholder="Search order or item"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All orders</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="unpaid">Unpaid</MenuItem>
          </TextField>
        </Stack>
      </Stack>
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Total</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2">{item.id.slice(0, 8)}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={item.status}
                    color={orderStatusColor(item.status)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={item.paymentStatus}
                    color={orderStatusColor(item.paymentStatus)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{fCurrency(item.totalAmountCents / 100)}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="soft" onClick={() => onView(item.id)}>
                      View
                    </Button>
                    {item.paymentStatus !== 'paid' ? (
                      <Button
                        size="small"
                        variant="soft"
                        color="primary"
                        onClick={() => onPay(item.id)}
                      >
                        Pay
                      </Button>
                    ) : item.status === 'processing' ? (
                      <Button
                        size="small"
                        variant="soft"
                        color="success"
                        onClick={() => onMarkCompleted(item.id)}
                      >
                        Complete
                      </Button>
                    ) : item.status !== 'completed' ? (
                      <Button
                        size="small"
                        variant="soft"
                        color="info"
                        onClick={() => onMarkProcessing(item.id)}
                      >
                        Process
                      </Button>
                    ) : null}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="subtitle1">No orders yet.</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Orders created through checkout will appear here.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

export function CommerceCategoriesTable({
  categories,
  search,
  onSearchChange,
  onCreate,
  onEdit,
  onDelete,
}: {
  categories: Array<{
    id: string;
    name: string;
    description?: string | null;
    isActive?: boolean;
    productCount?: number;
    activeProductCount?: number;
  }>;
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        sx={{ p: 3 }}
      >
        <Box>
          <Typography variant="h5">Categories</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Organize products into clear storefront sections.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            size="small"
            placeholder="Search categories"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { md: 260 } }}
          />
          <Button variant="contained" onClick={onCreate}>
            New category
          </Button>
        </Stack>
      </Stack>
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Products</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2">{category.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {category.activeProductCount || 0} active listing
                      {category.activeProductCount === 1 ? '' : 's'}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{category.description || 'No description'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={`${category.productCount || 0} linked`}
                    color={(category.productCount || 0) > 0 ? 'info' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={category.isActive === false ? 'Inactive' : 'Active'}
                    color={category.isActive === false ? 'default' : 'success'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" color="inherit" onClick={() => onEdit(category)}>
                      Edit
                    </Button>
                    <IconButton color="error" onClick={() => onDelete(category.id)}>
                      <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="subtitle1">No categories yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

export function CommerceCouponsTable({
  coupons,
  search,
  onCreate,
  onSearchChange,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  coupons: ICommerceCoupon[];
  search: string;
  onCreate: () => void;
  onSearchChange: (value: string) => void;
  onEdit: (coupon: ICommerceCoupon) => void;
  onToggleActive: (coupon: ICommerceCoupon) => void;
  onDelete: (id: string) => void;
}) {
  const activeCoupons = coupons.filter((coupon) => coupon.isActive).length;
  const scheduledCoupons = coupons.filter((coupon) => Boolean(coupon.expiresAt)).length;
  const exhaustedCoupons = coupons.filter(
    (coupon) => typeof coupon.maxUsage === 'number' && coupon.usedCount >= coupon.maxUsage
  ).length;

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        sx={{ p: 3 }}
      >
        <Box>
          <Typography variant="h5">Coupons</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Create promotions that shoppers can apply during checkout.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField
            size="small"
            placeholder="Search coupons"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { md: 260 } }}
          />
          <Button variant="contained" onClick={onCreate}>
            New coupon
          </Button>
        </Stack>
      </Stack>
      <Divider />
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'background.neutral',
          borderBottom: (theme) => `1px dashed ${theme.palette.divider}`,
        }}
      >
        <Grid container spacing={2}>
          {[
            {
              label: 'Visible coupons',
              value: coupons.length,
              helper: 'Coupons in the current search',
            },
            { label: 'Active offers', value: activeCoupons, helper: 'Coupons currently available' },
            {
              label: 'Scheduled or expiring',
              value: scheduledCoupons,
              helper: 'Coupons with an expiry date',
            },
            { label: 'Usage capped', value: exhaustedCoupons, helper: 'Coupons at max usage' },
          ].map((item) => (
            <Grid key={item.label} item xs={12} sm={6} md={3}>
              <Stack spacing={0.25}>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  {item.label}
                </Typography>
                <Typography variant="h5">{item.value}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {item.helper}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Rules</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2">{coupon.code}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {coupon.expiresAt
                        ? `Expires ${new Date(coupon.expiresAt).toLocaleDateString()}`
                        : 'No expiry date'}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      Minimum order:{' '}
                      <strong>
                        {coupon.minOrderCents > 0 ? fCurrency(coupon.minOrderCents / 100) : 'None'}
                      </strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {coupon.maxUsage ? `Max ${coupon.maxUsage} uses` : 'Unlimited uses'}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="outlined"
                    color={coupon.type === 'percent' ? 'info' : 'warning'}
                    label={coupon.type === 'percent' ? 'Percent' : 'Fixed amount'}
                  />
                </TableCell>
                <TableCell>
                  {coupon.type === 'percent'
                    ? `${coupon.value}%`
                    : fCurrency((coupon.value || 0) / 100)}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={coupon.isActive ? 'Active' : 'Inactive'}
                      color={coupon.isActive ? 'success' : 'default'}
                      variant="outlined"
                    />
                    {coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now() ? (
                      <Chip size="small" label="Expired" color="error" variant="outlined" />
                    ) : null}
                  </Stack>
                </TableCell>
                <TableCell>
                  {coupon.usedCount || 0}
                  {coupon.maxUsage ? ` / ${coupon.maxUsage}` : ''}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Button
                      size="small"
                      color="inherit"
                      onClick={async () => {
                        await navigator.clipboard.writeText(coupon.code);
                      }}
                    >
                      Copy
                    </Button>
                    <Button size="small" color="inherit" onClick={() => onEdit(coupon)}>
                      Edit
                    </Button>
                    <Button size="small" color="inherit" onClick={() => onToggleActive(coupon)}>
                      {coupon.isActive ? 'Pause' : 'Activate'}
                    </Button>
                    <IconButton color="error" onClick={() => onDelete(coupon.id)}>
                      <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {coupons.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="subtitle1">No coupons created.</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Build discounts with expiry dates, order minimums, and usage controls.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

export function CommerceCustomersTable({ customers }: { customers: any[] }) {
  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Customers</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Monitor your shopper community and their order history.
        </Typography>
      </Box>
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Orders</TableCell>
              <TableCell>Total Spent</TableCell>
              <TableCell>Last Order</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.email} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2">{c.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {c.email}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{c.orderCount}</TableCell>
                <TableCell>{fCurrency(c.totalSpentCents / 100)}</TableCell>
                <TableCell>{new Date(c.lastOrderAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 8, textAlign: 'center' }}>
                  <Typography variant="subtitle1">No customers yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

type SettingsPanelProps = {
  settingsMethods: any;
  resolvedShopKey: string;
  checkoutRouteKey: string;
  contactId?: string;
  storefrontCheckoutHref: string;
  onSubmit: () => void;
};

export function CommerceSettingsPanel({
  settingsMethods,
  resolvedShopKey,
  checkoutRouteKey,
  contactId,
  storefrontCheckoutHref,
  onSubmit,
}: SettingsPanelProps) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6">Store settings</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Tax and payment configuration are managed by backend services and your current
              commerce integration.
            </Typography>
          </Box>
          <Divider />
          <Form methods={settingsMethods} onSubmit={onSubmit}>
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFTextField name="shopName" label="Store name" />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <RHFTextField name="supportEmail" label="Support email" />
                <RHFTextField name="supportPhone" label="Support phone" />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <RHFTextField name="currency" label="Currency" />
              </Stack>
              <Alert severity="info">
                Tax rate and payment methods are read from the connected backend during checkout.
              </Alert>
              <Button type="submit" variant="contained">
                Save settings
              </Button>
            </Stack>
          </Form>
        </Card>
      </Grid>
      <Grid item xs={12} md={5}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Current storefront summary</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Store key: <strong>{resolvedShopKey}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Public route: <strong>{paths.public.shop(checkoutRouteKey, contactId)}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Checkout route: <strong>{storefrontCheckoutHref}</strong>
            </Typography>
            <Button
              component={Link}
              href={paths.public.onlineShop(resolvedShopKey, contactId)}
              variant="outlined"
            >
              Open storefront preview
            </Button>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}

type TablesPanelProps = {
  tables: Array<{
    id: string;
    name: string;
    seats: number;
    status?: 'available' | 'occupied' | 'reserved';
  }>;
  onAdd: () => void;
  onUpdate: (id: string, changes: any) => void;
  onRemove: (id: string) => void;
  onOpenGuide: () => void;
};

export function CommerceTablesPanel({
  tables,
  onAdd,
  onUpdate,
  onRemove,
  onOpenGuide,
}: TablesPanelProps) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5">Table Management</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Monitor and manage your restaurant floor plan in real-time.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:settings-bold" />}
            onClick={onOpenGuide}
          >
            Guide
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={onAdd}
          >
            New Table
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {tables.map((tableItem) => {
          const tableStatus = tableItem.status || 'available';
          const isOccupied = tableStatus === 'occupied';
          const isReserved = tableStatus === 'reserved';

          let statusColor: 'success' | 'error' | 'warning' | 'default' = 'success';
          if (isOccupied) statusColor = 'error';
          if (isReserved) statusColor = 'warning';

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tableItem.id}>
              <Card
                sx={{
                  p: 2.5,
                  textAlign: 'center',
                  border: (theme) =>
                    `2px solid ${isOccupied ? theme.palette.error.main : isReserved ? theme.palette.warning.main : 'transparent'}`,
                  bgcolor: (_theme) =>
                    isOccupied
                      ? 'rgba(255, 72, 66, 0.04)'
                      : isReserved
                        ? 'rgba(255, 171, 0, 0.04)'
                        : 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.customShadows.z12,
                  },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Chip
                    size="small"
                    label={tableStatus.toUpperCase()}
                    color={statusColor}
                    variant="outlined"
                    sx={{ fontWeight: 'bold', fontSize: 10 }}
                  />
                  <IconButton size="small" color="error" onClick={() => onRemove(tableItem.id)}>
                    <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                  </IconButton>
                </Stack>

                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    bgcolor: isOccupied
                      ? 'error.main'
                      : isReserved
                        ? 'warning.main'
                        : 'success.main',
                    color: 'common.white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    fontSize: 24,
                    fontWeight: '800',
                    boxShadow: (theme) => `0 8px 16px 0 ${theme.palette[statusColor].main}40`,
                  }}
                >
                  {tableItem.name.replace(/\D/g, '') || tableItem.name[0]}
                </Box>

                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {tableItem.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Capacity: {tableItem.seats} Seats
                </Typography>

                <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    size="small"
                    variant={isOccupied ? 'outlined' : 'soft'}
                    color={isOccupied ? 'inherit' : 'primary'}
                    onClick={() =>
                      onUpdate(tableItem.id, { status: isOccupied ? 'available' : 'occupied' })
                    }
                  >
                    {isOccupied ? 'Clear' : 'Settle'}
                  </Button>
                  <Button
                    size="small"
                    variant="soft"
                    color="inherit"
                    onClick={() => {
                      const nextStatus = tableItem.status === 'reserved' ? 'available' : 'reserved';
                      onUpdate(tableItem.id, { status: nextStatus });
                    }}
                  >
                    <Iconify
                      icon={isReserved ? 'solar:calendar-cross-bold' : 'solar:calendar-mark-bold'}
                      width={18}
                    />
                  </Button>
                </Stack>
              </Card>
            </Grid>
          );
        })}

        {tables.length === 0 && (
          <Grid item xs={12}>
            <Card
              sx={{
                py: 10,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'transparent',
              }}
            >
              <Iconify
                icon="solar:tuning-square-2-bold-duotone"
                width={64}
                sx={{ color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                No tables configured
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }} onClick={onAdd}>
                Create First Table
              </Button>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

type CartSummaryProps = {
  cartItems: CartLine[];
  appliedCouponCode: string;
  onCouponChange: (value: string) => void;
  activeCouponCode?: string;
  couponMessage?: string;
  couponSeverity?: 'success' | 'warning' | 'info' | 'error';
  cartSubtotalCents: number;
  discountCents: number;
  taxAmountCents: number;
  cartTotalCents: number;
  storefrontCheckoutHref: string;
  isCheckoutMode: boolean;
  checkoutDisabled?: boolean;
  checkoutLabel?: string;
  onClear: () => void;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onRemoveLine: (lineId: string) => void;
};

export function CommerceCartSummary({
  cartItems,
  appliedCouponCode,
  onCouponChange,
  activeCouponCode,
  couponMessage,
  couponSeverity,
  cartSubtotalCents,
  discountCents,
  taxAmountCents,
  cartTotalCents,
  storefrontCheckoutHref,
  isCheckoutMode,
  checkoutDisabled,
  checkoutLabel,
  onClear,
  onUpdateQuantity,
  onRemoveLine,
}: CartSummaryProps) {
  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Cart</Typography>
        {cartItems.length > 0 && (
          <Button color="inherit" onClick={onClear}>
            Clear
          </Button>
        )}
      </Stack>

      {cartItems.length === 0 ? (
        <Alert severity="info">Your cart is empty. Add a product to start checkout.</Alert>
      ) : (
        <Stack spacing={2}>
          {cartItems.map((item) => (
            <Card key={item.id} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    {item.variantName && (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {item.variantName}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="subtitle2">
                    {fCurrency((item.unitPriceCents * item.quantity) / 100)}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <Typography variant="body2">{item.quantity}</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <Button size="small" color="error" onClick={() => onRemoveLine(item.id)}>
                    Remove
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}

          <Divider />

          <TextField
            size="small"
            label="Coupon code"
            value={appliedCouponCode}
            onChange={(event) => onCouponChange(event.target.value)}
            fullWidth
          />
          {couponMessage && <Alert severity={couponSeverity || 'info'}>{couponMessage}</Alert>}
          {activeCouponCode && (
            <Chip
              size="small"
              color="success"
              variant="outlined"
              label={`Coupon applied: ${activeCouponCode.toUpperCase()}`}
              sx={{ alignSelf: 'flex-start' }}
            />
          )}

          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Subtotal
              </Typography>
              <Typography variant="body2">{fCurrency(cartSubtotalCents / 100)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Discount
              </Typography>
              <Typography variant="body2">-{fCurrency(discountCents / 100)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Tax
              </Typography>
              <Typography variant="body2">{fCurrency(taxAmountCents / 100)}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1">Estimated total</Typography>
              <Typography variant="subtitle1">{fCurrency(cartTotalCents / 100)}</Typography>
            </Stack>
          </Stack>

          {!isCheckoutMode && (
            <Button
              component={Link}
              href={storefrontCheckoutHref}
              variant="contained"
              fullWidth
              disabled={checkoutDisabled}
            >
              {checkoutLabel || 'Checkout'}
            </Button>
          )}
        </Stack>
      )}
    </Card>
  );
}

type StorefrontGridProps = {
  shopName: string;
  search: string;
  onSearchChange: (value: string) => void;
  products: ICommerceProduct[];
  shopPath?: string;
  resolvedShopKey: string;
  onAddToCart: (product: ICommerceProduct) => void;
  cartSummary: React.ReactNode;
};

export function CommerceStorefrontGrid({
  shopName,
  search,
  onSearchChange,
  products,
  shopPath,
  resolvedShopKey,
  onAddToCart,
  cartSummary,
}: StorefrontGridProps) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <Box>
                <Typography variant="h4">{shopName}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Browse the live catalog and add products directly to your cart.
                </Typography>
              </Box>
              <TextField
                size="small"
                placeholder="Search catalog"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:magnifer-bold-duotone" width={18} />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: { md: 280 } }}
              />
            </Stack>
          </Card>

          <Grid container spacing={3}>
            {products.map((product) => {
              const isPurchasable = isProductPurchasable(product);
              const stockCount = getAvailableStock(product);
              const hasTrackedInventory = Boolean(product.variants?.length);

              return (
                <Grid item xs={12} sm={6} key={product.id}>
                  <Card sx={{ p: 2.5, height: '100%' }}>
                    <Stack spacing={2} sx={{ height: '100%' }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={2}
                      >
                        <Box>
                          <Typography variant="h6">{product.name}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {product.description || 'Freshly added to the catalog.'}
                          </Typography>
                        </Box>
                        <Chip
                          label={
                            !isPurchasable && product.status && product.status !== 'active'
                              ? product.status.toUpperCase()
                              : hasTrackedInventory
                                ? `${inventoryStatus(getInventoryTotal(product)).label}${stockCount ? ` (${stockCount})` : ''}`
                                : 'Available'
                          }
                          color={
                            !isPurchasable && product.status && product.status !== 'active'
                              ? 'default'
                              : hasTrackedInventory
                                ? inventoryStatus(getInventoryTotal(product)).color
                                : 'success'
                          }
                          variant="outlined"
                        />
                      </Stack>

                      <Box sx={{ flexGrow: 1 }} />

                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                          {fCurrency(getBasePrice(product) / 100)}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            color="inherit"
                            component={Link}
                            href={getProductHref(shopPath, resolvedShopKey, product.id)}
                          >
                            Details
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => onAddToCart(product)}
                            disabled={!isPurchasable}
                          >
                            {isPurchasable ? 'Add' : 'Unavailable'}
                          </Button>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>
              );
            })}
            {products.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">No products matched the current search.</Alert>
              </Grid>
            )}
          </Grid>
        </Stack>
      </Grid>

      <Grid item xs={12} md={4}>
        {cartSummary}
      </Grid>
    </Grid>
  );
}

type ProductDetailProps = {
  selectedProduct?: ICommerceProduct;
  selectedVariantId: string;
  onVariantChange: (value: string) => void;
  detailQuantity: number;
  detailPriceCents: number;
  availableStock: number;
  onQuantityChange: (value: number) => void;
  onAddToCart: () => void;
  shopPath?: string;
  resolvedShopKey: string;
  contactId?: string;
  cartSummary: React.ReactNode;
};

export function CommerceProductDetail({
  selectedProduct,
  selectedVariantId,
  onVariantChange,
  detailQuantity,
  detailPriceCents,
  availableStock,
  onQuantityChange,
  onAddToCart,
  shopPath,
  resolvedShopKey,
  contactId,
  cartSummary,
}: ProductDetailProps) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        {!selectedProduct ? (
          <Alert severity="warning">The requested product could not be found for this shop.</Alert>
        ) : (
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h3">{selectedProduct.name}</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                  {selectedProduct.description || 'No description has been added yet.'}
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                <Card variant="outlined" sx={{ flex: 1, p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Product options
                  </Typography>
                  {selectedProduct.variants?.length ? (
                    <TextField
                      select
                      label="Variant"
                      value={selectedVariantId}
                      onChange={(event) => onVariantChange(event.target.value)}
                      fullWidth
                    >
                      {selectedProduct.variants.map((variant) => (
                        <MenuItem key={variant.id} value={variant.id}>
                          {variant.name} - {fCurrency(variant.priceCents / 100)}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Alert severity="info">This product uses a single base price.</Alert>
                  )}
                </Card>

                <Card variant="outlined" sx={{ flex: 1, p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Available modifiers
                  </Typography>
                  {selectedProduct.modifierGroups?.length ? (
                    <Stack spacing={1.5}>
                      {selectedProduct.modifierGroups.map((group) => (
                        <Box key={group.id}>
                          <Typography variant="subtitle2">{group.name}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {group.modifiers.map((modifier) => modifier.name).join(', ')}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info">No add-ons are configured for this product.</Alert>
                  )}
                </Card>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Quantity"
                  type="number"
                  value={detailQuantity}
                  onChange={(event) =>
                    onQuantityChange(Math.max(1, Number(event.target.value) || 1))
                  }
                  sx={{ width: 120 }}
                  inputProps={{ min: 1, max: Math.max(1, availableStock) }}
                />
                <Typography variant="h5">
                  {fCurrency((detailPriceCents * detailQuantity) / 100)}
                </Typography>
              </Stack>
              <Alert severity={availableStock > 0 ? 'info' : 'warning'}>
                {availableStock > 0
                  ? availableStock >= 999
                    ? 'This product is available for purchase.'
                    : `${availableStock} units available for this selection.`
                  : 'This selection is currently out of stock.'}
              </Alert>

              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={onAddToCart} disabled={availableStock <= 0}>
                  Add to cart
                </Button>
                <Button
                  component={Link}
                  href={getStorefrontHomeHref(shopPath, resolvedShopKey, contactId)}
                >
                  Back to shop
                </Button>
              </Stack>
            </Stack>
          </Card>
        )}
      </Grid>

      <Grid item xs={12} md={4}>
        {cartSummary}
      </Grid>
    </Grid>
  );
}

type CheckoutPanelProps = {
  checkoutMethods: any;
  onSubmit: () => void;
  isPending: boolean;
  cartItemsLength: number;
  cartSummary: React.ReactNode;
};

export function CommerceCheckoutPanel({
  checkoutMethods,
  onSubmit,
  isPending,
  cartItemsLength,
  cartSummary,
}: CheckoutPanelProps) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5">Checkout</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Review the cart and capture delivery details for this order.
            </Typography>
          </Box>
          <Divider />
          <Form methods={checkoutMethods} onSubmit={onSubmit}>
            <Stack spacing={3} sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <RHFTextField name="customerName" label="Customer name" />
                <RHFTextField name="email" label="Email" />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <RHFTextField name="phone" label="Phone" />
                <RHFTextField name="country" label="Country" />
              </Stack>
              <RHFTextField name="line1" label="Address line" />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <RHFTextField name="city" label="City" />
                <RHFTextField name="state" label="State" />
              </Stack>
              <RHFTextField name="postalCode" label="Postal code" />

              <Button
                type="submit"
                variant="contained"
                disabled={isPending || cartItemsLength === 0}
              >
                {isPending ? <CircularProgress size={20} color="inherit" /> : 'Create order'}
              </Button>
            </Stack>
          </Form>
        </Card>
      </Grid>
      <Grid item xs={12} md={5}>
        {cartSummary}
      </Grid>
    </Grid>
  );
}

type OrderCardProps = {
  selectedOrder?: LocalOrder;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
  primaryLabel?: string;
  onSecondaryAction?: () => void;
  secondaryLabel?: string;
  mode: 'payment' | 'receipt';
  shopPath?: string;
  resolvedShopKey: string;
  contactId?: string;
};

export function CommerceOrderCard({
  selectedOrder,
  onPrimaryAction,
  primaryDisabled,
  primaryLabel,
  onSecondaryAction,
  secondaryLabel,
  mode,
  shopPath,
  resolvedShopKey,
  contactId,
}: OrderCardProps) {
  const isReceipt = mode === 'receipt';

  return (
    <Card sx={{ p: 3 }}>
      {!selectedOrder ? (
        <Alert severity="warning">
          {isReceipt
            ? 'No receipt could be generated because the order was not found.'
            : 'We could not find the requested order for payment.'}
        </Alert>
      ) : (
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">{isReceipt ? 'Receipt' : 'Order payment'}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {isReceipt ? 'Receipt for order' : 'Order'} #{selectedOrder.id.slice(0, 8)}
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            {selectedOrder.items.map((item) => (
              <Stack key={item.id} direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2">
                  {item.productName} x {item.quantity}
                </Typography>
                <Typography variant="body2">
                  {fCurrency((item.unitPriceCents * item.quantity) / 100)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Divider />

          {isReceipt && (
            <>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1">Payment status</Typography>
                <Chip
                  size="small"
                  label={selectedOrder.paymentStatus}
                  color={orderStatusColor(selectedOrder.paymentStatus)}
                  variant="outlined"
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1">Order status</Typography>
                <Chip
                  size="small"
                  label={selectedOrder.status}
                  color={orderStatusColor(selectedOrder.status)}
                  variant="outlined"
                />
              </Stack>
            </>
          )}

          <Stack direction="row" justifyContent="space-between">
            <Typography variant={isReceipt ? 'h6' : 'subtitle1'}>Total</Typography>
            <Typography variant={isReceipt ? 'h6' : 'subtitle1'}>
              {fCurrency(selectedOrder.totalAmountCents / 100)}
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {primaryLabel && onPrimaryAction && (
              <Button
                variant="contained"
                color={isReceipt ? 'primary' : 'success'}
                onClick={onPrimaryAction}
                disabled={primaryDisabled}
              >
                {primaryLabel}
              </Button>
            )}
            {secondaryLabel && onSecondaryAction && (
              <Button color="inherit" onClick={onSecondaryAction}>
                {secondaryLabel}
              </Button>
            )}
            {isReceipt && (
              <Button
                component={Link}
                href={getStorefrontHomeHref(shopPath, resolvedShopKey, contactId)}
              >
                Continue shopping
              </Button>
            )}
          </Stack>
        </Stack>
      )}
    </Card>
  );
}

type DashboardModulesProps = {
  modules?: Array<{ label: string; value: CommerceDashboardModule; icon?: string }>;
  currentModule: CommerceDashboardModule;
  onModuleChange: (value: CommerceDashboardModule) => void;
  summaryCards: React.ReactNode;
  productsTable: React.ReactNode;
  productForm: React.ReactNode;
  categoriesTable: React.ReactNode;
  couponsTable: React.ReactNode;
  ordersTable: React.ReactNode;
  customersTable: React.ReactNode;
  membershipsTable: React.ReactNode;
  posPanel: React.ReactNode;
  kdsPanel: React.ReactNode;
  cfdPanel: React.ReactNode;
  kioskPanel: React.ReactNode;
  inventoryPanel: React.ReactNode;
  designerPanel: React.ReactNode;
  tablesPanel: React.ReactNode;
  settingsPanel: React.ReactNode;
};

export function CommerceDashboardModules({
  modules = COMMERCE_DASHBOARD_MODULES,
  currentModule,
  onModuleChange,
  summaryCards,
  productsTable,
  productForm: _productForm,
  categoriesTable,
  couponsTable,
  ordersTable,
  customersTable,
  membershipsTable,
  posPanel,
  kdsPanel,
  cfdPanel,
  kioskPanel,
  inventoryPanel,
  designerPanel,
  tablesPanel,
  settingsPanel,
}: DashboardModulesProps) {
  return (
    <Stack spacing={4}>
      <Tabs
        value={currentModule}
        onChange={(_event, value) => onModuleChange(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {modules.map((moduleItem) => (
          <Tab key={moduleItem.value} value={moduleItem.value} label={moduleItem.label} />
        ))}
      </Tabs>

      {currentModule === 'dashboard' && summaryCards}

      {currentModule === 'pos' && posPanel}
      {currentModule === 'products' && productsTable}
      {currentModule === 'inventory' && inventoryPanel}

      {currentModule === 'categories' && categoriesTable}
      {currentModule === 'coupons' && couponsTable}
      {currentModule === 'orders' && ordersTable}
      {currentModule === 'customers' && customersTable}
      {currentModule === 'memberships' && membershipsTable}

      {currentModule === 'kds' && kdsPanel}
      {currentModule === 'cfd' && cfdPanel}
      {currentModule === 'kiosk' && kioskPanel}
      {currentModule === 'designer' && designerPanel}

      {currentModule === 'tables' && tablesPanel}
      {currentModule === 'settings' && settingsPanel}
    </Stack>
  );
}

export function CommerceCategoryDialog({
  open,
  onClose,
  methods,
  editingId,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  methods: any;
  editingId?: string | null;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const isEditing = Boolean(editingId);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? 'Edit category' : 'New category'}</DialogTitle>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <RHFTextField name="name" label="Category name" />
            <RHFTextField name="description" label="Description" multiline rows={3} />
            <RHFTextField name="isActive" label="Status" select>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </RHFTextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : isEditing ? (
              'Save changes'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

export function CommerceProductDetailDialog({
  open,
  onClose,
  title,
  content,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ p: { xs: 1.5, md: 2 } }}>{content}</DialogContent>
    </Dialog>
  );
}

export function CommerceCouponDialog({
  open,
  onClose,
  methods,
  editingId,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  methods: any;
  editingId?: string | null;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const isEditing = Boolean(editingId);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? 'Edit coupon' : 'New coupon'}</DialogTitle>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <RHFTextField name="code" label="Coupon code" placeholder="WELCOME10" />
            <RHFTextField name="type" label="Discount type" select>
              <MenuItem value="percent">Percent</MenuItem>
              <MenuItem value="fixed">Fixed</MenuItem>
            </RHFTextField>
            <RHFTextField
              name="value"
              label="Value"
              type="number"
              helperText="Percent coupons use whole numbers like 10. Fixed coupons use cents."
            />
            <RHFTextField name="minOrderCents" label="Minimum order (cents)" type="number" />
            <RHFTextField
              name="maxUsage"
              label="Maximum redemptions"
              type="number"
              helperText="Leave blank for unlimited usage."
            />
            <RHFTextField
              name="expiresAt"
              label="Expires at"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
            />
            <RHFTextField name="isActive" label="Status" select>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </RHFTextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? (
              <CircularProgress size={20} color="inherit" />
            ) : isEditing ? (
              'Save changes'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

export function CommerceOrderDetailDialog({
  open,
  onClose,
  order,
  onStatusUpdate,
  onReceipt: _onReceipt,
}: {
  open: boolean;
  onClose: () => void;
  order?: any;
  onStatusUpdate: (id: string, status: string, paymentStatus?: string) => void;
  onReceipt: (id: string) => void;
}) {
  if (!order) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Order Detail #{order.id.slice(0, 8)}
        <Chip
          label={order.status.toUpperCase()}
          color={orderStatusColor(order.status)}
          size="small"
        />
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Customer Information
            </Typography>
            <Stack spacing={1}>
              <Typography variant="subtitle2">
                Name:{' '}
                <Box component="span" sx={{ fontWeight: 'normal' }}>
                  {(order.shippingAddress as any)?.customerName}
                </Box>
              </Typography>
              <Typography variant="subtitle2">
                Email:{' '}
                <Box component="span" sx={{ fontWeight: 'normal' }}>
                  {(order.shippingAddress as any)?.email}
                </Box>
              </Typography>
              <Typography variant="subtitle2">
                Phone:{' '}
                <Box component="span" sx={{ fontWeight: 'normal' }}>
                  {(order.shippingAddress as any)?.phone || 'N/A'}
                </Box>
              </Typography>
              <Typography variant="subtitle2">
                Address:{' '}
                <Box
                  component="span"
                  sx={{ fontWeight: 'normal' }}
                >{`${(order.shippingAddress as any)?.line1}, ${(order.shippingAddress as any)?.city}, ${(order.shippingAddress as any)?.postalCode}`}</Box>
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Order Summary
            </Typography>
            <Stack spacing={1.5}>
              {order.items.map((item: any) => (
                <Stack key={item.id} direction="row" justifyContent="space-between">
                  <Typography variant="body2">
                    {item.productName} x {item.quantity}
                  </Typography>
                  <Typography variant="subtitle2">
                    {fCurrency((item.unitPriceCents * item.quantity) / 100)}
                  </Typography>
                </Stack>
              ))}
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1">Total</Typography>
                <Typography variant="h6" color="primary">
                  {fCurrency(order.totalAmountCents / 100)}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          onClick={() => onReceipt(order.id)}
          startIcon={<Iconify icon="solar:printer-bold" />}
        >
          Print Receipt
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {order.paymentStatus !== 'paid' ? (
          <Button
            variant="contained"
            color="success"
            onClick={() => onStatusUpdate(order.id, 'processing', 'paid')}
          >
            Mark Paid & Process
          </Button>
        ) : order.status === 'processing' ? (
          <Button
            variant="contained"
            color="success"
            onClick={() => onStatusUpdate(order.id, 'completed')}
          >
            Mark Completed
          </Button>
        ) : order.status !== 'completed' ? (
          <Button
            variant="contained"
            color="info"
            onClick={() => onStatusUpdate(order.id, 'processing')}
          >
            Start Processing
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

export function CommerceTableGuideDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Table workflow</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mt: 1 }}>
          The table list is now editable and stored per shop. A visual floor-plan editor can be
          added later without changing the stored table records.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function CommerceMembershipsTable() {
  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Membership Contracts</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Manage digital membership tiers, contracts, and automated renewal triggers.
        </Typography>
      </Box>
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Membership Tier</TableCell>
              <TableCell>Contract Status</TableCell>
              <TableCell>Revenue Impact</TableCell>
              <TableCell>Active Members</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              {
                name: 'Elite Performance (Annual)',
                status: 'active',
                price: '$1,200',
                members: 42,
              },
              { name: 'Standard Monthly', status: 'active', price: '$99', members: 128 },
              { name: 'Trial Pass (14 Days)', status: 'draft', price: '$0', members: 0 },
            ].map((membership) => (
              <TableRow key={membership.name} hover>
                <TableCell>
                  <Typography variant="subtitle2">{membership.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Digital Contract ID: MC-8201
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={membership.status.toUpperCase()}
                    color={membership.status === 'active' ? 'success' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{membership.price}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Per cycle
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="h6">{membership.members}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Button size="small" color="inherit">
                    Manage Tiers
                  </Button>
                  <Button size="small" color="inherit">
                    Edit Contract
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
