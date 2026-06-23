import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token || !pin) {
      return NextResponse.json({ error: 'Missing PIN or auth' }, { status: 400 });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get wallet + pin_hash
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, pin_hash')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    // Verify PIN
    const isValid = wallet.pin_hash ? await bcrypt.compare(pin, wallet.pin_hash) : false;

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    // Return success (client can now proceed with transfer)
    return NextResponse.json({ success: true, wallet_id: wallet.id }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
