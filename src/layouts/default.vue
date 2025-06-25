<template>
  <v-main>
    <v-alert  v-if="offline">
      <template #title>
        <v-icon color="primary" class="mr-2" >mdi-alert-circle</v-icon> Offline
      </template>
      <template #text>
        <span class="">
          You are not connected to the internet. Some features are not available and the rota may be out of date. Connect to the internet to get the latest data and update your availability.
        </span>
      </template>
    </v-alert>
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

const reloadData = () => {
  if (!offline.value && store.userID) {
    store.loadAvailability();
    store.loadEvents();
    store.loadChaperones();
    store.loadChaperoneSlots();
    
    if (store.isAdmin) {
      store.loadTemplateSlots();
      store.loadTemplates()
      store.loadAllAvailability();
    }
  }
}

setInterval(reloadData, 1000 * 30); // Reload data every 30s
</script>