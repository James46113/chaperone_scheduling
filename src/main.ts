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
  clientId: "898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com"
})

registerPlugins(app)

app.mount('#app')
