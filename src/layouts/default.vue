<template>
  <v-main>
    <v-alert type="warning" v-if="proxy.$route.path != '/login'">The rota was correct at time of entry. This system is
      not currently
      live, do not rely on it to provide up-to-date information</v-alert>
    <router-view />
    <AlertDialog />
    <v-bottom-navigation v-if="isMobile && proxy.$route.path != '/login'" grow color="primary">
      <v-btn @click="goHome('calendar')"><v-icon>mdi-calendar</v-icon></v-btn>
      <v-btn @click="goHome('list')"><v-icon>mdi-format-list-bulleted</v-icon></v-btn>
      <v-btn @click="goHome('chaperones')"><v-icon>mdi-account-multiple</v-icon></v-btn>
      <v-btn v-if="store.userID" @click="goHome('schedule')"><v-icon>mdi-account</v-icon></v-btn>
    </v-bottom-navigation>
  </v-main>

  <AppFooter v-if="!isMobile" />
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const { proxy } = getCurrentInstance();
const store = useAppStore();

onMounted(() => {
  if (import.meta.env.VITE_DEV == 1) {
    store.userEmail = "jamescaroe@gmail.com"
    store.userID = 8
    store.isAdmin = true
  }
})

const goHome = (tab) => {
  store.tabView = tab;
  proxy.$router.push(`/?view=${tab}`)
}
</script>