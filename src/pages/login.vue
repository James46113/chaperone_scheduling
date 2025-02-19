<template>
  <div v-if="!loadingData">
    <div style="display: flex; justify-content: center; align-items: center; height: 60vh;" v-if="!isMobile">
      <v-card :width="isMobile ? '100vw' : '30vw'" class="pa-4">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title>Login</v-card-title>
        <v-card-text>Please sign in with Google to access the chaperone rota.</v-card-text>
        <v-card-text class="text-caption mt-n3">
          <i>You may have to sign in again after a period of inactivity for security reasons </i>
        </v-card-text>
        <div style="display: flex; justify-content: center;">
          <GoogleLogin :callback="onSignIn" prompt auto-login />
        </div>
        <v-btn variant="flat" color="primary" @click="customLogin">Login</v-btn>
      </v-card>
    </div>
    <div v-else style="display: flex; justify-content: center; align-items: center; height: 80vh;" class="pa-6">
      <v-card :width="'100vw'" class="pa-4" elevation="0">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title class="text-h5">Welcome!</v-card-title>
        <v-card-text class="mt-4">Please sign in with Google to get started.</v-card-text>
        <GoogleLogin :callback="onSignIn" :access-type="'offline'" />
      </v-card>
      <v-card-text class="text-caption mx-4" style="position: absolute; bottom: 0; text-align: center;">
        <i>You may have to sign in again after a period of inactivity for security reasons.</i>
      </v-card-text>
    </div>
  </div>
  <div v-else class=" d-flex justify-center align-center" style="height: 100vh;">
    <v-progress-circular color="primary" indeterminate size="40" />
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { GoogleLogin, decodeCredential, googleSdkLoaded } from 'vue3-google-login';
import { getCurrentInstance } from 'vue';

const store = useAppStore();
const { proxy } = getCurrentInstance();

// onMounted(() => {
const credential = Cookies.get('credential');
if (credential) {
  onSignIn({ credential });
}
// })

const customLogin = () => {
  googleSdkLoaded(google => {
    google.accounts.oauth2.initCodeClient({
      client_id: "898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com",
      scope: 'openid email profile',
      redirect_uri: window.location.href,
      accessType: 'offline',
      callback: (e) => console.log(JSON.stringify(e))
    }).requestCode();
    // google.accounts.oauth2.initTokenClient({
    //   client_id: "898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com",
    //   scope: 'openid email profile',
    //   redirect_uri: window.location.href,
    //   accessType: 'offline',
    //   prompt: 'consent',
    //   callback: (e) => console.log(JSON.stringify(e))
    // }).requestAccessToken();
    // google.accounts.id.initialize({
    //   client_id: "898082729738-m1b4g6ls0l88lvosj3pb79ki7buid87p.apps.googleusercontent.com",
    //   callback: (e) => console.log(JSON.stringify(e))
    // });
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
  Cookies.set('credential', response.credential);
  store.userEmail = decodeCredential(response.credential).email;
  console.log(response)

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

// setInterval(() => {
//   const credential = Cookies.get('credential');
//   if (credential) {
//     const decoded = decodeCredential(credential);
//     const now = Math.floor(Date.now() / 1000);
//     if (decoded.exp < now) {
//       refreshToken();
//     }
//   }
// }, 60000); // Check every minute
</script>