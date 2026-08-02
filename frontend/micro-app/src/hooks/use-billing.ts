import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchBillingInvoices,
  fetchInvoiceById,
  fetchBillingSummary,
  fetchBillingGraph,
  fetchBillingReconciliation,
  postInvoiceThunk,
  deleteInvoiceThunk,
  selectBilling,
} from 'src/store/slices/billing-slice';

export function useInvoices(params?: any) {
  const dispatch = useAppDispatch();
  const { invoices } = useAppSelector(selectBilling);

  useMemo(() => {
    dispatch(fetchBillingInvoices(params));
  }, [dispatch, params]);

  return invoices;
}

export function useInvoice(id: string) {
  const dispatch = useAppDispatch();
  const { currentInvoice } = useAppSelector(selectBilling);

  useMemo(() => {
    if (id) dispatch(fetchInvoiceById(id));
  }, [dispatch, id]);

  return currentInvoice;
}

export function useBillingSummary() {
  const dispatch = useAppDispatch();
  const { summary } = useAppSelector(selectBilling);

  useMemo(() => {
    dispatch(fetchBillingSummary());
  }, [dispatch]);

  return summary;
}

export function useBillingGraph(months: number = 6) {
  const dispatch = useAppDispatch();
  const { summary } = useAppSelector(selectBilling);

  useMemo(() => {
    dispatch(fetchBillingGraph(months));
  }, [dispatch, months]);

  return summary;
}

export function useBillingReconciliation() {
  const dispatch = useAppDispatch();
  const { reconciliation } = useAppSelector(selectBilling);

  useMemo(() => {
    dispatch(fetchBillingReconciliation());
  }, [dispatch]);

  return reconciliation;
}

export function usePostInvoice() {
  const dispatch = useAppDispatch();
  return {
    mutate: (id: string) => dispatch(postInvoiceThunk(id)),
  };
}

export function useDeleteInvoice() {
  const dispatch = useAppDispatch();
  return {
    mutate: (id: string) => dispatch(deleteInvoiceThunk(id)),
  };
}
