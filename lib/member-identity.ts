const MEMBER_EMAIL_ALIASES: Record<string, string> = {
  "ipzeroline@gmail.com": "zeroline@live.com",
};

export function normalizeMemberEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return MEMBER_EMAIL_ALIASES[normalized] || normalized;
}

export function getLoginEmail(email: string) {
  return email.trim().toLowerCase();
}
