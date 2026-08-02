import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchMagentoOrders,
  fetchMagentoStores,
  fetchMagentoProducts,
  fetchMagentoCustomers,
  fetchMagentoConnection,
  fetchMagentoDownstreamHealth,
  connectMagentoThunk,
  disconnectMagentoThunk,
  syncMagentoOrdersThunk,
  syncMagentoCustomersThunk,
  selectMagento,
} from 'src/store/slices/magento-slice';

export function useMagento() {
  const dispatch = useAppDispatch();
  const magentoState = useAppSelector(selectMagento);

  const actions = useMemo(() => ({
    fetchConnection: () => dispatch(fetchMagentoConnection()),
    fetchStores: () => dispatch(fetchMagentoStores()),
    fetchOrders: (params?: any) => dispatch(fetchMagentoOrders(params)),
    fetchProducts: (params?: any) => dispatch(fetchMagentoProducts(params)),
    fetchCustomers: (params?: any) => dispatch(fetchMagentoCustomers(params)),
    fetchHealth: () => dispatch(fetchMagentoDownstreamHealth()),
    connect: (input: any) => dispatch(connectMagentoThunk(input)).unwrap(),
    disconnect: () => dispatch(disconnectMagentoThunk()).unwrap(),
    syncOrders: (options?: any) => dispatch(syncMagentoOrdersThunk(options)).unwrap(),
    syncCustomers: (options?: any) => dispatch(syncMagentoCustomersThunk(options)).unwrap(),
  }), [dispatch]);

  return {
    ...magentoState,
    ...actions,
  };
}
