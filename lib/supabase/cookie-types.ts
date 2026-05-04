export type CookieToSet = {
  name: string;
  value: string;
  options?: {
    path?: string;
    maxAge?: number;
    domain?: string;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
    httpOnly?: boolean;
  };
};
