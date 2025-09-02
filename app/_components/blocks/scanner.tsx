'use client';

import { useState, useEffect, useCallback } from 'react';

interface RunningBox {
  id: number;
  status: string;
  container_name: string;
  ip: string;
  timeRemaining: string;
}

interface ContractDeployment {
  hash: string;
  blockNumber: string;
  from: string;
  contractAddress: string;
  gas: string;
  gasUsed: string;
}

const RPCTransactionViewer = () => {
  const [rpcUrl, setRpcUrl] = useState<string | null>(null);
  const [contracts, setContracts] = useState<ContractDeployment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Reads from localStorage
  const updateRpcFromStorage = useCallback(() => {
    try {
      const runningBoxesData = localStorage.getItem('runningBoxes');
      if (runningBoxesData) {
        const runningBoxes: RunningBox[] = JSON.parse(runningBoxesData);
        if (runningBoxes.length > 0 && runningBoxes[0].ip) {
          const ip = runningBoxes[0].ip;
          setRpcUrl(`https://${ip}:8545`);
          return;
        }
      }
      setRpcUrl(null);
    } catch (err) {
      console.error('Error parsing localStorage data:', err);
    }
  }, []);

  // 🔹 Watch localStorage changes
  useEffect(() => {
    updateRpcFromStorage();
    window.addEventListener('storage', updateRpcFromStorage);
    return () => window.removeEventListener('storage', updateRpcFromStorage);
  }, [updateRpcFromStorage]);

  // 🔹 Fetch contracts (only last 50 blocks for speed)
  const fetchContracts = useCallback(async () => {
    if (!rpcUrl) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Get latest block
      const blockNumberResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      const blockNumberData = await blockNumberResponse.json();
      const latestBlockNumber = parseInt(blockNumberData.result, 16);

      const contractDeployments: ContractDeployment[] = [];

      // 🔹 Limit to last 50 blocks for performance
      const startBlock = Math.max(0, latestBlockNumber - 50);

      for (let i = startBlock; i <= latestBlockNumber; i++) {
        const blockResponse = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [`0x${i.toString(16)}`, true],
            id: i,
          }),
        });

        const blockData = await blockResponse.json();

        if (blockData.result?.transactions) {
          const contractTxs = blockData.result.transactions.filter((tx: any) => tx.to === null);

          for (const tx of contractTxs) {
            const receiptResponse = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionReceipt',
                params: [tx.hash],
                id: 100,
              }),
            });

            const receiptData = await receiptResponse.json();
            if (receiptData.result?.contractAddress) {
              contractDeployments.push({
                hash: tx.hash,
                blockNumber: tx.blockNumber,
                from: tx.from,
                contractAddress: receiptData.result.contractAddress,
                gas: tx.gas,
                gasUsed: receiptData.result.gasUsed,
              });
            }
          }
        }
      }

      setContracts(contractDeployments);
    } catch (err) {
      setError(`Failed to fetch contracts: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [rpcUrl]);

  // 🔹 Auto-fetch whenever RPC becomes available
  useEffect(() => {
    if (rpcUrl) {
      fetchContracts();
    }
  }, [rpcUrl, fetchContracts]);

  // --- UI ---
  if (!rpcUrl) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md">
          <strong className="font-bold">No RPC Connection!</strong>
          <span className="block sm:inline"> Start a box to view contracts.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Contract Address Explorer</h2>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Connected to: <code className="bg-gray-100 px-2 py-1 rounded">{rpcUrl}</code>
          </p>
          <button
            onClick={fetchContracts}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh Contracts'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {contracts.length > 0 && (
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full bg-white border border-gray-300">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 border-b text-left font-semibold">Contract Address</th>
                  <th className="px-4 py-3 border-b text-left font-semibold">Block</th>
                  <th className="px-4 py-3 border-b text-left font-semibold">Deployed By</th>
                  <th className="px-4 py-3 border-b text-left font-semibold">Gas Used</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b">
                    <td className="px-4 py-3">
                      <code className="text-xs bg-green-100 px-2 py-1 rounded break-all font-bold text-green-800">
                        {contract.contractAddress}
                      </code>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {parseInt(contract.blockNumber, 16)}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">{contract.from}</code>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {parseInt(contract.gasUsed, 16).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {contracts.length === 0 && !loading && !error && rpcUrl && (
          <div className="text-center text-gray-500 py-8">
            No deployed contracts found in the last 50 blocks.
          </div>
        )}
      </div>
    </div>
  );
};

export default RPCTransactionViewer;
