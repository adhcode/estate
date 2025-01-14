import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Text,
    Section,
} from '@react-email/components';
import * as React from 'react';

interface InvitationEmailProps {
    name: string;
    email: string;
    tempPassword: string;
    loginUrl: string;
}

export const InvitationEmail: React.FC<InvitationEmailProps> = ({
    name,
    email,
    tempPassword,
    loginUrl,
}) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to Estate Manager - Your Household Member Invitation</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={h1}>Welcome to Estate Manager</Heading>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Text style={greeting}>Hello {name},</Text>
                        <Text style={text}>
                            You've been invited to join as a household member. We're excited to have you on board!
                        </Text>

                        {/* Credentials Box */}
                        <Section style={credentialsBox}>
                            <Text style={credentialsTitle}>Your Login Credentials</Text>
                            <Text style={credentialsText}>Email: {email}</Text>
                            <Text style={credentialsText}>Temporary Password: {tempPassword}</Text>
                        </Section>

                        {/* Steps */}
                        <Text style={stepsTitle}>Getting Started:</Text>
                        <Section style={stepsList}>
                            <Text style={stepItem}>1. Click the "Access Account" button below</Text>
                            <Text style={stepItem}>2. Log in with your credentials</Text>
                            <Text style={stepItem}>3. Set your new password when prompted</Text>
                            <Text style={stepItem}>4. Complete your profile setup</Text>
                        </Section>

                        {/* CTA Button */}
                        <Section style={buttonContainer}>
                            <Link href={loginUrl} style={button}>
                                Access Account
                            </Link>
                        </Section>

                        {/* Security Note */}
                        <Text style={securityNote}>
                            For security reasons, please change your password immediately upon first login.
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Need help? Contact your primary resident or our support team.
                        </Text>
                        <Text style={poweredBy}>
                            Powered by <Link href="https://uvise.com" style={uviseLink}>UVISE</Link>
                        </Text>
                        <Text style={uvisePromo}>
                            Empowering communities with innovative solutions.
                            Visit <Link href="https://uvise.com" style={uviseLink}>uvise.com</Link> to learn more.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '600px',
};

const header = {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderTopLeftRadius: '6px',
    borderTopRightRadius: '6px',
    textAlign: 'center' as const,
};

const content = {
    backgroundColor: '#ffffff',
    padding: '32px',
};

const h1 = {
    color: '#832131',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '40px',
    margin: '0 0 20px',
    textAlign: 'center' as const,
};

const greeting = {
    color: '#333',
    fontSize: '18px',
    lineHeight: '28px',
    margin: '0 0 15px',
};

const text = {
    color: '#444',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 20px',
};

const credentialsBox = {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e6ebf1',
    borderRadius: '6px',
    padding: '20px',
    margin: '20px 0',
};

const credentialsTitle = {
    color: '#832131',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 12px',
};

const credentialsText = {
    color: '#444',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 8px',
};

const stepsTitle = {
    color: '#333',
    fontSize: '16px',
    fontWeight: '600',
    margin: '24px 0 12px',
};

const stepsList = {
    margin: '0 0 24px',
};

const stepItem = {
    color: '#444',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 8px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#832131',
    borderRadius: '6px',
    color: '#fff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600',
    padding: '12px 32px',
    textDecoration: 'none',
    textAlign: 'center' as const,
};

const securityNote = {
    color: '#666',
    fontSize: '14px',
    fontStyle: 'italic',
    lineHeight: '24px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const footer = {
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e6ebf1',
    borderBottomLeftRadius: '6px',
    borderBottomRightRadius: '6px',
    padding: '24px',
};

const footerText = {
    color: '#666',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 16px',
    textAlign: 'center' as const,
};

const poweredBy = {
    color: '#666',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 8px',
    textAlign: 'center' as const,
};

const uviseLink = {
    color: '#832131',
    textDecoration: 'none',
    fontWeight: '600',
};

const uvisePromo = {
    color: '#666',
    fontSize: '12px',
    lineHeight: '20px',
    margin: '0',
    textAlign: 'center' as const,
};

export default InvitationEmail; 