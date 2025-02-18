<template>
  <app-header />
  <v-card :class="isMobile ? 'pa-4' : 'pa-10'" v-if="!loadingData">
    <v-row>
      <div>
        <v-card-title class="text-h4 mb-n5" style="white-space: pre-wrap;">{{ event.title }}</v-card-title>

        <v-btn v-if="!isMobile && store.isAdmin && !isPastEvent"
          @click="proxy.$router.push(`/editEvent?id=${proxy.$route.query.id}`)" color="primary"
          style="position: absolute; right: 32px;">Edit</v-btn>

        <v-card-title v-if="!loadingData">{{ event.dateString }}, {{ event.start }} - {{ event.end }}</v-card-title>
        <v-card-subtitle>
          {{ event.location }}
        </v-card-subtitle>
      </div>

      <!-- <v-divider class="my-4"></v-divider> -->
      <div :class="isMobile ? '' : 'ml-6 mt-4'" v-if="!loadingData && !isMobile">
        <availability-selector :event="event" />
      </div>
    </v-row>

    <v-btn v-if="isMobile && store.isAdmin && !isPastEvent"
      @click="proxy.$router.push(`/editEvent?id=${proxy.$route.query.id}`)" color="primary" class="mt-10"
      width="100vw">Edit</v-btn>

    <availability-selector :event="event" v-if="isMobile" class="mt-8" />

    <v-divider class="mb-4 mt-10"></v-divider>
    <v-card-title>Chaperones</v-card-title>
    <v-card-text v-if="false">Lead Chaperone: {{ event.lead_chaperone }}</v-card-text>

    <v-data-table :headers="tableHeaders" :items="chaperoneSlots" hide-default-footer v-if="!isMobile">
      <template #item.startTime="{ item }">
        {{ new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </template>
      <template #item.endTime="{ item }">
        {{ new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </template>
      <template #item.chaperone="{ item }">
        <span v-if="item.chaperone">{{ chaperones.find(chaperone => chaperone.id === item.chaperone)?.name }}</span>
        <v-alert v-else type="warning" class="pa-2">
          <span>No chaperone</span>
        </v-alert>
      </template>
      <template #item.details="{ item }">
        <span v-if="item.details?.length > 0">
          {{ item.details }}
        </span>
        <i v-else>No details available</i>
      </template>
      <template v-slot:no-data>
        <v-card-text v-if="loadingData">Loading...</v-card-text>
        <v-alert v-else type="warning" class="mt-3">
          No chaperones assigned
        </v-alert>
      </template>
    </v-data-table>

    <v-card v-else v-for="slot in chaperoneSlots" class="mb-4">
      <v-card-title v-if="slot.chaperone">{{ chaperones.find(chaperone => chaperone.id === slot.chaperone)?.name
        }}</v-card-title>
      <v-alert v-else type="warning" class="mb-6">No Chaperone</v-alert>
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
    <v-divider />
    <v-card-title class="my-3">Details</v-card-title>
    <v-card-text>
      <span style="white-space: pre-wrap;">
        {{ event.details?.length > 0 ? event.details : 'No details available' }}
      </span>
    </v-card-text>
  </v-card>
  <div v-else class="d-flex justify-center align-center" style="height: 70vh;">
    <v-progress-circular color="primary" indeterminate size="40" />
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { decodeCredential, googleLogout } from 'vue3-google-login';



const { proxy } = getCurrentInstance()
const store = useAppStore();

const event = ref({})
const chaperoneSlots = ref([])
const chaperones = ref([])
const isPastEvent = computed(() => {
  return event.value.date < new Date()
})

const tableHeaders = [
  { title: 'Group', key: 'title', width: '20%' },
  { title: 'Chaperone', key: 'chaperone', width: '15%' },
  { title: 'Details', key: 'details', width: '35%' },
  { title: 'Start', key: 'startTime', width: '12%' },
  { title: 'End', key: 'endTime', width: '12%' },
];

onMounted(async () => {
  if (!proxy.$route.query.id) {
    proxy.$router.push('/')
  }

  loadingData.value = true
  await getChaperones();
  let availability = null;


  const [eventData, chaperoneData] = await Promise.all([
    fetchAPI(`events/${proxy.$route.query.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => response.json()),
    fetchAPI(`chaperone_slots/${proxy.$route.query.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => response.json())
  ]);

  eventData.date = new Date(eventData.start)
  eventData.dateString = eventData.date.toLocaleDateString('en-UK', {
    weekday: 'short', day: 'numeric',
    month: 'short', year: 'numeric'
  });
  eventData.start = new Date(eventData.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  eventData.end = new Date(eventData.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  eventData.lead_chaperone = chaperones.value.find(chaperone => chaperone.id == eventData.lead_chaperone)?.name ?? null;
  eventData.available = availability;
  event.value = eventData;
  getAvailability();
  document.title = `${eventData.title} - Steel City Choristers`;

  chaperoneData.sort((a, b) => new Date(a.start) - new Date(b.start));
  chaperoneSlots.value = chaperoneData;

  loadingData.value = false
})

const getAvailability = () => {
  fetchAPI(`chaperones/availability/${store.userID}/${proxy.$route.query.id}`, {
    // fetchAPI(`chaperones/availability/1/${proxy.$route.query.id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      event.value.available = data.available;
    })
    .catch((error) => {
      console.error('Error:', error)
    });

}

const getChaperones = async () => {
  await fetchAPI('chaperones', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      chaperones.value = data;
    })
    .catch((error) => {
      console.error('Error:', error)
    });
}
</script>