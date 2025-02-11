/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

import vue3GoogleLogin from 'vue3-google-login'

const app = createApp(App)
app.use(vue3GoogleLogin, {
  clientId: "1055714484946-t144r6afo5g999l8malkjesavh4s95eq.apps.googleusercontent.com"
})

registerPlugins(app)

app.mount('#app')
