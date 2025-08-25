"use client"
import { useState } from 'react';

export default function MetaMaskAuth() {
  const [account, setAccount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsSignup, setNeedsSignup] = useState(false);

  const connect = async () => {
    if (!window.ethereum) {
      alert('MetaMask not installed');
      return;
    }

    setLoading(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      setAccount(accounts[0]);
      setIsConnected(true);
      console.log('Connected address:', accounts[0]);
    } catch (error) {
      console.error('Connection failed:', error);
    }
    setLoading(false);
  };

  const handleAuth = async (action: 'signup' | 'login') => {
    if (!account || !window.ethereum) return;

    setLoading(true);
    try {
      const message = `${action === 'signup' ? 'Sign up' : 'Login'} to App\nNonce: ${Date.now()}`;
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account]
      });

      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: account, 
          signature, 
          message,
          action
        })
      });

      const result = await response.json();

      if (response.ok) {
        if (action === 'signup') {
          alert('Account created! Please login now.');
          setNeedsSignup(false);
        } else {
          setIsAuthenticated(true);
          console.log('Authenticated successfully');
        }
      } else {
        if (result.error.includes('not found') && action === 'login') {
          setNeedsSignup(true);
        } else {
          alert(`${action} failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
      alert(`${action} failed`);
    }
    setLoading(false);
  };

  const logout = () => {
    setAccount('');
    setIsConnected(false);
    setIsAuthenticated(false);
    setNeedsSignup(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold">Wallet Auth</h1>
          <p className="text-gray-600 text-sm mt-2">Supabase + MetaMask</p>
        </div>

        {!isConnected ? (
          <button
            onClick={connect}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Connect MetaMask'
            )}
          </button>
        ) : !isAuthenticated ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-700 font-medium">Connected</span>
              </div>
              <p className="font-mono text-xs break-all text-gray-600">{account}</p>
            </div>
            
            {needsSignup ? (
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="text-yellow-800 text-sm">Account not found. Please sign up first.</p>
                </div>
                <button
                  onClick={() => handleAuth('signup')}
                  disabled={loading}
                  className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Sign Up'
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleAuth('login')}
                disabled={loading}
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Sign & Login'
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
              <div className="text-blue-600 mb-2">✓ Authenticated with Supabase</div>
              <p className="font-mono text-xs break-all text-gray-600">{account}</p>
            </div>
            
            <button
              onClick={logout}
              className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}