import React from 'react'

import AuthModal from "../modals/auth"

export default function NavBar() {
  return (
    <>
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Proving Grounds</h1>
            </div>            
            <div className="flex items-center">
              <AuthModal/>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}