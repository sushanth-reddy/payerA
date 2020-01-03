import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Provider } from 'react-redux'
import App from './components/App';
import allReducers from './reducers';
import {createStore, applyMiddleware} from 'redux';
import {persistStore, persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import {PersistGate} from 'redux-persist/integration/react';
import thunk from 'redux-thunk';
import ReduxPromise from 'redux-promise';

const createStoreWithMiddleware = applyMiddleware(ReduxPromise, thunk)(createStore);

const persistConfig = {
  key: 'root',
  storage,
}
const persistedReducer = persistReducer(persistConfig, allReducers);
const store = createStoreWithMiddleware(persistedReducer);
const persistor = persistStore(store);

ReactDOM.render(<Provider store={store}>
  <PersistGate loading={null} persistor={persistor}>
  <App/>
  </PersistGate>
</Provider>, document.getElementById('root'));