export const fetchAPI = async (url, params) => {
  const headers = {
    ...(params.headers || {}),
    'Authorization': `${import.meta.env.VITE_API_KEY}`
  };
  return fetch(import.meta.env.VITE_API_URL + url, {
    ...params,
    headers
  });
};

export const isMobile = computed(() => window.innerWidth < 768);

export const loadingData = ref(false);