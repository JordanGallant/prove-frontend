import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { address, signature, message, action } = await request.json();
    
    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const walletAddress = address.toLowerCase();

    if (action === 'signup') {
      // Insert into custom users table
      const { error } = await supabase
        .from('wallet_users')
        .insert({ wallet_address: walletAddress });

      if (error) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'login') {
      // Check if user exists
       await supabase.rpc('set_wallet_context', { 
    wallet_addr: walletAddress 
  });

  const { data: user, error } = await supabase
    .from('wallet_users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
  
      if (error || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Generate JWT
      const token = jwt.sign(
        { address: walletAddress },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return NextResponse.json({ token });
    }

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}