<template>
  <div v-if="loadingData">
    <div style="display: flex; justify-content: center; align-items: center; height: 60vh;" v-if="!isMobile">
      <v-card :width="isMobile ? '100vw' : '30vw'" class="pa-4">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title>Login</v-card-title>
        <v-card-text>Please sign in with Google to access the chaperone rota.</v-card-text>
        <div style="display: flex; justify-content: center;">
          <GoogleLogin :callback="onSignIn" />
        </div>
      </v-card>
    </div>
    <div v-else style="display: flex; justify-content: center; align-items: center; height: 80vh;" class="pa-6">
      <v-card :width="'100vw'" class="pa-4" elevation="0">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title class="text-h5">Welcome!</v-card-title>
        <v-card-text class="my-4">Please sign in with Google to get started.</v-card-text>
        <GoogleLogin :callback="onSignIn" />
      </v-card>
    </div>
  </div>
  <div v-else class="d-flex justify-center align-center" style="height: 100vh;">
    <v-progress-circular color="primary" indeterminate size="40" />
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { GoogleLogin, decodeCredential, googleLogout } from 'vue3-google-login';
import { getCurrentInstance } from 'vue';

const store = useAppStore();
const { proxy } = getCurrentInstance();

// onMounted(() => {
const credential = Cookies.get('credential');
if (credential) {
  onSignIn({ credential });
}
// })

function onSignIn(response) {
  loadingData.value = true;
  Cookies.set('credential', response.credential);
  store.userEmail = decodeCredential(response.credential).email;
  fetchAPI(`login/${store.userEmail}`, {
    method: 'GET',
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
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
        googleLogout();
        store.userEmail = '';
        store.isAdmin = false;
        store.userID = null
        store.showAlert('Unauthorised', "You are not authorised to access the chaperones' rota. If you believe this is in error, please contact the chaperoning team.");
      }
      console.error('Error:', error)
    });
}


</script>