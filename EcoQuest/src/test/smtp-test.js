require('dotenv').config();
const nodemailer = require('nodemailer');

async function testConnection() {
    // Log environment variables to verify they're loaded
    console.log('Environment variables:', {
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM
    });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'login',
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        console.log('Attempting to verify connection...');
        await transporter.verify();
        console.log('SMTP connection successful!');
        
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: process.env.SMTP_USER,
            subject: 'Test Email',
            text: 'This is a test email from EcoQuest'
        });
        
        console.log('Test email sent! Message ID:', info.messageId);
    } catch (error) {
        console.error('Connection failed:', {
            message: error.message,
            code: error.code,
            command: error.command,
            stack: error.stack
        });
        process.exit(1);
    }
}

testConnection().catch(console.error);