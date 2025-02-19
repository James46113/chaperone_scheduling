<template>
  <div v-if="isMobile">
    <div style="display: flex; justify-content: center; align-items: center; height: 80vh;" class="pa-6">
      <v-card width="100vw" class="pa-4" elevation="0" height="42vh">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title class="text-h5">Welcome!</v-card-title>
        <v-card-text v-if="!loadingData" class="mt-4">Please sign in with your email and password.</v-card-text>
        <v-card-text v-else class="mt-4">Signing you in...</v-card-text>

        <v-card-text class="text-caption text-disabled" @click="goGoogleLogin">Sign in with
          Google</v-card-text>
      </v-card>
    </div>
  </div>
  <div v-else>
    <div style="display: flex; justify-content: center; align-items: center; height: 60vh;">
      <v-card width="30vw" class="pa-4">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title>Sign In</v-card-title>
        <v-card-text v-if="!loadingData">Please sign in with your email and password.</v-card-text>
        <v-card-text v-else>Signing you in...</v-card-text>
        <div v-if="!loadingData" style="display: flex; justify-content: center;">
          <div>

            <v-card-text @click="goGoogleLogin" class="text-caption text-disabled"
              style="text-align: center; cursor: pointer;">Sign in with
              Google</v-card-text>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup>

const { proxy } = getCurrentInstance();

const goGoogleLogin = () => {
  if (proxy.$route.query.redirect) {
    proxy.$router.push(`/login?redirect=${proxy.$route.query.redirect}`)
  } else {
    proxy.$router.push('/login')
  }
}

</script>