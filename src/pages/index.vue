<template>
  <app-header :update-availability="getAvailability" />
  <div class="pa-3">
    <v-tabs v-model="store.tabView" grow color="primary" v-if="!isMobile">
      <v-tab value="calendar">Calendar</v-tab>
      <v-tab value="list">List</v-tab>
    </v-tabs>

    <v-tabs-window v-model="store.tabView">

      <v-tabs-window-item value="calendar">
        <div v-if="store.isAdmin && !isMobile" style="position: absolute; right: 0px;" class="mt-2">
          <actions-menu activatorID="calendarMenu" label="Actions" />
        </div>

        <v-calendar class="pa-0" :events="events" :weekdays="[0, 1, 2, 3, 4, 5, 6]" hide-week-number>
          <template #event="{ event }" v-if="!isMobile" :interval-height="20">
            <event-card :event="event" :chaperones="chaperones" small />
          </template>
          <template #event="{ event }" v-if="isMobile">
            <v-card-text style="font-size: x-small; border-left: 2px solid; padding-left: 0.2em; border-color: #a80056;"
              class="py-0" @click="proxy.$router.push(`/event?id=${event.id}`)">
              {{ event.title }}
            </v-card-text>
          </template>
        </v-calendar>

      </v-tabs-window-item>

      <v-tabs-window-item value="list">
        <v-row class="pt-5 px-3">
          <v-card-title class="text-h5">Upcoming Events</v-card-title>
          <v-spacer />
          <div :class="isMobile ? '' : 'mt-4 mr-4'">
            <actions-menu activatorID="listMenu" :label="isMobile ? '' : 'Actions'" />
          </div>
        </v-row>

        <v-card-text>
          To give your availability, press on the tick or the cross on each event.
        </v-card-text>

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
</template>

<script lang="js" setup>
import { VCalendar } from 'vuetify/labs/VCalendar'
import { ref, onMounted, getCurrentInstance } from 'vue'
import { useAppStore } from '@/stores/app'

const events = ref([])
const upcomingEvents = computed(() => events.value.filter(event => event.start > new Date()))

const { proxy } = getCurrentInstance()
const store = useAppStore();
const chaperones = ref([]);

const availability = ref([]);

const sendingUpcomingEventsEmail = ref(false);

document.title = "Chaperones' Calendar - Steel City Choristers"

onMounted(async () => {
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

const sendAssignedEventsEmail = () => {
  sendingUpcomingEventsEmail.value = true;
  fetchAPI('chaperones/events/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (response.ok) {
        store.showAlert('Email Sent', 'Chaperones have been emailed their assigned events')
      } else {
        store.showAlert('Error', 'An error occurred while sending the email')
        console.error('Error:', response)
      }
    })
    .catch((error) => {
      store.showAlert('Error', 'An error occurred while sending the email')
      console.error('Error:', error)
    }).finally(() => {
      sendingUpcomingEventsEmail.value = false;
    });
}

const createdTerm = () => {
  store.showCreateTermDialog.value = false;
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

setInterval(() => { if (reloadData.value) loadData() }, 1000);


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