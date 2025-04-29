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
import event from '@/pages/event.vue'
import schedule from '@/pages/schedule.vue'
import editEventChaperones from '@/pages/editEventChaperones.vue'
import templateEvents from '@/pages/templateEvents.vue'
import editEvent from '@/pages/editEvent.vue'
import newEvent from '@/pages/newEvent.vue'

const newRoutes = [
  ...routes,
  {
    path: '/event/:id',
    component: event,
  },
  {
    path: '/event/:id/edit',
    component: editEvent,
  },
  {
    path: '/event/new',
    component: newEvent,
  },
  {
    path: '/chaperones/:id',
    component: schedule,
  },
  {
    path: '/event/:id/edit/chaperones',
    component: editEventChaperones,
  },
  {
    path: '/templates',
    component: templateEvents,
  },
  {
    path: '/templates/:id/edit',
    component: editEvent,
  },
  {
    path: '/templates/new',
    component: newEvent,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(newRoutes),
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

router.afterEach((to, from) => window.scrollTo(0, 0))

router.beforeEach((to, from, next) => {
  const store = useAppStore();
  if (!isSignedIn.value && to.path !== '/login' && to.path !== '/resetPassword' && !offline.value) {
    next(`/login?redirect=${to.fullPath}`);
    console.log(`Redirecting to login. Offline: ${!window.navigator.onLine}`);
  }
  else if ((to.path.endsWith('/edit') ||
    to.path.startsWith('/templates') ||
    to.path.startsWith('/users') ||
    to.path.startsWith('/availability') ||
    to.path.startsWith('/chaperones')
  ) && !store.isAdmin) {
    next('/');
  }
  else if (to.path.endsWith('/edit') && offline.value) {
    next('/');
  } 
  else if (offline.value) {
    store.isAdmin = Cookies.get('isAdmin') == 'true';
    store.userID = Cookies.get('userID');
    next()
  }
  else {
    next();
  }
});

export default router
