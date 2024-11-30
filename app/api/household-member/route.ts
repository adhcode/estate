import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  const body = await request.json();
  
  try {
    // First check if user exists
    const { data: existingUser } = await supabase.auth.admin
      .listUsers();

    const user = existingUser.users.find(u => u.email === body.email);

    let userId;
    if (user) {
      // Use existing user
      userId = user.id;
    } else {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: body.name,
          role: 'household_member'
        }
      });

      if (authError) throw authError;
      userId = authData.user.id;
    }

    // Send password reset email
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: body.email,
      options: {
        redirectTo: `${body.origin}/auth/set-password`
      }
    });

    if (resetError) throw resetError;

    return NextResponse.json({ user: { id: userId } });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 400 });
  }
} 