export const fetchAPI = async (url, params) => {
  const headers = {
    ...(params.headers || {}),
    'Authorization': `${window.location.href.startsWith('https://chaperonescheduling-dev.up.railway.app') ? 'https://chaperoneschedulingapi-dev.up.railway.app/' : import.meta.env.VITE_API_KEY}`
  };

  console.log(window.location.href.startsWith('https://chaperonescheduling-dev.up.railway.app'), 'https://chaperoneschedulingapi-dev.up.railway.app/', import.meta.env.VITE_API_KEY)

  return fetch(import.meta.env.VITE_API_URL + url, {
    ...params,
    headers
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
export const loadingData = ref(false);
export const loadingAvailability = ref(false);
export const isDev = computed(() => import.meta.env.VITE_DEV == 1);
export const isPWA = computed(() => window.matchMedia('(display-mode: standalone)').matches)