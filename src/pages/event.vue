<template>
  <app-header />
  <v-card class="pa-4">
    <v-card-title class="text-h4 mb-n5">{{ event.title }}</v-card-title>

    <v-btn v-if="store.isAdmin && !store.isMobile" @click="proxy.$router.push(`/editEvent?id=${proxy.$route.query.id}`)"
      color="primary" style="position: absolute; right: 32px;">Edit</v-btn>

    <v-card-title>{{ event.date }}, {{ event.start }} - {{ event.end }}</v-card-title>
    <v-card-subtitle>
      {{ event.location }}
    </v-card-subtitle>
    <v-card-text>
      <span style="white-space: pre-wrap;">
        {{ event.details?.length > 0 ? event.details : 'No details available' }}
      </span>
    </v-card-text>

    <v-divider class="my-4"></v-divider>
    <v-card-title>Chaperones</v-card-title>
    <v-card-text>Lead Chaperone: {{ event.lead_chaperone }}</v-card-text>

    <v-data-table :headers="tableHeaders" :items="chaperoneSlots" hide-default-footer v-if="!store.isMobile">
      <template #item.startTime="{ item }">
        {{ new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </template>
      <template #item.endTime="{ item }">
        {{ new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </template>
      <template #item.details="{ item }">
        <span v-if="item.details?.length > 0">
          {{ item.details }}
        </span>
        <i v-else>No details available</i>
      </template>
      <template v-slot:no-data>
        <v-alert type="warning" class="mt-3">
          No chaperones assigned
        </v-alert>
      </template>
    </v-data-table>
    <v-card v-else v-for="slot in chaperoneSlots" class="mb-4">
      <v-card-title>{{ slot.chaperone }}</v-card-title>
      <v-card-subtitle class="mt-n2">{{ slot.title }}</v-card-subtitle>
      <v-card-subtitle>{{ new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} -
        {{ new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</v-card-subtitle>
      <v-card-text>
        <span v-if="slot.details?.length > 0">
          {{ slot.details }}
        </span>
        <i v-else>No details available</i>
      </v-card-text>

    </v-card>
  </v-card>
</template>

<script setup>
import { useAppStore } from '@/stores/app';


const { proxy } = getCurrentInstance()
const store = useAppStore();

const event = ref({})
const chaperoneSlots = ref([])

const tableHeaders = [
  { title: 'Group', key: 'title', width: '20%' },
  { title: 'Chaperone', key: 'chaperone', width: '15%' },
  { title: 'Details', key: 'details', width: '35%' },
  { title: 'Start', key: 'startTime', width: '12%' },
  { title: 'End', key: 'endTime', width: '12%' },
];

onMounted(() => {
  if (!proxy.$route.query.id) {
    proxy.$router.push('/')
  }
  fetchAPI(`http://localhost:5001/events/${proxy.$route.query.id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      data.date = new Date(data.start).toLocaleDateString('en-UK', {
        weekday: 'short', day: 'numeric',
        month: 'short', year: 'numeric'
      })
      data.start = new Date(data.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      data.end = new Date(data.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      event.value = data;
      document.title = `${data.title} - Steel City Choristers`;
    })

  fetchAPI(`http://localhost:5001/chaperone_slots/${proxy.$route.query.id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      data.sort((a, b) => new Date(a.start) - new Date(b.start));
      chaperoneSlots.value = data;
    })
})

</script>