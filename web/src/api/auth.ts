import api from "./client";

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  zipCode: string;
  isHost: boolean;
  phone?: string;
  backgroundCheckAccepted?: boolean;
};

export async function register(payload: RegisterPayload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function login(email: string, password: string) {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);
  const { data } = await api.post("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data as { access_token: string; token_type: string };
}

export async function me() {
  const { data } = await api.get("/auth/me");
  return data;
}

