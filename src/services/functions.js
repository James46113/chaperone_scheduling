import { getFingerprint } from "@thumbmarkjs/thumbmarkjs";
import Cookies from "js-cookie";

export const fetchAPI = async (url, params) => {
  const headers = {
    ...(params.headers || {}),
    'Authorization': `Bearer ${Cookies.get('accessToken')}`,
    'token': Cookies.get('passwdAccessToken'),
    'fingerprint': fingerprint,
  };
  // const APIURL = window.location.href.startsWith('https://chaperonescheduling-dev.up.railway.app')
  //   ? 'https://chaperone_scheduling_api.railway.internal:5000/' : import.meta.env.VITE_API_URL;
  let APIURL;
  // if (!isSignedIn.value && window.location.hostname === 'localhost') {
  //   APIURL = "";
  // } else
  if (usingPasswordLogin.value) {
    APIURL = '/api/p/';
  } else {
    APIURL = '/api/'
  }

  let HOSTNAME;
  if (window.location.hostname === 'localhost') {
    HOSTNAME = 'https://chaperones.steelcitychoristers.org.uk';
  } else {
    HOSTNAME = ''
  }

  return fetch(HOSTNAME + APIURL + url, {
    ...params,
    headers
  }).then((response) => {
    if (response.status === 401) {
      Cookies.remove('credential');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('passwdAccessToken');

      window.location.href = '/login';
    }
    return response;
  })
    .catch((e) => {
      console.error(e);
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

export const offline = ref(window.navigator.onLine === false);
window.addEventListener('online', () => { offline.value = false });
window.addEventListener('offline', () => { 
  offline.value = true;
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/login')) {
    window.location.href = '/';
  }
});


export const notificationsSubscribe = async (userID) => {
      const subscription = await serviceworker.value.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BDxiXIhjftxcAEVif8XED2Qah1j6FFZUO8iN2GFDK_aadrb2ad23Z_i85whgM2TIJ3uKGXntjTbc0m8C-4r4pjc'
      });

      await fetchAPI(`notifications/subscribe/${userID}`, {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' }
      });

}