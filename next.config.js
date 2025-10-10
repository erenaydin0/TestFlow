import nextI18nextConfig from './next-i18next.config.js'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable, no need for experimental flag
  i18n: nextI18nextConfig.i18n,
}

export default nextConfig 