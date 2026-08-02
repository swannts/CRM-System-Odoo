import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchSalesSummary,
  fetchSalesOrders,
  fetchSalesLeads,
  fetchSalesOpportunities,
  fetchSalesActivities,
  fetchSalesAnalytics,
  fetchSalesStages,
  createOpportunityThunk,
  updateOpportunityThunk,
  updateOpportunityStageThunk,
  createSalesActivityThunk,
  completeSalesActivityThunk,
  deleteSalesActivityThunk,
  deleteSalesOpportunityThunk,
  createOpportunityNoteThunk,
  previewSyncThunk,
  runSyncThunk,
  linkOrderToOpportunityThunk,
  selectSales,
} from 'src/store/slices/sales-slice';
import type { SalesFilters, SalesOpportunity, SalesStage, SalesActivity } from 'src/sections/sales/types';

export function useSalesDashboard() {
  const dispatch = useAppDispatch();
  const sales = useAppSelector(selectSales);

  const loadSummary = useCallback((filters?: SalesFilters) => {
    dispatch(fetchSalesSummary(filters));
  }, [dispatch]);

  const loadOrders = useCallback((filters?: SalesFilters) => {
    dispatch(fetchSalesOrders(filters));
  }, [dispatch]);

  const loadLeads = useCallback((filters?: SalesFilters) => {
    dispatch(fetchSalesLeads(filters));
  }, [dispatch]);

  const loadOpportunities = useCallback((filters?: SalesFilters) => {
    dispatch(fetchSalesOpportunities(filters));
  }, [dispatch]);

  const loadActivities = useCallback((filters?: SalesFilters) => {
    dispatch(fetchSalesActivities(filters));
  }, [dispatch]);

  const loadAnalytics = useCallback((filters?: SalesFilters) => {
    dispatch(fetchSalesAnalytics(filters));
  }, [dispatch]);

  const loadStages = useCallback(() => {
    dispatch(fetchSalesStages());
  }, [dispatch]);

  const createOpportunity = useCallback(async (payload: any) => {
    return dispatch(createOpportunityThunk(payload)).unwrap();
  }, [dispatch]);

  const updateOpportunity = useCallback(async (id: string, payload: Partial<SalesOpportunity>) => {
    return dispatch(updateOpportunityThunk({ id, payload })).unwrap();
  }, [dispatch]);

  const updateStage = useCallback(async (id: string, stage: SalesStage, stageId?: number) => {
    return dispatch(updateOpportunityStageThunk({ id, stage, stageId })).unwrap();
  }, [dispatch]);

  const createActivity = useCallback(async (opportunityId: string, payload: { type: SalesActivity['type']; title: string; dueDate?: string }) => {
    return dispatch(createSalesActivityThunk({ opportunityId, payload })).unwrap();
  }, [dispatch]);

  const completeActivity = useCallback(async (id: string) => {
    return dispatch(completeSalesActivityThunk(id)).unwrap();
  }, [dispatch]);

  const deleteActivity = useCallback(async (id: string) => {
    return dispatch(deleteSalesActivityThunk(id)).unwrap();
  }, [dispatch]);

  const deleteOpportunity = useCallback(async (id: string) => {
    return dispatch(deleteSalesOpportunityThunk(id)).unwrap();
  }, [dispatch]);

  const createNote = useCallback(async (id: string | number, body: string) => {
    return dispatch(createOpportunityNoteThunk({ id, body })).unwrap();
  }, [dispatch]);

  const previewSync = useCallback(async () => {
    return dispatch(previewSyncThunk()).unwrap();
  }, [dispatch]);

  const runSync = useCallback(async () => {
    return dispatch(runSyncThunk()).unwrap();
  }, [dispatch]);

  const linkOrder = useCallback(async (orderId: string, opportunityId: string) => {
    return dispatch(linkOrderToOpportunityThunk({ orderId, opportunityId })).unwrap();
  }, [dispatch]);

  return {
    ...sales,
    loadSummary,
    loadOrders,
    loadLeads,
    loadOpportunities,
    loadActivities,
    loadAnalytics,
    loadStages,
    createOpportunity,
    updateOpportunity,
    updateStage,
    createActivity,
    completeActivity,
    deleteActivity,
    deleteOpportunity,
    createNote,
    previewSync,
    runSync,
    linkOrder,
  };
}
