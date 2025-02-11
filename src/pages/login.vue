<template>
  <div style="display: flex; justify-content: center; align-items: center; height: 60vh;">
    <v-card :width="store.isMobile ? '100vw' : '30vw'" class="pa-4">
      <v-img src="/Steel-City-Choristers.png" max-width="200" />
      <v-card-title>Login</v-card-title>
      <v-card-text>Please login with Google to access the chaperone schedule.</v-card-text>
      <div style="display: flex; justify-content: center;">
        <GoogleLogin :callback="onSignIn" auto-login prompt />
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { GoogleLogin, decodeCredential, googleLogout } from 'vue3-google-login';
import { getCurrentInstance } from 'vue';

const store = useAppStore();
const { proxy } = getCurrentInstance();


function onSignIn(response) {
  store.userEmail = decodeCredential(response.credential).email;
  fetch(`https://chaperoneschedulingapi-production-b505.up.railway.app/login/${store.userEmail}`, {
    method: 'GET',
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .then((data) => {
      store.isAdmin = data.is_admin
      proxy.$router.push('/');
    })
    .catch((error) => {
      if (error.status === 401) {
        googleLogout();
        store.userEmail = '';
        store.isAdmin = false;
        store.showAlert('Unauthorised', "You are not authorised to access the chaperones' schedule. If you believe this is in error, please contact the chaperoning team.");
      }
      console.error('Error:', error)
    });
}


</script>