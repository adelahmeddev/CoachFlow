export function getAppUrl() {
  const url =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")

  return url.replace(/\/+$/, "")
}

export function getInviteUrl(token: string) {
  return `${getAppUrl()}/invite/${token}`
}

export function getJoinUrl(slug: string) {
  return `${getAppUrl()}/join/${slug}`
}
