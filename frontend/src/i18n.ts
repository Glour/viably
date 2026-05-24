import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get('locale')?.value ?? 'en'
  const validLocales = ['en', 'ru', 'pt']
  const resolved = validLocales.includes(locale) ? locale : 'en'
  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
  }
})
