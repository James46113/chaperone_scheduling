<template>
  <v-main>
    <router-view />

    <AlertDialog />

    <v-bottom-navigation v-if="isMobile && showNavigationBar" grow color="primary">
      <v-btn @click="goHome('calendar')"><v-icon>mdi-calendar</v-icon></v-btn>
      <v-btn @click="goHome('list')"><v-icon>mdi-format-list-bulleted</v-icon></v-btn>
      <v-btn v-if="store.isAdmin" @click="goHome('chaperones')"><v-icon>mdi-account-multiple</v-icon></v-btn>
      <v-btn @click="goHome('schedule')"><v-icon>mdi-account</v-icon></v-btn>
    </v-bottom-navigation>

    <PWAInstallDialog />
    <CreateTermDialog />
  </v-main>

  <AppFooter v-if="!isMobile" />
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const { proxy } = getCurrentInstance();
const store = useAppStore();
const showNavigationBar = computed(() => !['/login', '/offline', '/resetPassword'].includes(proxy.$route.path))

const goHome = (tab) => {
  store.tabView = tab;
  proxy.$router.push(`/?view=${tab}`)
}
</script>