'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

// Type definitions
interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'signup'
  setMode: (mode: 'login' | 'signup') => void
}

interface UserMenuProps {
  user: User | { wallet_address: string }
  onSignOut: () => void
}

// Auth Modal Component
const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode, setMode }) => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [walletLoading, setWalletLoading] = useState<boolean>(false)
  
  const supabase = createClientComponentClient()

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      }
      onClose()
      setEmail('')
      setPassword('')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleWalletAuth = async (action: 'signup' | 'login') => {
    if (!window.ethereum) {
      setError('MetaMask not installed')
      return
    }

    setWalletLoading(true)
    setError('')

    try {
      // Connect wallet
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      const account = accounts[0]
      const message = `${action === 'signup' ? 'Sign up' : 'Login'} to App\nNonce: ${Date.now()}`
      
      // Sign message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account]
      })

      // Send to backend
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address: account, 
          signature, 
          message,
          action
        })
      })

      const result = await response.json()

      if (response.ok) {
        if (action === 'signup') {
          setError('')
          alert('Wallet account created! Please login now.')
        } else {
          localStorage.setItem('wallet-token', result.token)
          localStorage.setItem('wallet-address', account)
          window.location.reload() // Simple refresh to update auth state
        }
      } else {
        if (result.error.includes('not found') && action === 'login') {
          setError('Wallet not registered. Please sign up first.')
        } else {
          setError(result.error)
        }
      }
    } catch (error: any) {
      setError(error.message || 'Wallet authentication failed')
    } finally {
      setWalletLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* MetaMask Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-lg">🦊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Login with MetaMask</h3>
          </div>
          
          <button
            onClick={() => handleWalletAuth(mode)}
            disabled={walletLoading}
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {walletLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              `${mode === 'login' ? 'Login' : 'Sign Up'} with Wallet`
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="px-3 text-sm text-gray-500">or continue with email</div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleAuth}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// User Menu Dropdown Component
const UserMenu: React.FC<UserMenuProps> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const isWalletUser = 'wallet_address' in user

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium">
            {isWalletUser ? '🦊' : user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-sm font-medium">
          {isWalletUser 
            ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
            : user.email
          }
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          <button
            onClick={onSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

const NavBar: React.FC = () => {
  const [user, setUser] = useState<User | { wallet_address: string } | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      // Check for Supabase auth
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
      } else {
        // Check for wallet auth
        const walletToken = localStorage.getItem('wallet-token')
        const walletAddress = localStorage.getItem('wallet-address')
        
        if (walletToken && walletAddress) {
          setUser({ wallet_address: walletAddress })
        }
      }
      
      setLoading(false)
    }

    getUser()

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
        } else {
          // Check wallet auth when Supabase auth is cleared
          const walletToken = localStorage.getItem('wallet-token')
          const walletAddress = localStorage.getItem('wallet-address')
          
          if (walletToken && walletAddress) {
            setUser({ wallet_address: walletAddress })
          } else {
            setUser(null)
          }
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async (): Promise<void> => {
    // Sign out from both systems
    await supabase.auth.signOut()
    localStorage.removeItem('wallet-token')
    localStorage.removeItem('wallet-address')
    setUser(null)
  }

  const openAuthModal = (mode: 'login' | 'signup'): void => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  return (
    <>
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              ) : user ? (
                <UserMenu user={user} onSignOut={handleSignOut} />
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuthModal('signup')}
                    className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        setMode={setAuthMode}
      />
    </>
  )
}

export default NavBar