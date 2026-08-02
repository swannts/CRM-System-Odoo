import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchOdooConnection,
  fetchContacts,
  fetchCompanies,
  fetchLeads,
  fetchOpportunities,
  fetchSalesOrders,
  fetchInvoices,
  fetchProducts,
  fetchInventory,
  connectOdooThunk,
  disconnectOdooThunk,
  syncMagentoToOdooThunk,
  selectOdoo,
} from 'src/store/slices/odoo-slice';
import { OdooListParams, OdooSyncOptions, OdooConnectInput } from 'src/types/odoo';

export function useOdoo() {
  const dispatch = useAppDispatch();
  const odooState = useAppSelector(selectOdoo);

  const connection = useMemo(() => odooState.connection, [odooState.connection]);
  const connected = useMemo(() => connection.data?.connected ?? false, [connection]);

  const actions = useMemo(() => ({
    fetchConnection: () => dispatch(fetchOdooConnection()),
    fetchContacts: (params?: OdooListParams) => dispatch(fetchContacts(params)),
    fetchCompanies: (params?: OdooListParams) => dispatch(fetchCompanies(params)),
    fetchLeads: (params?: OdooListParams) => dispatch(fetchLeads(params)),
    fetchOpportunities: (params?: OdooListParams) => dispatch(fetchOpportunities(params)),
    fetchSalesOrders: (params?: OdooListParams) => dispatch(fetchSalesOrders(params)),
    fetchInvoices: (params?: OdooListParams) => dispatch(fetchInvoices(params)),
    fetchProducts: (params?: OdooListParams) => dispatch(fetchProducts(params)),
    fetchInventory: (params?: OdooListParams) => dispatch(fetchInventory(params)),
    connect: (input: OdooConnectInput) => dispatch(connectOdooThunk(input)).unwrap(),
    disconnect: () => dispatch(disconnectOdooThunk()).unwrap(),
    syncMagento: (type: 'all' | 'customers' | 'orders', options?: OdooSyncOptions) =>
      dispatch(syncMagentoToOdooThunk({ type, options })).unwrap(),
  }), [dispatch]);

  return {
    ...odooState,
    connected,
    ...actions,
  };
}
