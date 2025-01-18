export default defineNuxtConfig({
  modules: ['../src/module'],
  ssr: true,
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-09-28',
  codiexyAuth: {
    baseUrl: 'http://api.parivaar.test',
    mode: 'token',
    logLevel: 5,
    redirect: {
      keepRequestedRoute: true,
      onAuthOnly: '/login',
      onGuestOnly: '/profile',
      onLogin: '/dashboard',
      onLogout: '/logout',
    },
    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/api/v1/login',
      logout: '/api/v1/logout',
      user: '/api/v1/me',
    },
    globalMiddleware: {
      allow404WithoutAuth: true,
      enabled: false,
      prepend: false,
    },
  },
})