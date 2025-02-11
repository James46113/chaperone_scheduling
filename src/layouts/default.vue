<template>
  <v-main>
    <v-alert type="warning">The listed chaperones were correct at the time of entry. As this system is not currently
      live, please do not rely on it to provide accurate up-to-date information</v-alert>
    <router-view />
    <AlertDialog />
  </v-main>

  <AppFooter />
</template>

<script lang="ts" setup>
//
</script>
