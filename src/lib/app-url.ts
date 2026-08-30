export function getAppUrl() {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL) ??
    "http://localhost:3000"

  return url.replace(/\/+$/, "")
}

export function getInviteUrl(token: string) {
  return `${getAppUrl()}/invite/${token}`
}

export function getJoinUrl(slug: string) {
  return `${getAppUrl()}/join/${slug}`
}
