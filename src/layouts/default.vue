<template>
  <v-main>
    <v-alert type="warning">The listed chaperones were correct at the time of entry. As this system is not currently
      live, please do not rely on it to provide accurate up-to-date information</v-alert>
    <router-view />
    <AlertDialog />
  </v-main>

  <AppFooter />
</template>

<script lang="js" setup>

const { proxy } = getCurrentInstance();

const updateOnlineStatus = () => {
  if (navigator.onLine) {
    proxy.$router.push(router.currentRoute.value.path);
  } else {
    proxy.$router.push('/noInternet');
  }
};

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});
</script>
