import { getFingerprint } from "@thumbmarkjs/thumbmarkjs";
import Cookies from "js-cookie";
import { getCurrentInstance } from "vue";

export const fetchAPI = async (url, params, redirect = true) => {
  let authHeader = null;
  if (usingPasswordLogin.value) {
    authHeader = { 'token': Cookies.get('passwdAccessToken'), 'fingerprint': fingerprint };
  } else {
    authHeader = { 'oAuthToken': Cookies.get('accessToken') };
  }
  const headers = {
    ...(params.headers || {}),
    ...authHeader,
  };

  return fetch(url + `?cb=${Date.now()}`, {
    ...params,
    headers
  }).then((response) => {
    if (response.status === 401 && !offline.value && redirect) {
      Cookies.remove('credential');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('passwdAccessToken');

      window.location.href = '/login';
    }
    return response;
  })
    .catch((e) => {
      console.error('Error fetching API:', e);
    })
};



const windowWidth = ref(window.innerWidth);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

window.addEventListener('resize', handleResize);

export const isMobile = computed(() => windowWidth.value < 768);
export let fingerprint = null;
getFingerprint().then((f) => {
  fingerprint = f;
});
export const loadingData = ref(false);
export const loadingAvailability = ref(false);
export const isDev = computed(() => import.meta.env.VITE_DEV == 1);
export const isPWA = computed(() => window.matchMedia('(display-mode: standalone)').matches)
export const isSignedIn = ref(false);
export const usingPasswordLogin = ref(false);
export const serviceworker = ref(null);


export const offline = ref(false);
window.addEventListener('online', () => { offline.value = false });
window.addEventListener('offline', () => {
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/login')) {
    window.location.href = '/';
  }
});


function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}


export const notificationsSubscribe = async (userID) => {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    // alert('Notifications are not enabled.');
    return;
  }

  const subscription = await serviceworker.value.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array('BDxiXIhjftxcAEVif8XED2Qah1j6FFZUO8iN2GFDK_aadrb2ad23Z_i85whgM2TIJ3uKGXntjTbc0m8C-4r4pjc')
  });

  await fetchAPI(`/api/notifications/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ subscription, chaperone_id: userID }),
    headers: { 'Content-Type': 'application/json' }
  });

}

