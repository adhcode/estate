import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Processing request for:', body.email);

        // Validate Resend API key
        if (!process.env.RESEND_API_KEY) {
            console.error('Missing RESEND_API_KEY');
            throw new Error('Email service configuration error');
        }

        // Initialize Supabase client
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

        // Create auth user for the new member
        const { data: newAuthData, error: createAuthError } = await supabase.auth.admin.createUser({
            email: body.email,
            password: body.tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: `${body.first_name} ${body.last_name}`,
                role: 'household_member',
                temporary_password: true
            }
        });

        if (createAuthError) {
            console.error('Auth user creation error:', createAuthError);
            throw createAuthError;
        }

        if (!newAuthData.user) {
            throw new Error('User creation failed - no user returned');
        }

        // Create household member record
        const { error: memberError } = await supabase
            .from('household_members')
            .insert({
                id: newAuthData.user.id,
                first_name: body.first_name,
                last_name: body.last_name,
                email: body.email,
                phone_number: body.phone_number || null,
                relationship: body.relationship,
                primary_resident_id: body.primary_resident_id,
                invitation_status: 'sent',
                access_status: 'active'
            });

        if (memberError) {
            // If member creation fails, clean up the auth user
            await supabase.auth.admin.deleteUser(newAuthData.user.id);
            console.error('Member creation error:', memberError);
            throw memberError;
        }

        // Send invitation email
        try {
            console.log('Attempting to send email with Resend...');
            const emailResult = await resend.emails.send({
                from: 'LKJ Gardens Connect <onboarding@lkjgardensigando.com>',
                to: [body.email],
                subject: 'Welcome to LKJ Gardens Connect - Complete Your Account Setup',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Welcome to LKJ Gardens Connect</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
                            <tr>
                                <td align="center">
                                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        <!-- Header -->
                                        <tr>
                                            <td style="background-color: #832131; padding: 30px 40px;">
                                                <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to LKJ Gardens Connect</h1>
                                            </td>
                                        </tr>

                                        <!-- Main Content -->
                                        <tr>
                                            <td style="padding: 40px;">
                                                <p style="color: #333; font-size: 16px; line-height: 1.5; margin-top: 0;">
                                                    You've been invited to join as a household member. LKJ Gardens Connect, powered by UVISE, 
                                                    provides a comprehensive solution for managing your household efficiently.
                                                </p>

                                                <!-- Credentials Box -->
                                                <div style="background-color: #f9f9f9; border-radius: 6px; padding: 20px; margin: 30px 0;">
                                                    <h3 style="color: #832131; margin: 0 0 15px 0;">Your Login Credentials</h3>
                                                    <p style="margin: 5px 0; color: #444;">
                                                        <strong>Email:</strong> ${body.email}
                                                    </p>
                                                    <p style="margin: 5px 0; color: #444;">
                                                        <strong>Temporary Password:</strong> ${body.tempPassword}
                                                    </p>
                                                </div>

                                                <!-- CTA Button -->
                                                <div style="text-align: center; margin: 30px 0;">
                                                    <a href="${body.origin}/auth/login" 
                                                       style="display: inline-block; background-color: #832131; color: white; 
                                                              padding: 14px 30px; text-decoration: none; border-radius: 6px;
                                                              font-weight: bold; font-size: 16px;">
                                                        Login to LKJ Gardens Connect
                                                    </a>
                                                </div>

                                                <!-- Features Section -->
                                                <div style="margin: 30px 0; padding-top: 30px; border-top: 1px solid #eee;">
                                                        <h3 style="color: #832131; margin: 0 0 15px 0;">What You Can Do with LKJ Gardens Connect</h3>
                                                    <ul style="color: #444; line-height: 1.6; padding-left: 20px;">
                                                        <li>Manage household access and permissions</li>
                                                        <li>Track important household documents</li>
                                                        <li>Coordinate with family members</li>
                                                        <li>Access emergency information</li>
                                                        <li>Stay updated with household notifications</li>
                                                    </ul>
                                                </div>

                                                <!-- Security Note -->
                                                <p style="color: #666; font-size: 14px; margin: 30px 0; padding-top: 20px; border-top: 1px solid #eee;">
                                                    For security reasons, please change your password after your first login. Your data is protected by 
                                                    UVISE's enterprise-grade security infrastructure.
                                                </p>
                                            </td>
                                        </tr>

                                        <!-- Footer -->
                                        <tr>
                                            <td style="background-color: #f8f8f8; padding: 30px 40px; border-top: 1px solid #eee;">
                                                <table width="100%">
                                                    <tr>
                                                        <td>
                                                            <p style="color: #666; font-size: 14px; margin: 0;">
                                                                Powered by <a href="https://uvise.ng" style="color: #832131; text-decoration: none; font-weight: bold;">UVISE</a>
                                                            </p>
                                                            <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
                                                                UVISE - Transforming household management with innovative solutions.
                                                            </p>
                                                        </td>
                                                        <td align="right">
                                                            <img src="/public/uviselogo.png" alt="UVISE Logo" style="height: 40px;">
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Email Footer -->
                                    <table width="600" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding: 20px 0; text-align: center;">
                                                <p style="color: #666; font-size: 12px; margin: 0;">
                                                    This email was sent by LKJ Gardens Connect, a UVISE product.
                                                </p>
                                                <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
                                                    © ${new Date().getFullYear()} UVISE. All rights reserved.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `
            });

            console.log('Email sent successfully:', emailResult);

            if (emailResult.error) {
                console.error('Failed to send email:', emailResult.error);
                throw emailResult.error;
            }

            return NextResponse.json({
                user: { id: newAuthData.user.id },
                message: 'Member added successfully and invitation sent',
                emailId: emailResult.data?.id
            });

        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Don't throw here - the user is created, we just couldn't send the email
            return NextResponse.json({
                user: { id: newAuthData.user.id },
                message: 'Member added successfully but invitation email failed',
                error: 'Failed to send invitation email'
            });
        }

    } catch (error: any) {
        console.error('Server error:', error);
        return NextResponse.json(
            { 
                error: error.message || 'Internal server error',
                details: error
            },
            { status: 500 }
        );
    }
}
