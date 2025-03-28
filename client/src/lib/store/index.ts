import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import documentReducer from './documentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    document: documentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
