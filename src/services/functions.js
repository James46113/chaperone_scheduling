export const fetchAPI = async (url, params) => {
  const headers = {
    ...(params.headers || {}),
    'Authorization': `${import.meta.env.VITE_API_KEY}`
  };

  return fetch(url, {
    ...params,
    headers
  });
};