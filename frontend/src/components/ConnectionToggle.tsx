import { useConnection } from '../hooks/useConnection';

export function ConnectionToggle() {
  const { type, switchTo, isConnecting } = useConnection();

  return (
    <div className="flex items-center space-x-2">
      <div className="flex bg-white/20 rounded-lg p-1">
        <button
          onClick={() => switchTo('smoldot')}
          disabled={isConnecting}
          className={`px-3 py-1 text-sm rounded transition-colors text-white/80 hover:text-white hover:bg-white/10 ${
            isConnecting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Smoldot {type === 'smoldot' ? '✓' : ''}
        </button>
        <button
          onClick={() => switchTo('ws')}
          disabled={isConnecting}
          className={`px-3 py-1 text-sm rounded transition-colors text-white/80 hover:text-white hover:bg-white/10 ${
            isConnecting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          WebSocket {type === 'ws' ? '✓' : ''}
        </button>
      </div>
      {isConnecting && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}