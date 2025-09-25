<template>
  <v-dialog
    v-model="store.showAlertDialog"
    :width="isMobile ? '100vw' : '30vw'"
    @keyup.enter="store.showAlertDialog = false"
  >
    <v-card>
      <v-card-title>{{ store.alertTitle }}</v-card-title>
      <v-card-text
        class="mt-3 mb-n2"
        v-html="store.alertMessage"
      />
      <v-card-actions>
        <v-btn
          color="primary"
          @click="store.showAlertDialog = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const store = useAppStore();

</script>