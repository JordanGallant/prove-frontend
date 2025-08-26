"use client"
import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import AuthModal from "../modals/auth"
import VPNGenerator from '../modals/vpn'

export default function NavBar() {
  const [user, setUser] = useState<User | { wallet_address: string } | null>(null)
  const [loading, setLoading] = useState(true)
  
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
        } else {
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

  return (
    <>
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Proving Grounds</h1>
            </div>            
            <div className="flex items-center space-x-4">
              <VPNGenerator user={user} />
              <AuthModal />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}