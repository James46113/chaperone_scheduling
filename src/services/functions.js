import { getFingerprint } from "@thumbmarkjs/thumbmarkjs";
import Cookies from "js-cookie";

export const fetchAPI = async (url, params) => {
  const headers = {
    ...(params.headers || {}),
    'Authorization': `Bearer ${Cookies.get('accessToken')}`,
    'token': Cookies.get('passwdAccessToken'),
    'fingerprint': fingerprint,
  };
  console.log(`fingerprint: ${headers.fingerprint}`);
  // const APIURL = window.location.href.startsWith('https://chaperonescheduling-dev.up.railway.app')
  //   ? 'https://chaperone_scheduling_api.railway.internal:5000/' : import.meta.env.VITE_API_URL;
  let APIURL;
  if (usingPasswordLogin.value) {
    APIURL = '/api/p/';
  } else {
    APIURL = '/api/'
  }

  return fetch(APIURL + url, {
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
