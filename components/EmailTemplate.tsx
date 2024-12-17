interface EmailTemplateProps {
    confirmationUrl: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
    confirmationUrl,
}) => (
    <div>
        <h1>Welcome to LKJ Gardens Igando</h1>
        <p>Please confirm your email address by clicking the link below:</p>
        <a href={confirmationUrl}>Confirm Email Address</a>
        <p>If you didn't create this account, you can safely ignore this email.</p>
        <br />
        <p>Best regards,</p>
        <p>LKJ Gardens Igando Team</p>
    </div>
);