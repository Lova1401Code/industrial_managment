import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { ServerStatusProvider, useServerStatus } from './contexts/ServerStatusContext.jsx';
import { ServerWakingOverlay } from './components/ServerWakingOverlay.jsx';
import { configureServerStatusCallbacks } from './api.js';
import './styles/global.css';

function ServerStatusBridge() {
  const {
    notifyWaking,
    notifyRetry,
    notifyError,
    notifyRequestStart,
    notifyRequestEnd,
  } = useServerStatus();

  configureServerStatusCallbacks({
    onWarn: notifyWaking,
    onRetry: notifyRetry,
    onError: notifyError,
    onRequestStart: notifyRequestStart,
    onRequestEnd: notifyRequestEnd,
  });

  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ServerStatusProvider>
        <ServerStatusBridge />
        <ToastProvider>
          <AuthProvider>
            <App />
            <ServerWakingOverlay />
          </AuthProvider>
        </ToastProvider>
      </ServerStatusProvider>
    </BrowserRouter>
  </React.StrictMode>
);