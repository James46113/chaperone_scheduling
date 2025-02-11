export const fetchAPI = async (url, params) => {
  const headers = {
    ...(params.headers || {}),
    'Authorization': `Bearer ${process.env.API_KEY}`
  };

  return fetch(url, {
    ...params,
    headers
  });
};