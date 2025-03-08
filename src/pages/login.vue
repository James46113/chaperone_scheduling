<template>
  <div v-if="isMobile">
    <div style="display: flex; justify-content: center;" class="pa-6">
      <v-card width="100vw" class="pa-4" elevation="0" style="position: absolute; top: 14vh">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title class="text-h5">Welcome!</v-card-title>
        <v-card-text v-if="signingIn" class="mt-4">Signing you in...</v-card-text>
        <v-btn v-if="signingIn" color="primary" class="ml-4 mb-2" @click="cancelSignIn">Cancel</v-btn>
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

            <v-card-text class="text-primary my-n3" style="text-align: center;" v-if="incorrectPassword">Incorrect email
              or
              password</v-card-text>

            <v-btn @click="passwordLogin" :loading="signingIn" color="primary" class="mt-4" width="100%">Sign In</v-btn>

            <v-btn variant="outlined" :disabled="signingIn" width="100%" @click="customLogin" class="text-body-2 mt-4">
              <img src="/Google__G__logo.svg" class="mr-2" />
              Sign in with Google
            </v-btn>
          </div>
          <div v-else>
            <v-btn color="primary" :disabled="resetTimeout > 0" width="100%" :loading="awaitingPasswordReset"
              @click="resetPassword" class="mt-4">Reset Password</v-btn>
            <v-card-text v-if="resetTimeout > 0" class="text-primary mt-0 mb-n6" style="text-align: center;">Please wait
              {{
                resetTimeout }} seconds before trying again.</v-card-text>
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
        <v-card-text v-if="signingIn">Signing you in...</v-card-text>
        <v-btn v-if="signingIn" color="primary" class="ml-4 mb-2" @click="cancelSignIn">Cancel</v-btn>
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

            <v-card-text class="text-primary my-n3" style="text-align: center;" v-if="incorrectPassword">Incorrect email
              or
              password</v-card-text>

            <v-btn @click="passwordLogin" :loading="signingIn" color="primary" class="mt-4" width="100%">Sign In</v-btn>

            <v-btn variant="outlined" :disabled="signingIn" width="100%" @click="customLogin" class="text-body-2 mt-4">
              <img src="/Google__G__logo.svg" class="mr-2" />
              Sign in with Google
            </v-btn>
          </div>
          <div v-else>
            <v-btn color="primary" width="100%" :loading="awaitingPasswordReset" @click="resetPassword" class="mt-4"
              :disabled="resetTimeout > 0">Reset Password</v-btn>

            <v-card-text v-if="resetTimeout > 0" class="text-primary mt-2 mb-n6" style="text-align: center;">Please wait
              {{
                resetTimeout }} seconds before trying again.</v-card-text>

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
const resetTimeout = ref(0);

setInterval(() => { if (resetTimeout.value > 0) resetTimeout.value -= 1 }, 1000)

onMounted(async () => {
  if (Cookies.get('refreshToken') && Cookies.get('credential') && Cookies.get('accessToken')) {
    signingIn.value = true;
    await checkCredential();
    onSignIn({ credential: Cookies.get('credential') });
  } else if (Cookies.get('passwdAccessToken')) {
    signingIn.value = true;
    usingPasswordLogin.value = true;
    tokenLogin();
  }
})

const cancelSignIn = () => {
  signingIn.value = false;
  Cookies.remove('passwdAccessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('accessToken');
  Cookies.remove('credential');
  store.userID = null;
  store.isAdmin = false;
  store.userEmail = '';
  isSignedIn.value = false;
}

const tokenLogin = async () => {
  signingIn.value = true;
  const token = Cookies.get('passwdAccessToken');
  fetch('/api/public/login/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, fingerprint }),
  }).then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error('Invalid token');
  }).then(data => {
    store.userID = data.id;
    store.isAdmin = data.is_admin;
    store.userEmail = data.email;
    isSignedIn.value = true;
    proxy.$router.push('/');
    console.log('Logged in with token');
  }).catch(error => {
    Cookies.remove('passwdAccessToken');
    signingIn.value = false;
  })
}


const passwordLogin = async () => {
  incorrectPassword.value = false;
  signingIn.value = true;
  try {
    const response = await fetch('/api/public/login/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.value, password: password.value, fingerprint }),
    });

    if (response.ok) {
      const responseJson = await response.json();
      Cookies.set('passwdAccessToken', responseJson.access_token);
      store.userID = responseJson.id;
      store.isAdmin = responseJson.is_admin;
      store.userEmail = responseJson.email;
      usingPasswordLogin.value = true;
      isSignedIn.value = true;
      proxy.$router.push('/');
      console.log('Logged in with password');
    } else {
      incorrectPassword.value = true;
      signingIn.value = false;
    }

  } catch (error) {
    console.error('Error:', error);
    store.showAlert('Error', 'An error occurred while signing in.');
    signingIn.value = false;
  }
}

const resetPassword = () => {
  awaitingPasswordReset.value = true;
  const token = window.location.hostname + "/resetPassword?token=" + uuidv4();

  if (email.value === '') {
    store.showAlert('Error', 'Please enter your email address to reset your password.');
    return;
  }

  if (!email.value.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)) {
    store.showAlert('Error', 'Please enter a valid email address.');
    awaitingPasswordReset.value = false;
    return;
  }

  fetch('/api/public/forgot_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: email.value, token: token }),
  })
    .then(response => {
      switch (response.status) {
        case 201:
          resetTimeout.value = 30;
          store.showAlert('Password Reset', 'An email has been sent to reset your password.');
          break;

        case 404:
          resetTimeout.value = 30;
          store.showAlert('Password Reset', 'An email has been sent to reset your password.');
          break;

        default:
          store.showAlert('Error', 'An error occurred while resetting your password.');
          break;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      store.showAlert('Error', 'An error occurred while resetting your password.');
    }).finally(() => {
      awaitingPasswordReset.value = false;
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
      Cookies.remove('credential');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      signingIn.value = false;
    });
}

function onSignIn(response) {

  store.userEmail = decodeCredential(response.credential).email;

  fetchAPI(`login/${store.userEmail}`, {
    method: 'GET',
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      signingIn.value = false;
      return Promise.reject(response);
    })
    .then((data) => {
      console.log(`Logged in with google`);
      store.isAdmin = data.is_admin;
      store.userID = data.id;
      isSignedIn.value = true;
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
