import React, { useState } from 'react';

interface VPNGeneratorProps {
  user?: any; // User from your auth system
}

const VPNGenerator: React.FC<VPNGeneratorProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  // Use your actual backend URL
  const BACKEND_URL = 'http://172.21.127.47:5000';

  const getUserId = () => {
    if (!user) return null;
    const rawId = 'wallet_address' in user ? user.wallet_address : user.id;
    // Remove hyphens and special characters to make it compatible with OpenVPN certificate naming
    return rawId ? rawId.replace(/[^a-zA-Z0-9_]/g, '') : null;
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

  const checkHealth = async () => {
    try {
      setMessage('Checking server health...');
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Health check:', data);
        setMessage(`Server healthy. Easy-RSA setup: ${data.easy_rsa_setup ? '✓' : '✗'}`);
        return data;
      } else {
        setMessage('Server health check failed');
        return null;
      }
    } catch (error) {
      console.error('Health check error:', error);
      setMessage(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const generateVPN = async () => {
    const userId = getUserId();
    console.log('User ID:', userId);
    
    if (!userId) {
      setMessage('No user ID available');
      return;
    }

    setLoading(true);
    setMessage('Generating VPN configuration...');

    try {
      // First check if server is healthy
      const healthCheck = await checkHealth();
      if (!healthCheck || !healthCheck.easy_rsa_setup) {
        setMessage('Server is not properly configured for VPN generation');
        setLoading(false);
        return;
      }

      setMessage('Server healthy. Generating certificate...');
      
      console.log('Sending request to:', `${BACKEND_URL}/generate-vpn`);
      console.log('Request payload:', { user_id: userId });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch(`${BACKEND_URL}/generate-vpn`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/octet-stream'
        },
        body: JSON.stringify({ user_id: userId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        const blob = await response.blob();
        
        if (blob.size === 0) {
          setMessage('Error: Received empty file');
          return;
        }
        
        const filename = `vpn-config-${userId}.ovpn`;
        downloadFile(blob, filename);
        setMessage(`✓ VPN configuration downloaded successfully! (${blob.size} bytes)`);
      } else {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || 'Unknown error';
        } catch {
          errorMessage = await response.text() || 'Unknown error';
        }
        console.log('Error response:', errorMessage);
        setMessage(`❌ Failed to generate VPN config: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setMessage('❌ Request timed out. The server may be overloaded.');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setMessage(`❌ Error occurred: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Test user for debugging
  const effectiveUser = user || { id: 'test_user_123' };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md">
    
      
      <div className="space-y-3">
        <button
          onClick={generateVPN}
          disabled={loading || !getUserId()}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating...' : 'Download VPN Config'}
        </button>
        
        {message && (
          <div className={`mt-3 p-3 rounded-md text-sm ${
            message.includes('✓') || message.includes('successfully') || message.includes('completed')
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : message.includes('❌') || message.includes('Error') || message.includes('Failed')
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {message}
          </div>
        )}
      </div>
      
      {loading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default VPNGenerator;