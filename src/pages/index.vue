<template>
  <div class="pa-4">
    <v-btn @click="proxy.$router.push('/editEvent?id=new')" style="position: absolute; right: 16px;" class="mt-4"
      color="primary">Add Event</v-btn>
    <v-calendar :events="events" :weekdays="[1, 2, 3, 4, 5, 6, 0]">
      <template #event="{ event }">
        <v-card @click="proxy.$router.push(`/event?id=${event.id}`)" class="ma-1">
          <v-card-title>{{ event.title }}</v-card-title>
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
    </v-calendar>
  </div>
</template>

<script lang="js" setup>
import { VCalendar } from 'vuetify/labs/VCalendar'
import { ref, onMounted, getCurrentInstance } from 'vue'

const events = ref([])
const { proxy } = getCurrentInstance()
document.title = "Chaperones' Calendar - Steel City Choristers"

onMounted(() => {
  fetchAPI('http://localhost:5001/events', {
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
    })
    .catch((error) => {
      console.error('Error:', error)
    });

  fetchAPI('http://localhost:5001/events_chaperones', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      events.value.forEach((event) => {
        event.chaperones = data.filter(slot => slot.event_id === event.id)[0].chaperones
        event.chaperones = [...new Set(event.chaperones)]
        const leadIndex = event.chaperones.indexOf(event.lead_chaperone)
        event.chaperones.splice(leadIndex, 1)
        event.chaperones.unshift(event.lead_chaperone)
      })
    })
    .catch((error) => {
      console.error('Error:', error)
    });
})

// events.value.forEach((event) => {
//   fetchAPI(`http://localhost:5001/chaperones/${event.id}`, {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       event.chaperones = data
//       if (event.chaperones.length !== 1) {
//         const leadIndex = event.chaperones.indexOf(event.lead_chaperone)
//         event.chaperones.splice(leadIndex, 1)
//         event.chaperones.unshift(event.lead_chaperone)
//       }
//     })
// })

</script>
