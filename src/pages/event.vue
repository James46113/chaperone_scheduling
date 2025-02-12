<template>
  <app-header />
  <v-card class="pa-4">
    <v-row>

      <div>
        <v-card-title class="text-h4 mb-n5">{{ loadingData ? "Loading..." : event.title }}</v-card-title>

        <v-btn v-if="store.isAdmin && !isMobile" @click="proxy.$router.push(`/editEvent?id=${proxy.$route.query.id}`)"
          color="primary" style="position: absolute; right: 32px;">Edit</v-btn>

        <v-card-title v-if="!loadingData">{{ event.date }}, {{ event.start }} - {{ event.end }}</v-card-title>
        <v-card-subtitle>
          {{ event.location }}
        </v-card-subtitle>
      </div>

      <!-- <v-divider class="my-4"></v-divider> -->
      <div class="ml-6" v-if="!loadingData">
        <availability-selector :event="event" />
      </div>
    </v-row>

    <v-divider class="my-4"></v-divider>
    <v-card-title>Chaperones</v-card-title>
    <v-card-text>Lead Chaperone: {{ event.lead_chaperone }}</v-card-text>

    <v-data-table :headers="tableHeaders" :items="chaperoneSlots" hide-default-footer v-if="!isMobile">
      <template #item.startTime="{ item }">
        {{ new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </template>
      <template #item.endTime="{ item }">
        {{ new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </template>
      <template #item.chaperone="{ item }">
        <span>{{ chaperones.find(chaperone => chaperone.id === item.chaperone)?.name }}</span>
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
    <v-divider />
    <v-card-title class="my-3">Details</v-card-title>
    <v-card-text v-if="store.userEmail">
      <span style="white-space: pre-wrap;">
        {{ event.details?.length > 0 ? event.details : 'No details available' }}
      </span>
    </v-card-text>
    <v-card-text v-else>
      <i>Login to view details</i>
      <GoogleLogin class="mt-4" :callback="onSignIn" auto-login prompt />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { GoogleLogin, decodeCredential, googleLogout } from 'vue3-google-login';



const { proxy } = getCurrentInstance()
const store = useAppStore();

const event = ref({})
const chaperoneSlots = ref([])
const chaperones = ref([])

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

  getAvailability();

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

  eventData.date = new Date(eventData.start).toLocaleDateString('en-UK', {
    weekday: 'short', day: 'numeric',
    month: 'short', year: 'numeric'
  });
  eventData.start = new Date(eventData.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  eventData.end = new Date(eventData.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  eventData.lead_chaperone = chaperones.value.find(chaperone => chaperone.id == eventData.lead_chaperone)?.name ?? null;
  eventData.available = availability;
  event.value = eventData;
  document.title = `${eventData.title} - Steel City Choristers`;

  chaperoneData.sort((a, b) => new Date(a.start) - new Date(b.start));
  chaperoneSlots.value = chaperoneData;

  loadingData.value = false
})

const getAvailability = () => {
  if (store.userID) {
    fetchAPI(`chaperones/availability/${store.userID}/${proxy.$route.query.id}`, {
      // fetchAPI(`chaperones/availability/1/${proxy.$route.query.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        availability = data.available;
      })
      .catch((error) => {
        console.error('Error:', error)
      });
  }
}

function onSignIn(response) {
  store.userEmail = decodeCredential(response.credential).email;
  fetchAPI(`login/${store.userEmail}`, {
    method: 'GET',
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .then((data) => {
      store.isAdmin = data.is_admin;
      store.userID = data.id
      getAvailability();
    })
    .catch((error) => {
      if (error.status === 401) {
        googleLogout();
        store.userEmail = '';
        store.isAdmin = false;
        store.userID = null
        store.showAlert('Unauthorised', "You are not authorised to access the chaperones' schedule. If you believe this is in error, please contact the chaperoning team.");
      }
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