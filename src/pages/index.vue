<template>
  <app-header />
  <div class="pa-4">
    <GoogleLogin v-if="isMobile && !store.userEmail" :callback="onSignIn" auto-login prompt />
    <v-btn v-if="store.isAdmin && !isMobile" @click="proxy.$router.push('/editEvent?id=new')"
      style="position: absolute; right: 16px;" class="mt-4" color="primary">Add
      Event</v-btn>
    <v-calendar :events="events" :weekdays="[0, 1, 2, 3, 4, 5, 6]" v-if="!isMobile" hide-week-number>
      <template #event="{ event }">
        <event-card :event="event" />
      </template>
    </v-calendar>
    <event-card v-for="event in events" :event="event" v-else />


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

document.title = "Chaperones' Calendar - Steel City Choristers"

// onMounted(() => {
loadingData.value = true
fetchAPI('events', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((response) => response.json())
  .then((data) => {
    events.value = data.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      location: event.location,
      lead_chaperone: event.lead_chaperone,
    }))

    fetchAPI('events_chaperones', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        events.value.forEach((event) => {
          event.chaperones = data.filter(slot => slot.event_id == event.id)[0].chaperones
          if (event.chaperones) {
            event.chaperones = [...new Set(event.chaperones)]
            const leadIndex = event.chaperones.indexOf(event.lead_chaperone)
            if (leadIndex !== -1) {
              event.chaperones.splice(leadIndex, 1)
              event.chaperones.unshift(event.lead_chaperone)
            }
          }
        })
        loadingData.value = false
      }).catch(error => {
        console.error('Error:', error)
      })
  })

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
      store.isAdmin = data.is_admin
    })
    .catch((error) => {
      if (error.status === 401) {
        googleLogout();
        store.userEmail = '';
        store.isAdmin = false;
        store.showAlert('Unauthorised', "You are not authorised to access the chaperones' schedule. If you believe this is in error, please contact the chaperoning team.");
      }
      console.error('Error:', error)
    });
}
</script>
