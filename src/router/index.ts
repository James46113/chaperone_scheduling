/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import { useAppStore } from '@/stores/app'
import { decodeCredential, googleLogout } from 'vue3-google-login'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

router.beforeEach((to, from, next) => {
  const store = useAppStore();

  if (!store.userEmail && to.path !== '/login' && import.meta.env.VITE_DEV != 1) {
    if (Cookies.get('credential')) {
      const credential = decodeCredential(Cookies.get('credential')) as { email: string };
      store.userEmail = credential.email;
      fetchAPI(`login/${store.userEmail}`, {
        method: 'GET',
      })
        .then((response: any) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject(response);
        })
        .then((data: any) => {
          store.isAdmin = data.is_admin;
          store.userID = data.id;
          next();
        })
        .catch((error: any) => {
          if (error.status === 401) {
            googleLogout();
            store.userEmail = '';
            store.isAdmin = false;
            store.userID = null
            next(`/login?redirect=${to.fullPath}`);
          }
        }
        );
    }
  }

  else {
    next();
  }
});

router.beforeEach((to, from, next) => {
  const store = useAppStore();

  if ((to.path.startsWith('/editEvent') ||
    to.path.startsWith('/templateEvents') ||
    to.path.startsWith('/users') ||
    to.path.startsWith('/availability')
  ) && !store.isAdmin && store.userEmail && import.meta.env.VITE_DEV != 1) {
    next('/');
  } else {
    next();
  }
})

export default router
