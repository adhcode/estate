import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  try {
    const body = await request.json();
    console.log('Processing invitation for:', body.email);

    // Create new user with a temporary password
    const tempPassword = crypto.randomUUID().slice(0, 8);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: body.name,
        role: 'household_member'
      }
    });

    if (authError) throw authError;

    // Immediately send password reset email
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: body.email,
      options: {
        redirectTo: `${body.origin}/auth/set-password`
      }
    });

    if (resetError) {
      console.error('Failed to send reset email:', resetError);
      throw resetError;
    }

    return NextResponse.json({ 
      user: authData.user,
      message: 'User created and reset email sent' 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 400 });
  }
} 