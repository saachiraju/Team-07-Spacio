import client from "./client";

export interface VerificationSession {
  url: string;
  sessionId: string;
}

export interface VerificationStatus {
  status: string;
  verified: boolean;
  stripeStatus?: string;
  error?: string;
}

export async function createVerificationSession(): Promise<VerificationSession> {
  const res = await client.post<VerificationSession>("/verification/create-session");
  return res.data;
}

export async function getVerificationStatus(): Promise<VerificationStatus> {
  const res = await client.get<VerificationStatus>("/verification/status");
  return res.data;
}

