import { useServerStatus, ServerStatus } from '../contexts/ServerStatusContext.jsx';

export function ServerWakingOverlay() {
  const { status, retryInfo, dismiss } = useServerStatus();

  if (status === ServerStatus.IDLE) return null;

  const isError = status === ServerStatus.ERROR;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 flex max-w-sm flex-col items-center rounded-2xl bg-white p-8 text-center shadow-2xl">
        {isError ? (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-bold text-gray-900">Serveur indisponible</h2>
            <p className="mb-6 text-sm text-gray-500">
              Le serveur ne repond pas apres plusieurs tentatives. Veuillez reessayer dans un instant.
            </p>
            <button
              onClick={dismiss}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Reessayer
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <svg className="h-8 w-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-bold text-gray-900">
              {status === ServerStatus.RETRYING
                ? `Nouvelle tentative${retryInfo ? ` (${retryInfo.attempt}/${retryInfo.max})` : ''}...`
                : 'Reveil du serveur...'}
            </h2>
            <p className="text-sm text-gray-500">
              Le serveur est en train de se reveiller, veuillez patienter.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Les serveurs gratuits peuvent prendre ~30s a demarrer.
            </p>
          </>
        )}
      </div>
    </div>
  );
}