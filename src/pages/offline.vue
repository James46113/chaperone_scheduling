<template>
  <div v-if="isMobile">
    <div style="display: flex; justify-content: center; align-items: center; height: 80vh;" class="pa-6">
      <v-card :width="'100vw'" class="pa-4" elevation="0">
        <v-img src="/Steel-City-Choristers.png" max-width="200" />
        <v-card-title class="text-h5">Offline</v-card-title>
        <v-card-text class="my-4">Please connect to a network to view the chaperone's rota.</v-card-text>
      </v-card>
    </div>
  </div>
  <div v-else style="display: flex; justify-content: center; align-items: center; height: 60vh;" v-if="!isMobile">
    <v-card :width="isMobile ? '100vw' : '30vw'" class="pa-4">
      <v-img src="/Steel-City-Choristers.png" max-width="200" />
      <v-card-title>Offline</v-card-title>
      <v-card-text>Please connect to a network to view the chaperone's rota.</v-card-text>
    </v-card>
  </div>
</template>