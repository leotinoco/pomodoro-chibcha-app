import { google } from "googleapis";

export interface GoogleTokenCredentials {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpires?: number;
}

export const getGoogleClient = (
  tokenOrAccessToken: string | GoogleTokenCredentials,
) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  if (typeof tokenOrAccessToken === "string") {
    auth.setCredentials({ access_token: tokenOrAccessToken });
  } else {
    auth.setCredentials({
      access_token: tokenOrAccessToken.accessToken,
      refresh_token: tokenOrAccessToken.refreshToken,
      expiry_date: tokenOrAccessToken.accessTokenExpires,
    });
  }

  return auth;
};
