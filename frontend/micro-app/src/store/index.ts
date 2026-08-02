import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import odooReducer from './slices/odoo-slice';
import magentoReducer from './slices/magento-slice';
import commerceReducer from './slices/commerce-slice';
import billingReducer from './slices/billing-slice';
import bookingReducer from './slices/booking-slice';
import dashboardReducer from './slices/dashboard-slice';
import calendarReducer from './slices/calendar-slice';
import financeReducer from './slices/finance-slice';
import contactReducer from './slices/contact-slice';
import scoringReducer from './slices/scoring-slice';
import marketingReducer from './slices/marketing-slice';
import projectReducer from './slices/project-slice';
import chatReducer from './slices/chat-slice';
import posReducer from './slices/pos-slice';
import salesReducer from './slices/sales-slice';
import organizationReducer from './slices/organization-slice';
import reputationReducer from './slices/reputation-slice';
import omnichannelReducer from './slices/omnichannel-slice';
import documentsReducer from './slices/document-slice';
import communityReducer from './slices/community-slice';
import employeeReducer from './slices/employee-slice';
import supportReducer from './slices/support-slice';
import builderReducer from './slices/builder-slice';
import integrationReducer from './slices/integration-slice';
import affiliateReducer from './slices/affiliate-slice';
import businessReducer from './slices/business-slice';
import socialReducer from './slices/social-slice';
import notificationReducer from './slices/notification-slice';
import helpCenterReducer from './slices/help-center-slice';
import publicFlowReducer from './slices/public-flow-slice';
import businessCardReducer from './slices/business-card-slice';

const rootReducer = combineReducers({
  odoo: odooReducer,
  magento: magentoReducer,
  commerce: commerceReducer,
  billing: billingReducer,
  booking: bookingReducer,
  dashboard: dashboardReducer,
  calendar: calendarReducer,
  finance: financeReducer,
  contacts: contactReducer,
  scoring: scoringReducer,
  marketing: marketingReducer,
  projects: projectReducer,
  chat: chatReducer,
  pos: posReducer,
  sales: salesReducer,
  reputation: reputationReducer,
  omnichannel: omnichannelReducer,
  organization: organizationReducer,
  documents: documentsReducer,
  community: communityReducer,
  employees: employeeReducer,
  support: supportReducer,
  builder: builderReducer,
  integration: integrationReducer,
  affiliate: affiliateReducer,
  business: businessReducer,
  social: socialReducer,
  notifications: notificationReducer,
  helpCenter: helpCenterReducer,
  publicFlow: publicFlowReducer,
  businessCard: businessCardReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['pos', 'commerce', 'publicFlow'], // Persist these slices
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
