<template>
  <v-app-bar height="100" class="d-flex justify-space-between align-center">
    <img class="ml-4 mb-4" src="/Steel-City-Choristers.png" width="130px" contain @click="proxy.$router.push('/')" />
    <v-card-title class="text-h5 mt-4 ml-4" v-if="!isMobile">Chaperones</v-card-title>
    <v-spacer />
  </v-app-bar>

  <div v-if="validToken" style="display: flex; justify-content: center;">
    <v-card class="mx-auto mt-8 pa-4" :width="isMobile ? '100vw' : '40vw'" elevation="0">
      <v-card-title class="text-h5">Reset Password</v-card-title>
      <v-card-text>Resetting your password will sign you out on all devices. You will have to sign in again with your
        new password.</v-card-text>
      <v-form width="100vw">
        <v-text-field v-show="false" label="Username" autocomplete="username"></v-text-field>
        <!-- Hidden field to prevent autofill -->

        <div class="text-subtitle-1 text-medium-emphasis mt-2 mb-1">New Password</div>
        <v-text-field density="compact" prepend-inner-icon="mdi-lock-outline"
          @click:append-inner="passwordVisible = !passwordVisible"
          :append-inner-icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'" variant="outlined" color="primary"
          placeholder="New Password" v-model="password" :type="passwordVisible ? 'text' : 'password'" class="mt-2"
          @keyup.enter="resetPassword" autocomplete="new-password" width="100%" />

        <div class="text-subtitle-1 text-medium-emphasis mb-1">Confirm Password</div>
        <v-text-field density="compact" prepend-inner-icon="mdi-lock-outline"
          @click:append-inner="passwordVisible = !passwordVisible" variant="outlined" color="primary"
          placeholder="Confirm Password" v-model="confirmPassword" :type="passwordVisible ? 'text' : 'password'"
          class="mt-2" @keyup.enter="resetPassword" autocomplete="new-password" width="100%"
          :rules="[passwordsMatch]" />

        <v-card-text class="mt-n4" style="font-size: small;">New password must have:</v-card-text>
        <v-card-text class="pt-0 mt-n2 ml-7" style="font-size: small;">
          <ul>
            <li :class="hasLowercase ? '' : 'text-primary'">Lowercase Character (a-z)</li>
            <li :class="hasUppercase ? '' : 'text-primary'">Uppercase Character (A-Z)</li>
            <li :class="hasNumber ? '' : 'text-primary'">Number (0-9)</li>
            <li :class="hasSpecial ? '' : 'text-primary'">Special Character (!@&...)</li>
            <li :class="isLongEnough ? '' : 'text-primary'">At least 8 characters</li>
          </ul>
        </v-card-text>

        <v-btn color="primary" variant="flat" class="mt-4" @click="resetPassword" width="100vw">Reset Password</v-btn>
      </v-form>
    </v-card>
  </div>
  <div v-else-if="validToken === false" style="display: flex; justify-content: center;">
    <v-card class="mx-auto mt-8 pa-4" :width="isMobile ? '100vw' : '40vw'" elevation="0">
      <v-card-title class="text-h5">Invalid Token</v-card-title>
      <v-card-text>
        The link you are using to reset your password is invalid. Please request a new link from the password reset
        page.
      </v-card-text>
    </v-card>
  </div>

</template>

<script setup>
import { useAppStore } from '@/stores/app';


const { proxy } = getCurrentInstance();
const store = useAppStore();
const passwordVisible = ref(false);
const password = ref('')
const confirmPassword = ref('')
const validToken = ref(proxy.$route.query.token ? null : false)

const passwordsMatch = computed(() => password.value === confirmPassword.value || 'Passwords do not match')

const hasUppercase = computed(() => password.value.match(/[A-Z]/));
const hasLowercase = computed(() => password.value.match(/[a-z]/));
const hasNumber = computed(() => password.value.match(/[0-9]/));
const hasSpecial = computed(() => password.value.match(/[^A-Za-z0-9]/));
const isLongEnough = computed(() => password.value.length >= 8);


const resetPassword = () => {

  if (passwordsMatch.value !== true) {
    store.showAlert('Invalid Password', 'Passwords do not match')
    return;
  }
  if (!hasUppercase.value || !hasLowercase.value || !hasNumber.value || !hasSpecial.value || !isLongEnough.value) {
    store.showAlert('Invalid Password', 'Password does not meet requirements')
    return
  }

  fetchAPI(`reset_password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      new_password: password.value,
      token: proxy.$route.query.token,
    }),
  })
    .then((response) => {
      if (response.ok) {
        store.showAlert('Password Reset', 'Your password has been reset')
        proxy.$router.push('/login')
      } else {
        store.showAlert('Error', 'An error occurred while resetting your password. Your link may have expired. Please request a new link.')
        console.error('Error:', response)
      }
    })
    .catch((error) => {
      console.error('Error:', error)
    })
}

fetchAPI(`check_token/${proxy.$route.query.token}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((response) => {
    if (response.ok) {
      validToken.value = true
    } else {
      validToken.value = false
    }
  }
  ).catch((error) => {
    console.error('Error:', error)
  })

</script>