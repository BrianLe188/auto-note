export async function getUserInfoFromToken(token: string) {
  const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return await resp.json();
}
