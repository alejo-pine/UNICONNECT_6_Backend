import sgMail from '@sendgrid/mail';
import { EmailServicePort } from '../domain/ports/emailServicePort';
import { eventLogger } from '../utils/eventLogger';

export class SendGridEmailService implements EmailServicePort {
  private readonly senderEmail: string;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    this.senderEmail = process.env.SENDGRID_FROM_EMAIL || 'juan.pelaez20691@ucaldas.edu.co';

    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      eventLogger.warn('SendGridEmailService', 'SENDGRID_API_KEY is not defined in environment variables');
    }
  }

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      eventLogger.warn('SendGridEmailService', 'SendGrid API Key missing. Skipping email send.', { to, subject });
      return false;
    }

    try {
      const msg = {
        to,
        from: this.senderEmail,
        subject,
        text,
        html: html || text, // Fallback a texto si no hay html
      };

      await sgMail.send(msg);
      eventLogger.info('SendGridEmailService', `Email sent successfully to ${to}`);
      return true;
    } catch (error: any) {
      eventLogger.error('SendGridEmailService', 'Failed to send email', { error: error.message, response: error.response?.body });
      return false;
    }
  }
}
