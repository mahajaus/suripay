import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { pin, amount, receiver_email, description } = await req.json();
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token || !pin || !amount || !receiver_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
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

    // Get receiver wallet (RPC returns a JSON object: { found, wallet_id, full_name })
    const { data: receiver } = await supabase.rpc('find_wallet_by_email', { p_email: receiver_email });
    if (!receiver?.found) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    // Check balance
    if (senderWallet.balance < amountNum) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Execute transfer via RPC (SECURITY DEFINER — server-side only)
    const { data: result, error: transferError } = await supabase.rpc('transfer_money', {
      p_sender_wallet_id: senderWallet.id,
      p_receiver_wallet_id: receiver.wallet_id,
      p_amount: amountNum,
      p_description: description || `Transfer to ${receiver.full_name}`
    });

    // transfer_money returns { success, transaction_id } or { success: false, error }.
    // Business-rule rejections do NOT set transferError, so check result.success too.
    if (transferError || !result?.success) {
      return NextResponse.json(
        { error: result?.error ?? transferError?.message ?? 'Transfer failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, transaction_id: result.transaction_id }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}