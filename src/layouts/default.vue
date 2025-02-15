<template>
  <v-main>
    <v-alert type="warning" v-if="proxy.$route.path != '/login' && !isDev">The rota was correct
      at time of entry. This system is
      not currently
      live. Do not rely on it to provide up-to-date information</v-alert>
    <router-view />

    <AlertDialog />
    <v-bottom-navigation v-if="isMobile && proxy.$route.path != '/login' && proxy.$route.path != '/offline'" grow
      color="primary">
      <v-btn @click="goHome('calendar')"><v-icon>mdi-calendar</v-icon></v-btn>
      <v-btn @click="goHome('list')"><v-icon>mdi-format-list-bulleted</v-icon></v-btn>
      <v-btn v-if="store.isAdmin" @click="goHome('chaperones')"><v-icon>mdi-account-multiple</v-icon></v-btn>
      <v-btn @click="goHome('schedule')"><v-icon>mdi-account</v-icon></v-btn>
    </v-bottom-navigation>
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
  store.isAdmin = false
  console.log('Dev mode')
}
// })

const goHome = (tab) => {
  store.tabView = tab;
  proxy.$router.push(`/?view=${tab}`)
}
</script>