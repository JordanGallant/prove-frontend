import React, { useState } from 'react';

interface VPNGeneratorProps {
  user?: any; // User from your auth system
}

const VPNGenerator: React.FC<VPNGeneratorProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const getUserId = () => {
    if (!user) return null;
    return 'wallet_address' in user ? user.wallet_address : user.id;
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateVPN = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/generate-vpn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      if (response.ok) {
        // Always treat as file download
        const blob = await response.blob();
        const filename = `vpn-config-${userId}.ovpn`;
        
        downloadFile(blob, filename);
        setMessage('Download completed!');
      } else {
        setMessage('Failed to generate VPN config');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed">
          Login to Generate VPN
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-4">VPN Configuration</h3>
      
      <div className="space-y-4">
        <button
          onClick={generateVPN}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Download VPN Config'}
        </button>
        
        {message && (
          <div className={`mt-2 p-2 rounded text-sm ${
            message.includes('completed') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default VPNGenerator;