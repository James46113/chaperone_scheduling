<template>
  <div v-if="isMobile">
    <div style="display: flex; justify-content: center; align-items: center; height: 80vh;" class="pa-6">
      <v-card width="100vw" class="pa-4" elevation="0" height="38vh">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title class="text-h5">Welcome!</v-card-title>
        <v-card-text v-if="!loadingData" class="mt-4">Please sign in with Google to get started.</v-card-text>
        <v-card-text v-else class="mt-4">Signing you in...</v-card-text>
        <v-btn v-if="!loadingData" variant="outlined" @click="customLogin" class="text-body-2 ml-4">
          <img src="/Google__G__logo.svg" class="mr-2" />
          Sign in with Google
        </v-btn>
      </v-card>
    </div>
  </div>
  <div v-else>
    <div style="display: flex; justify-content: center; align-items: center; height: 60vh;">
      <v-card width="30vw" class="pa-4">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title>Sign In</v-card-title>
        <v-card-text v-if="!loadingData">Please sign in with Google to access the chaperone rota.</v-card-text>
        <v-card-text v-else>Signing you in...</v-card-text>
        <div v-if="!loadingData" style="display: flex; justify-content: center;">
          <v-btn variant="outlined" @click="customLogin" class="text-body-2">
            <img src="/Google__G__logo.svg" class="mr-2" />
            Sign in with Google
          </v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { GoogleLogin, decodeCredential, googleSdkLoaded } from 'vue3-google-login';
import { getCurrentInstance } from 'vue';

const store = useAppStore();
const { proxy } = getCurrentInstance();

onMounted(async () => {
  if (Cookies.get('refreshToken') && Cookies.get('credential') && Cookies.get('accessToken')) {
    await checkCredential();
    onSignIn({ credential: Cookies.get('credential') });
  }
})

const customLogin = () => {
  googleSdkLoaded(google => {
    google.accounts.oauth2.initCodeClient({
      client_id: "898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com",
      scope: 'openid email profile',
      redirect_uri: window.location.href,
      accessType: 'offline',
      callback: onCodeReceived
    }).requestCode();
  })
}

function onCodeReceived(response) {
  // Exchange the authorization code for tokens
  fetch('/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code: response.code })
  })
    .then(response => response.json())
    .then(data => {
      Cookies.set('credential', data.id_token);
      Cookies.set('accessToken', data.access_token);
      Cookies.set('refreshToken', data.refresh_token);
      onSignIn({ credential: data.id_token });
    })
    .catch(error => {
      console.error('Error exchanging code for tokens:', error);
    });
}

function onSignIn(response) {

  loadingData.value = true;
  store.userEmail = decodeCredential(response.credential).email;

  fetchAPI(`login/${store.userEmail}`, {
    method: 'GET',
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      loadingData.value = false;
      return Promise.reject(response);
    })
    .then((data) => {
      store.isAdmin = data.is_admin;
      store.userID = data.id;
      if (proxy.$route.query.redirect) {
        proxy.$router.push(proxy.$route.query.redirect);
      } else {
        proxy.$router.push('/');
      }
    })
    .catch((error) => {
      if (error.status === 401) {
        store.userEmail = '';
        store.isAdmin = false;
        store.userID = null
      }
      if (error.status === 403) {
        store.userEmail = '';
        store.isAdmin = false;
        store.userID = null
        store.showAlert('Unauthorised', "You are not authorised to access the chaperones' rota. If you believe this is in error, please contact the chaperoning team.");
      }
      console.error('Error:', error)
      loadingData.value = false;
    });
}

async function refreshToken() {
  try {
    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: Cookies.get('refreshToken') }),
    });
    const data = await response.json();
    Cookies.set('accessToken', data.access_token);
    onSignIn({ credential: data.id_token });
  } catch (error) {
    console.error('Error refreshing token:', error);
    googleLogout();
    proxy.$router.push('/login');
  }
}

const checkCredential = async () => {
  const credential = Cookies.get('credential');
  if (credential) {
    const decoded = decodeCredential(credential);
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      console.log('Token expired, refreshing...');
      await refreshToken();
      console.log('Token refreshed');
    }
  }
}

setInterval(checkCredential, 60000); // Check every minute
</script>