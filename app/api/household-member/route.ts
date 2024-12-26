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
    
    if (!body.email || !body.tempPassword || !body.name || !body.origin) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // First check if user exists
    const { data: existingUser, error: listError } = await supabase.auth.admin
      .listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const user = existingUser.users.find(u => u.email === body.email);

    let userId;
    if (user) {
      // Use existing user
      userId = user.id;
      console.log('Using existing user:', userId);
    } else {
      // Create new user
      console.log('Creating new user for:', body.email);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: body.name,
          role: 'household_member'
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        throw authError;
      }
      userId = authData.user.id;
      console.log('Created new user:', userId);
    }

    // Send password reset email
    console.log('Sending password reset email to:', body.email);
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: body.email,
      options: {
        redirectTo: `${body.origin}/auth/set-password`
      }
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
      throw resetError;
    }

    console.log('Successfully processed request for:', body.email);
    return NextResponse.json({ 
      user: { id: userId },
      message: 'User processed successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 400 });
  }
} 