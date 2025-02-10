<template>
  <v-card @click="proxy.$router.push(`/event?id=${event.id}`)" class="ma-1">
    <v-card-title>{{ store.isMobile ? event.start.toLocaleDateString() + ' - ' : '' }}{{ event.title }}</v-card-title>
    <v-card-subtitle class="mt-n3">
      {{ event.location }}
    </v-card-subtitle>
    <v-card-subtitle>
      {{ new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} -
      {{ new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
    </v-card-subtitle>
    <v-card-text>
      <span v-for="chaperone in event.chaperones">
        <span :style="chaperone == event.lead_chaperone ? 'font-weight: bold;' : ''">
          {{ chaperone }}<br>
        </span>
      </span>
    </v-card-text>
  </v-card>

</template>

<script setup>
import { useAppStore } from '@/stores/app';


const store = useAppStore();

const { proxy } = getCurrentInstance()
defineProps({
  event: Object,
})

</script>