<template>
  <app-header />
  <div class="pa-3">
    <GoogleLogin v-if="isMobile && !store.userEmail" :callback="onSignIn" auto-login prompt />

    <v-tabs v-model="tab" grow color="primary">
      <v-tab value="calendar">Calendar</v-tab>
      <v-tab value="list">List</v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">

      <v-tabs-window-item value="calendar">

        <v-btn v-if="store.isAdmin && !isMobile" @click="proxy.$router.push('/editEvent?id=new')"
          style="position: absolute; right: 16px;" class="mt-4" color="primary">Add
          Event</v-btn>

        <v-calendar class="pa-0" :events="events" :weekdays="[0, 1, 2, 3, 4, 5, 6]" hide-week-number>
          <template #event="{ event }" v-if="!isMobile" :interval-height="20">
            <event-card :event="event" :chaperones="chaperones" />
          </template>
          <template #event="{ event }" v-if="isMobile">
            <v-card-text style="font-size: x-small; border-left: 2px solid; padding-left: 0.2em; border-color: #a80056;"
              class="py-0" @click="proxy.$router.push(`/event?id=${event.id}`)">
              {{ event.title }}
            </v-card-text>
            <!-- <v-chip class=" py-0 px-1" style="font-size: x-small;" color="primary"></v-chip> -->
          </template>
        </v-calendar>

      </v-tabs-window-item>

      <v-tabs-window-item value="list">
        <event-card v-for="event in events" :event="event" :chaperones="chaperones" />
      </v-tabs-window-item>

    </v-tabs-window>


  </div>
</template>

<script lang="js" setup>
import { VCalendar } from 'vuetify/labs/VCalendar'
import { ref, onMounted, getCurrentInstance } from 'vue'
import { useAppStore } from '@/stores/app'
import { GoogleLogin, decodeCredential, googleLogout } from 'vue3-google-login';

const events = ref([])
const { proxy } = getCurrentInstance()
const store = useAppStore();
const tab = ref(isMobile.value ? 'list' : 'calendar');
const chaperones = ref([]);

const availability = ref([]);

document.title = "Chaperones' Calendar - Steel City Choristers"

onMounted(async () => {
  loadingData.value = true
  try {
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
      start: new Date(event.start),
      end: new Date(event.end),
      location: event.location,
      lead_chaperone: event.lead_chaperone,
      available: availability.value.filter(slot => slot.event_id == event.id)[0]?.available,
    }));

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

  } catch (error) {
    console.error('Error:', error);
  } finally {
    loadingData.value = false;
  }
})

export const getAvailability = () => {
  fetchAPI(`/chaperones/availability/${store.userID}`, {
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
      console.log(JSON.stringify(events.value));
    }).catch((error) => console.error('Error:', error));
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
</script>