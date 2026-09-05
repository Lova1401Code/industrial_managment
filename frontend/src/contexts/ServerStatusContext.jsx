import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ServerStatusContext = createContext(null);

export const ServerStatus = {
  IDLE: 'idle',
  WAKING: 'waking',
  RETRYING: 'retrying',
  ERROR: 'error',
};

export function ServerStatusProvider({ children }) {
  const [status, setStatus] = useState(ServerStatus.IDLE);
  const [retryInfo, setRetryInfo] = useState(null);
  const pendingCountRef = useRef(0);

  const resetIfIdle = useCallback(() => {
    pendingCountRef.current -= 1;
    if (pendingCountRef.current <= 0) {
      pendingCountRef.current = 0;
      setStatus(ServerStatus.IDLE);
      setRetryInfo(null);
    }
  }, []);

  const notifyWaking = useCallback(() => {
    setStatus(ServerStatus.WAKING);
  }, []);

  const notifyRetry = useCallback((attempt, max) => {
    setStatus(ServerStatus.RETRYING);
    setRetryInfo({ attempt, max });
  }, []);

  const notifyError = useCallback(() => {
    setStatus(ServerStatus.ERROR);
  }, []);

  const notifyRequestStart = useCallback(() => {
    pendingCountRef.current += 1;
  }, []);

  const notifyRequestEnd = useCallback(() => {
    resetIfIdle();
  }, []);

  const dismiss = useCallback(() => {
    setStatus(ServerStatus.IDLE);
    setRetryInfo(null);
  }, []);

  const value = {
    status,
    retryInfo,
    notifyWaking,
    notifyRetry,
    notifyError,
    notifyRequestStart,
    notifyRequestEnd,
    dismiss,
  };

  return (
    <ServerStatusContext.Provider value={value}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatus() {
  const ctx = useContext(ServerStatusContext);
  if (!ctx) {
    throw new Error('useServerStatus must be used within ServerStatusProvider');
  }
  return ctx;
}