export function createPasswordResetToken(): string {
  return Math.random().toString(36).slice(2);
}

export function createSessionId(): string {
  return `${Date.now()}-${Math.random()}`;
}

export function createVerificationCode(): string {
  return Math.floor(Math.random() * 1_000_000).toString();
}

export function assignApiKey(user: { apiKey?: string }): void {
  user.apiKey = Math.random().toString(36);
}
