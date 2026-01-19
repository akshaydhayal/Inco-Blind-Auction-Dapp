"use client";

interface TxLinkProps {
  txHash: string;
}

export function TxLink({ txHash }: TxLinkProps) {
  const explorerUrl = `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
  const shortHash = `${txHash.slice(0, 8)}...${txHash.slice(-8)}`;

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-indigo-400 hover:text-purple-400 transition-colors font-mono text-xs font-bold hover:underline"
    >
      <span>{shortHash}</span>
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}

interface TxStatusProps {
  status: string;
  txHash?: string | null;
  isError?: boolean;
  isSuccess?: boolean;
}

export function TxStatus({
  status,
  txHash,
  isError,
  isSuccess,
}: TxStatusProps) {
  const getIcon = () => {
    if (isError) {
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    if (isSuccess) {
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );
  };

  return (
    <div
      className={`p-6 rounded-2xl border-2 backdrop-blur-sm ${
        isError
          ? "bg-red-500/10 border-red-500/40 text-red-400"
          : isSuccess
          ? "bg-green-500/10 border-green-500/40 text-green-400"
          : "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {getIcon()}
          <span className="font-bold">{status}</span>
        </div>
        {txHash && <TxLink txHash={txHash} />}
      </div>
    </div>
  );
}
