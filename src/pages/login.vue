<template>
  <div v-if="isMobile">
    <div style="display: flex; justify-content: center;" class="pa-6">
      <v-card width="100vw" class="pa-4" elevation="0" style="position: absolute; top: 14vh">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title class="text-h5">Welcome!</v-card-title>
        <v-card-text v-if="loadingData" class="mt-4">Signing you in...</v-card-text>
        <div v-else-if="googleLogin">
          <v-card-text>Please sign in with Google to access the chaperone
            rota.</v-card-text>
          <v-btn variant="outlined" @click="customLogin" class="text-body-2 ml-4">
            <img src="/Google__G__logo.svg" class="mr-2" />
            Sign in with Google
          </v-btn>
          <v-card-text class="text-caption text-disabled" @click="googleLogin = false">Sign in with
            password</v-card-text>
        </div>
        <div v-else>
          <div class="text-subtitle-1 text-medium-emphasis mt-2 mb-1">Email</div>
          <v-text-field density="compact" prepend-inner-icon="mdi-email-outline" variant="outlined" color="primary"
            placeholder="Your Email" v-model="email" type="email" />

          <div v-if="!resettingPassword">
            <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between mb-n1">
              Password
              <span tabindex="-1" style="cursor: pointer;" class="text-caption text-decoration-none text-primary"
                @click="resettingPassword = true">
                Forgot password?</span>
            </div>

            <v-text-field density="compact" prepend-inner-icon="mdi-lock-outline"
              @click:append-inner="passwordVisible = !passwordVisible"
              :append-inner-icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'" variant="outlined" color="primary"
              placeholder="Your Password" v-model="password" :type="passwordVisible ? 'text' : 'password'" class="mt-2"
              @keyup.enter="passwordLogin" />

            <v-card-text class="text-primary" v-if="incorrectPassword">Incorrect email or password</v-card-text>

            <v-btn @click="passwordLogin" :loading="signingIn" color="primary" class="mt-4" width="100%">Sign In</v-btn>

            <v-btn variant="outlined" :disabled="signingIn" width="100%" @click="customLogin" class="text-body-2 mt-4">
              <img src="/Google__G__logo.svg" class="mr-2" />
              Sign in with Google
            </v-btn>
          </div>
          <div v-else>
            <v-btn color="primary" width="100%" :loading="awaitingPasswordReset" @click="resetPassword"
              class="mt-4">Reset Password</v-btn>
            <v-card-text @click="resettingPassword = false" class="text-primary mt-2"
              style="text-align: center; cursor: pointer;">Back to Sign
              in</v-card-text>
          </div>
        </div>
      </v-card>
    </div>
  </div>
  <div v-else>
    <div style="display: flex; justify-content: center;" class="pa-6">
      <v-card width="30vw" class="pa-4" style="position: absolute; top: 14vh">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title>Welcome!</v-card-title>
        <v-card-text v-if="loadingData">Signing you in...</v-card-text>
        <div v-else-if="googleLogin">
          <v-card-text>Please sign in with Google to access the chaperone rota.</v-card-text>
          <div style="display: flex; justify-content: center;">
            <div>
              <v-btn variant="outlined" @click="customLogin" class="text-body-2 mt-4">
                <img src="/Google__G__logo.svg" class="mr-2" />
                Sign in with Google
              </v-btn>
              <v-card-text @click="googleLogin = false" class="text-caption text-disabled"
                style="text-align: center; cursor: pointer;">Sign in with
                password</v-card-text>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="text-subtitle-1 text-medium-emphasis mt-2 mb-1">Email</div>
          <v-text-field density="compact" prepend-inner-icon="mdi-email-outline" variant="outlined" color="primary"
            placeholder="Your Email" v-model="email" type="email" />

          <div v-if="!resettingPassword">
            <div class="text-subtitle-1 text-medium-emphasis d-flex align-center justify-space-between mb-n1">
              Password
              <span tabindex="-1" style="cursor: pointer;" class="text-caption text-decoration-none text-primary"
                @click="resettingPassword = true">
                Forgot password?</span>
            </div>

            <v-text-field density="compact" prepend-inner-icon="mdi-lock-outline"
              @click:append-inner="passwordVisible = !passwordVisible"
              :append-inner-icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'" variant="outlined" color="primary"
              placeholder="Your Password" v-model="password" :type="passwordVisible ? 'text' : 'password'" class="mt-2"
              @keyup.enter="passwordLogin" />

            <v-card-text class="text-primary" v-if="incorrectPassword">Incorrect email or password</v-card-text>

            <v-btn @click="passwordLogin" :loading="signingIn" color="primary" class="mt-4" width="100%">Sign In</v-btn>

            <v-btn variant="outlined" :disabled="signingIn" width="100%" @click="customLogin" class="text-body-2 mt-4">
              <img src="/Google__G__logo.svg" class="mr-2" />
              Sign in with Google
            </v-btn>
          </div>
          <div v-else>
            <v-btn color="primary" width="100%" :loading="awaitingPasswordReset" @click="resetPassword"
              class="mt-4">Reset Password</v-btn>
            <v-card-text @click="resettingPassword = false" class="text-primary mt-2"
              style="text-align: center; cursor: pointer;">Back to Sign
              in</v-card-text>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { GoogleLogin, decodeCredential, googleSdkLoaded } from 'vue3-google-login';
import { getCurrentInstance } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { getFingerprint } from '@thumbmarkjs/thumbmarkjs';

const store = useAppStore();
const { proxy } = getCurrentInstance();
const googleLogin = ref(true);
const passwordVisible = ref(false);
const signingIn = ref(false);

const email = ref('');
const password = ref('');
const resettingPassword = ref(false);
const awaitingPasswordReset = ref(false)
const incorrectPassword = ref(false)

onMounted(async () => {
  if (Cookies.get('refreshToken') && Cookies.get('credential') && Cookies.get('accessToken')) {
    await checkCredential();
    onSignIn({ credential: Cookies.get('credential') });
  }
})

const passwordLogin = async () => {
  incorrectPassword.value = false;
  const fingerprint = await getFingerprint();
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.value, password: password.value, fingerprint }),
    });

    if (!response.ok) {
      const responseJson = await response.json();
      Cookies.set('passwdAccessToken', responseJson.accessToken);
      store.userID = responseJson.id;
      store.isAdmin = responseJson.is_admin;
      store.userEmail = responseJson.email;
      usingPasswordLogin.value = true;
      isSignedIn.value = true;
      proxy.$router.push('/');
    } else {
      incorrectPassword.value = true;

    }

  } catch (error) {
    console.error('Error:', error);
    store.showAlert('Error', 'An error occurred while signing in.');
    signingIn.value = false;
  }
  alert('Password login not implemented yet');
}

const resetPassword = () => {
  awaitingPasswordReset.value = true;
  const token = window.location.hostname + "/resetPassword?token=" + uuidv4();

  if (email.value === '') {
    store.showAlert('Error', 'Please enter your email address to reset your password.');
    return;
  }

  fetch('/api/p/reset/forgot_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: email.value, token: token }),
  })
    .then(response => {
      if (response.ok) {
        store.showAlert('Password Reset', 'An email has been sent to reset your password.');
      } else {
        store.showAlert('Error', 'An error occurred while resetting your password.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      store.showAlert('Error', 'An error occurred while resetting your password.');
    }).finally(() => {
      awaitingPasswordReset.value = false;
      resettingPassword.value = false;
    });
}


const customLogin = () => {
  signingIn.value = true;
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
      if (undefined in [data.id_token, data.access_token, data.refresh_token]) {
        throw new Error('Invalid response from server');
      }
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
      signingIn.value = false;
      return Promise.reject(response);
    })
    .then((data) => {
      store.isAdmin = data.is_admin;
      store.userID = data.id;
      isSignedIn.value = true;
      loadingData.value = false;
      signingIn.value = false;
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
      signingIn.value = false;
    });
}

async function refreshToken() {
  try {
    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: Cookies.get('refreshToken') }),
    });
    if (!response.ok) {
      throw new Error('Error refreshing token');
    }
    const data = await response.json();
    if (undefined in [data.id_token, data.access_token]) {
      throw new Error('Invalid response from server');
    }
    Cookies.set('accessToken', data.access_token);
    Cookies.set('credential', data.id_token);
    onSignIn({ credential: data.id_token });
  } catch (error) {
    console.error('Error refreshing token:', error);
    loadingData.value = false;
    signingIn.value = false;
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