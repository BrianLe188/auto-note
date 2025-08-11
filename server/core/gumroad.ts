import dotenv from "dotenv";

dotenv.config();

function createFetchWithBaseURL(baseUrl: string) {
  return (endpoint: string, options?: RequestInit) => {
    const url =
      baseUrl.replace(/\/+$/, "") + "/" + endpoint.replace(/^\/+/, "");
    return fetch(url, options);
  };
}

export const GUMROAD_CONFIG = {
  accessToken: process.env.GUMROAD_ACCESS_TOKEN,
};

export const gumroadFetch = createFetchWithBaseURL(
  process.env.GUMROAD_API_URL!,
);
