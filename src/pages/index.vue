<template>
  <app-header :update-availability="getAvailability" />
  <div class="pa-3">
    <v-tabs v-model="store.tabView" grow color="primary" v-if="!isMobile">
      <v-tab value="calendar">Calendar</v-tab>
      <v-tab value="list">List</v-tab>
    </v-tabs>

    <v-tabs-window v-model="store.tabView">

      <v-tabs-window-item value="calendar">

        <v-btn v-if="store.isAdmin && !isMobile" @click="proxy.$router.push('/editEvent?id=new')"
          style="position: absolute; right: 16px;" class="mt-4" color="primary">Add
          Event</v-btn>
        <v-btn v-if="store.isAdmin && !isMobile" @click="() => showCreateTerm = true"
          style="position: absolute; right: 160px;" class="mt-4" color="primary">Create Term</v-btn>

        <v-calendar class="pa-0" :events="events" :weekdays="[0, 1, 2, 3, 4, 5, 6]" hide-week-number>
          <template #event="{ event }" v-if="!isMobile" :interval-height="20">
            <event-card :event="event" :chaperones="chaperones" small />
          </template>
          <template #event="{ event }" v-if="isMobile">
            <v-card-text style="font-size: x-small; border-left: 2px solid; padding-left: 0.2em; border-color: #a80056;"
              class="py-0" @click="proxy.$router.push(`/event?id=${event.id}`)">
              {{ event.title }}
            </v-card-text>
            <!-- <v-chip class=" py-0 px-1" style="font-size: x-small;" color="primary"></v-chip> -->
          </template>
        </v-calendar>
        <v-btn v-if="store.isAdmin && isMobile" width="100vw" variant="flat" color="primary" class="my-3"
          @click="proxy.$router.push('/editEvent?id=new')">New Event</v-btn>
        <v-btn v-if="store.isAdmin && isMobile" @click="() => showCreateTerm = true" width="100vw" class="mt-2 mb-3"
          color="primary">Create Term</v-btn>
      </v-tabs-window-item>

      <v-tabs-window-item value="list">

        <v-btn v-if="store.isAdmin && !isMobile" @click="proxy.$router.push('/editEvent?id=new')"
          style="position: absolute; right: 16px;" class="mt-4" color="primary">Add
          Event</v-btn>

        <v-btn v-if="store.isAdmin && !isMobile" @click="() => showCreateTerm = true"
          style="position: absolute; right: 160px;" class="mt-4" color="primary">Create Term</v-btn>

        <v-card-title :class="isMobile ? 'text-h5 mt-5' : 'text-h5'">Upcoming Events</v-card-title>

        <v-card-text>
          To give your availability, press on the tick or the cross on each event.
        </v-card-text>

        <v-btn v-if="store.isAdmin && isMobile" width="100vw" variant="flat" color="primary" class="my-3"
          @click="proxy.$router.push('/editEvent?id=new')">New Event</v-btn>
        <v-btn v-if="store.isAdmin && isMobile" @click="() => showCreateTerm = true" width="100vw" class="mt-2 mb-3"
          color="primary">Create Term</v-btn>

        <v-divider v-if="store.isAdmin" class="mt-3" />

        <div class="my-8"></div>
        <event-card v-if="!loadingData" v-for="event in upcomingEvents" :event="event" :chaperones="chaperones" />
        <div v-else class="d-flex justify-center align-center" style="height: 23vh;">
          <v-progress-circular color="primary" indeterminate size="40" />
        </div>
      </v-tabs-window-item>

      <v-tabs-window-item value="chaperones">
        <chaperones-page />
      </v-tabs-window-item>

      <v-tabs-window-item value="schedule">
        <schedule-page :chaperone_id="store.userID" />
      </v-tabs-window-item>

    </v-tabs-window>
  </div>

  <v-dialog v-model="showCreateTerm" :width="isMobile ? '100vw' : '30vw'">
    <create-term :close="createdTerm" />
  </v-dialog>
</template>

<script lang="js" setup>
import { VCalendar } from 'vuetify/labs/VCalendar'
import { ref, onMounted, getCurrentInstance } from 'vue'
import { useAppStore } from '@/stores/app'
import { GoogleLogin, decodeCredential, googleLogout } from 'vue3-google-login';

const events = ref([])
const upcomingEvents = computed(() => events.value.filter(event => event.start > new Date()))

const { proxy } = getCurrentInstance()
const store = useAppStore();
const chaperones = ref([]);

const availability = ref([]);

const showCreateTerm = ref(false);

document.title = "Chaperones' Calendar - Steel City Choristers"

onMounted(async () => {
  console.log((window.matchMedia('(display-mode: standalone)').matches))
  if (proxy.$route.query.view) {
    store.tabView = proxy.$route.query.view;
  }

  try {
    await loadData();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    loadingData.value = false;
  }
})

const createdTerm = () => {
  showCreateTerm.value = false;
  setTimeout(() => loadData, 2000)
}

const loadData = async () => {
  loadingData.value = true
  if (store.userID) {
    getAvailability();
  }

  const [chaperonesResponse, eventsResponse] = await Promise.all([
    fetchAPI('chaperones', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    fetchAPI('events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  ]);

  const chaperonesData = await chaperonesResponse.json();
  chaperones.value = chaperonesData;

  const eventsData = await eventsResponse.json();
  events.value = eventsData.map((event) => ({
    id: event.id,
    title: event.title,
    date: new Date(event.start),
    start: new Date(event.start),
    end: new Date(event.end),
    location: event.location,
    lead_chaperone: event.lead_chaperone,
    available: availability.value.filter(slot => slot.event_id == event.id)[0]?.available,
  }));
  events.value.sort((a, b) => a.start - b.start);

  const eventsChaperonesResponse = await fetchAPI('events_chaperones', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const eventsChaperonesData = await eventsChaperonesResponse.json();
  events.value.forEach((event) => {
    event.chaperones = eventsChaperonesData.filter(slot => slot.event_id == event.id)[0]?.chaperones;
    if (event.chaperones) {
      event.chaperones = [...new Set(event.chaperones)];
      const leadIndex = event.chaperones.indexOf(event.lead_chaperone);
      if (leadIndex !== -1) {
        event.chaperones.splice(leadIndex, 1);
        event.chaperones.unshift(event.lead_chaperone);
      }
    }
  });
}


const getAvailability = () => {
  loadingAvailability.value = true;
  if (!store.userID) {
    return;
  }
  fetchAPI(`chaperones/availability/${store.userID}`, {
    // fetchAPI(`/chaperones/availability/1`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      availability.value = data;
      events.value.forEach((event) => {
        event.available = availability.value.filter(slot => slot.event_id == event.id)[0]?.available;
      });
    })
    .catch((error) => console.error('Error:', error))
    .finally(() => {
      loadingAvailability.value = false
    });
}

</script>