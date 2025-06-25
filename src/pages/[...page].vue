<template>
  <app-header />
  <div class="d-flex justify-center mt-10">
    <v-card class="ma-4" :width="isMobile ? '100vw' : '40vw'">
      <v-card-title>Page Not Found</v-card-title>
      <v-card-text>
        The page you are looking for does not exist. Please check the URL and try again.
      </v-card-text>
      <v-row class="pa-2">
        <v-spacer />
        <v-card-actions>
          <v-btn @click="proxy.$router.push('/')" color="primary">Home</v-btn>
        </v-card-actions>
        <v-spacer />
      </v-row>
    </v-card>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';


const { proxy } = getCurrentInstance()
const store = useAppStore();

document.title = "404 Page Not Found - Steel City Choristers"

</script>