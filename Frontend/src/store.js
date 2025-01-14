// store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './slices/userSlice';
import adminReducer from './slices/admin/adminSlice'; // Import the admin slice
import modalReducer from './slices/modalSlice'
// Root reducer
const rootReducer = combineReducers({
  user: userReducer,
  admin: adminReducer, // Add the admin slice
  modal: modalReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user', 'admin', ], // Persist both user and admin slices
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer, // Use the persisted root reducer
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['user.image', 'admin.password'], // Ignore sensitive paths
      },
    }),
});

export const persistor = persistStore(store);
export default store;