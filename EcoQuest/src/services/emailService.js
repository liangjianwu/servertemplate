const nodemailer = require('nodemailer');
const { Debug } = require('../components');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
class EmailService {
    constructor() {
        Debug(process.env.SMTP_HOST);
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false, // Accept self-signed certs
                ciphers: 'SSLv3'
            }
        });
    }

    // Send password reset email
    async sendPasswordResetEmail(email, resetToken) {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: email,
                subject: 'Password Reset Request',
                html: this.getPasswordResetTemplate(resetToken)
            });
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    // Send welcome email after registration
    async sendWelcomeEmail(email, name) {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: email,
                subject: 'Welcome to EcoQuest!',
                html: this.getWelcomeTemplate(name)
            });
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    // Email templates
    getPasswordResetTemplate(resetToken) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>You have requested to reset your password.</p>
                <p>Please use the following code to reset your password:</p>
                <p style="background-color: #f4f4f4; padding: 10px; font-family: monospace;">${resetToken}</p>
                <p>This code will expire in 1 hour.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
            </div>
        `;
    }

    getWelcomeTemplate(name) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to EcoQuest!</h2>
                <p>Hello ${name || 'there'},</p>
                <p>Thank you for joining EcoQuest. We're excited to have you on board!</p>
                <p>Start your eco-friendly journey today and make a positive impact on the environment.</p>
            </div>
        `;
    }
}

module.exports = new EmailService();