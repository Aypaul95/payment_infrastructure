export interface SmsMessage {
  to: string;
  message: string;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<void>;
}

class MockSmsProvider implements SmsProvider {
  async send(message: SmsMessage): Promise<void> {
    if (!message.to || !message.message.trim()) {
      throw new Error("INVALID_SMS_MESSAGE");
    }

    // Development provider: deliberately does not send a real SMS.
    // Never log confirmation codes or message contents.
  }
}

let activeSmsProvider: SmsProvider = new MockSmsProvider();

export function setSmsProvider(provider: SmsProvider): void {
  activeSmsProvider = provider;
}

export const smsProvider: SmsProvider = {
  send(message: SmsMessage): Promise<void> {
    return activeSmsProvider.send(message);
  },
};