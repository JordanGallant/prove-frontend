import React, { useState, useEffect } from 'react';

// Type definitions based on your API response
interface Account {
  account: string;
  private_key: string;
}

interface AccountsResponse {
  success: boolean;
  container_name: string;
  accounts: Account[];
  error?: string;
}

interface HardhatAccountsProps {
  containerName: string;
}

const HardhatAccounts: React.FC<HardhatAccountsProps> = ({ 
  containerName, 
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [containerInfo, setContainerInfo] = useState<string>('');

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/accounts/${containerName}`);
      const data: AccountsResponse = await response.json();
      
      if (data.success) {
        setAccounts(data.accounts);
        setContainerInfo(data.container_name);
      } else {
        setError(data.error || 'Failed to fetch accounts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (containerName) {
      fetchAccounts();
    }
  }, [containerName]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const truncateAddress = (address: string, start = 6, end = 4) => {
    return `${address}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading accounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error fetching accounts</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button 
          onClick={fetchAccounts}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Hardhat Accounts
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Container: {containerInfo} • {accounts.length} accounts
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Private Key
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {index}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {truncateAddress(account.account)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(account.account)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        title="Copy address"
                      >
                    
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {truncateAddress(account.private_key, 8, 6)}
                      </code>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {accounts.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No accounts found
          </div>
        )}
      </div>
    </div>
  );
};

export default HardhatAccounts;