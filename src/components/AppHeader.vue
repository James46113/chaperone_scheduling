<template>
  <v-app-bar height="100" class="d-flex justify-space-between align-center">
    <img class="ml-4 mb-4" src="/Steel-City-Choristers.png" width="130px" contain />
    <v-card-title class="text-h5 mt-4 ml-4">Chaperones</v-card-title>
    <v-spacer />

    <v-btn class="mt-4 mr-3" @click="proxy.$router.push('/templateEvents')">
      <v-icon size="25">mdi-note-text</v-icon>
    </v-btn>

    <v-btn class="mt-4 mr-3" @click="proxy.$router.push('/chaperones')">
      <v-icon size="25">mdi-account-multiple</v-icon>
    </v-btn>

    <v-btn class="mt-4 mr-3" @click="proxy.$router.push('/')">
      <v-icon size="25">mdi-calendar</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script lang="js" setup>
const { proxy } = getCurrentInstance()
</script>