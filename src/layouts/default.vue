<template>
  <v-main>
    <!-- <v-alert type="warning" v-if="proxy.$route.path != '/login' && !isDev">The rota was correct
      at time of entry. This system is
      not currently
      live. Do not rely on it to provide up-to-date information</v-alert> -->
    <router-view />

    <AlertDialog />

    <mobile-navigation v-if="isMobile && proxy.$route.path != '/login' && proxy.$route.path != '/offline'" />

    <PWAInstallDialog />

  </v-main>

  <AppFooter v-if="!isMobile" />
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const { proxy } = getCurrentInstance();
const store = useAppStore();

// onMounted(() => {
if (isDev.value) {
  store.userEmail = "jamescaroe@gmail.com"
  store.userID = 8
  store.isAdmin = true
  console.log('Dev mode')
}
// })

onMounted(() => window.scrollTo(0, 0))

</script>