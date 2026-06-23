import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { pin, amount, receiver_email } = await req.json();
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token || !pin || !amount || !receiver_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get sender from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sender wallet + verify PIN
    const { data: senderWallet, error: senderError } = await supabase
      .from('wallets')
      .select('id, pin_hash, balance')
      .eq('user_id', user.id)
      .single();

    if (senderError || !senderWallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Verify PIN server-side
    const isValidPin = senderWallet.pin_hash ? await bcrypt.compare(pin, senderWallet.pin_hash) : false;
    if (!isValidPin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Get receiver wallet
    const { data: receiver } = await supabase.rpc('find_wallet_by_email', { p_email: receiver_email });
    if (!receiver || receiver.length === 0) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    const receiverWallet = receiver[0];

    // Check balance
    if (senderWallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Execute transfer via RPC (SECURITY DEFINER — server-side only)
    const { data: result, error: transferError } = await supabase.rpc('transfer_money', {
      p_sender_wallet_id: senderWallet.id,
      p_receiver_wallet_id: receiverWallet.wallet_id,
      p_amount: amount,
      p_description: `Transfer to ${receiverWallet.email}`
    });

    if (transferError) {
      return NextResponse.json({ error: transferError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, transaction_id: result }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}