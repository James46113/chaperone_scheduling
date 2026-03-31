<template>
  <v-app-bar
    height="100"
    class="d-flex justify-space-between align-center"
  >
    <img
      class="ml-4 mb-4"
      src="/Steel-City-Choristers.png"
      width="130px"
      contain
      @click="proxy.$router.push('/')"
    >
    <v-card-title
      v-if="!isMobile"
      class="text-h5 mt-4 ml-4"
    >
      Chaperones
    </v-card-title>
    <v-spacer />

    <!-- <v-card-title
      v-if="isMobile"
      class="text-h5 mt-4 mr-4"
    >
      Chaperones
    </v-card-title> -->
    <v-btn href="mailto:help@jamescaroe.on.spiceworks.com" color="primary"
      class="mt-4">
      <v-icon class="mr-2" size="25">mdi-help-circle-outline</v-icon>
      Support
    </v-btn>

    <v-btn
      v-if="store.isAdmin && !isMobile"
      class="mt-4 mr-3"
      @click="proxy.$router.push('/templates')"
    >
      <v-icon
        size="25"
        class="mr-2"
      >
        mdi-note-text
      </v-icon> Templates
    </v-btn>

    <v-btn
      v-if="!isMobile && !store.userHidden"
      class="mt-4 mr-3"
      @click="proxy.$router.push(`/chaperones/${store.userID}`)"
    >
      <v-icon
        size="25"
        class="mr-2"
      >
        mdi-account
      </v-icon> Schedule
    </v-btn>

    <v-btn
      v-if="!isMobile && store.isAdmin"
      class="mt-4 mr-3"
      @click="proxy.$router.push('/chaperones')"
    >
      <v-icon
        size="25"
        class="mr-2"
      >
        mdi-account-multiple
      </v-icon> Chaperones
    </v-btn>

    <v-btn
      v-if="!isMobile"
      class="mt-4 mr-3"
      @click="proxy.$router.push('/')"
    >
      <v-icon
        size="25"
        class="mr-2"
      >
        mdi-calendar
      </v-icon> Calendar
    </v-btn>

    <v-btn
      v-if="store.userEmail && !isMobile"
      class="mt-4 mr-3"
      color="primary"
      @click="logout"
    >
      <v-icon
        size="25"
        class="mr-2"
      >
        mdi-logout
      </v-icon> Logout
      <v-tooltip
        text="Logout"
        location="bottom"
        activator="parent"
      />
    </v-btn>
  </v-app-bar>
</template>

<script setup>
import { useAppStore } from '@/stores/app'
import { getCurrentInstance } from 'vue'

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