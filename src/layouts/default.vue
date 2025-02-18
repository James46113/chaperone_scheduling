<template>
  <v-main>
    <!-- <v-alert type="warning" v-if="proxy.$route.path != '/login' && !isDev">The rota was correct
      at time of entry. This system is
      not currently
      live. Do not rely on it to provide up-to-date information</v-alert> -->
    <router-view />

    <AlertDialog />

    <v-bottom-navigation v-if="isMobile && proxy.$route.path != '/login' && proxy.$route.path != '/offline'" grow
      color="primary">
      <v-btn @click="goHome('calendar')"><v-icon>mdi-calendar</v-icon></v-btn>
      <v-btn @click="goHome('list')"><v-icon>mdi-format-list-bulleted</v-icon></v-btn>
      <v-btn v-if="store.isAdmin" @click="goHome('chaperones')"><v-icon>mdi-account-multiple</v-icon></v-btn>
      <v-btn @click="goHome('schedule')"><v-icon>mdi-account</v-icon></v-btn>
    </v-bottom-navigation>

    <PWAInstallDialog />

  </v-main>

  <AppFooter v-if="!isMobile" />
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import Cookies from 'js-cookie';
import { GoogleLogin, decodeCredential, googleLogout } from 'vue3-google-login';

const { proxy } = getCurrentInstance();
const store = useAppStore();

// onMounted(() => {
if (isDev.value) {
  store.userEmail = "jamescaroe@gmail.com"
  store.userID = 8
  oauthCredential.value = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImVlYzUzNGZhNWI4Y2FjYTIwMWNhOGQwZmY5NmI1NGM1NjIyMTBkMWUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDU1NzE0NDg0OTQ2LXQxNDRyNmFmbzVnOTk5bDhtYWxramVzYXZoNHM5NWVxLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTA1NTcxNDQ4NDk0Ni10MTQ0cjZhZm81Zzk5OWw4bWFsa2plc2F2aDRzOTVlcS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwMzcxMDY4MDc5NDA0NTI2NzkzNSIsImVtYWlsIjoiamFtZXNjYXJvZUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmJmIjoxNzM5NDg0NDEyLCJuYW1lIjoiSmFtZXMgQ2Fyb2UiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSnY3M0ZDTkpmZ3d2OUNCVWFPZXY5WjN5bU1rYWlaOTBnRGVoYmQzWHo1aUZWOXNaZ1I9czk2LWMiLCJnaXZlbl9uYW1lIjoiSmFtZXMiLCJmYW1pbHlfbmFtZSI6IkNhcm9lIiwiaWF0IjoxNzM5NDg0NzEyLCJleHAiOjE3Mzk0ODgzMTIsImp0aSI6IjZhZDY2Y2Q5OTVhMzZiODEwOWVlZGIxYjliOTdjMDcxNTllMjRiYTgifQ.oLH1FRwxaZruPwxW5e8Mj-1wYcy7hkaIoGjehgFM-d3CKLAESt4NSNotbyaz1pRGfY1_uGRJpSzsFzZVDrp1JPWuSxP1AkPAoiOX6tre5mAyH266NkX4bkBcTjp8Fg_47MVaW0Torp6STkzFHAstJbB0SnPXJiwcuGVdFc_lN3nRk_2DIAs6sEi3iQeJ52g3WfYR-5-6rGGVchWEnQWsCxTzw5Yf6pQ8Jx2TUUocurBQYDkm1W_Na1Clgy1E8Sj4l4MzA9DnWmPl38vL9HMIboUBxJ4zzMKxvQJ5BchPYfGV8jMQo-Wzr1dxhez8DbVAg7hjqKwdwBPYD7sYsBdxkg'
  store.isAdmin = true
  console.log('Dev mode')
}
if (Cookies.get('credential')) {
  onSignIn({ credential: Cookies.get('credential') });
}

function onSignIn(response) {
  loadingData.value = true;
  Cookies.set('credential', response.credential);
  oauthCredential.value = response.credential;
  store.userEmail = decodeCredential(response.credential).email;
  fetchAPI(`login/${store.userEmail}`, {
    method: 'GET',
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else if (response.status === 401) {
        refreshToken().then(() => onSignIn({ credential: Cookies.get('credential') }));
      } else {
        return Promise.reject(response);
      }
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
      if (error.status === 403) {
        googleLogout();
        store.userEmail = '';
        store.isAdmin = false;
        store.userID = null
        store.showAlert('Unauthorised', "You are not authorised to access the chaperones' rota. If you believe this is in error, please contact the chaperoning team.");
      }
      console.error('Error:', error)
    });
}

async function refreshToken() {
  const refreshToken = Cookies.get('refreshToken');
  if (!refreshToken) {
    return;
  }

  try {
    const response = await fetch('/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const tokens = await response.json();
      Cookies.set('credential', tokens.id_token);
      Cookies.set('refreshToken', tokens.refresh_token);
    } else {
      throw new Error('Failed to refresh token');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    googleLogout();
    store.userEmail = '';
    store.isAdmin = false;
    store.userID = null;
  }
}
// })

onMounted(() => window.scrollTo(0, 0))

const goHome = (tab) => {
  store.tabView = tab;
  proxy.$router.push(`/?view=${tab}`)
}
</script>