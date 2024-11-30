import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const body = await request.json()
    console.log('Received signup request:', { ...body, password: '[REDACTED]' })

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', body.email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if flat is already taken
    const { data: existingFlat } = await supabase
      .from('users')
      .select('id')
      .eq('block_number', body.block)
      .eq('flat_number', body.flatNumber)
      .maybeSingle()

    if (existingFlat) {
      return NextResponse.json(
        { error: 'This flat is already registered' },
        { status: 400 }
      )
    }

    // Create auth user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: `${request.headers.get('origin')}/auth/callback`,
        data: {
          full_name: body.fullName,
          phone_number: body.phoneNumber,
          block_number: body.block,
          flat_number: body.flatNumber
        }
      }
    })

    if (signUpError || !user) {
      console.error('Auth signup error:', signUpError)
      return NextResponse.json(
        { error: signUpError?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: body.email,
        full_name: body.fullName,
        phone_number: body.phoneNumber,
        block_number: body.block,
        flat_number: body.flatNumber
      }])

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email for verification.'
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 