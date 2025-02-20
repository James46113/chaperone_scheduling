<template>
  <v-app-bar height="100" class="d-flex justify-space-between align-center">
    <img class="ml-4 mb-4" src="/Steel-City-Choristers.png" width="130px" contain @click="proxy.$router.push('/')" />
    <v-card-title class="text-h5 mt-4 ml-4" v-if="!isMobile">Chaperones</v-card-title>
    <v-spacer />

    <v-btn href="mailto:jamescaroe@gmail.com?subject=SCC%20Chaperone%20System%20Bug%20Report" color="primary"
      class="mt-4">
      Report Error
    </v-btn>

    <v-btn v-if="store.isAdmin && !isMobile" class="mt-4 mr-3" @click="proxy.$router.push('/templateEvents')">
      <v-icon size="25">mdi-note-text</v-icon>
    </v-btn>

    <v-btn v-if="!isMobile" class="mt-4 mr-3" @click="proxy.$router.push(`/schedule?id=${store.userID}`)">
      <v-icon size="25">mdi-account</v-icon>
    </v-btn>

    <v-btn v-if="!isMobile && store.isAdmin" class="mt-4 mr-3" @click="proxy.$router.push('/chaperones')">
      <v-icon size="25">mdi-account-multiple</v-icon>
    </v-btn>

    <v-btn v-if="!isMobile" class="mt-4 mr-3" @click="proxy.$router.push('/')">
      <v-icon size="25">mdi-calendar</v-icon>
    </v-btn>

    <v-btn v-if="store.userEmail && !isMobile" class="mt-4 mr-3" @click="logout">
      <v-icon size="25">mdi-logout</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script setup>
import { useAppStore } from '@/stores/app'
import { getCurrentInstance } from 'vue'
import { GoogleLogin, googleLogout } from 'vue3-google-login';

const props = defineProps({
  updateAvailability: Function
})

const { proxy } = getCurrentInstance()
const store = useAppStore();

const logout = () => {
  isSignedIn.value = false;
  store.userEmail = null;
  store.isAdmin = false;
  store.userID = null;
  Cookies.remove('credential');
  Cookies.remove('passwdAccessToken')
  proxy.$router.push('/login')
}

</script>