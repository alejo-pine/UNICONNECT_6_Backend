export interface EmailServicePort {
  sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean>;
}
