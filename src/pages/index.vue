<template>
  <app-header />
  <div class="pa-4">
    <v-btn v-if="store.isAdmin && !isMobile" @click="proxy.$router.push('/editEvent?id=new')"
      style="position: absolute; right: 16px;" class="mt-4" color="primary">Add
      Event</v-btn>
    <v-calendar :events="events" :weekdays="[0, 1, 2, 3, 4, 5, 6]" v-if="!isMobile">
      <template #event="{ event }">
        <event-card :event="event" />
      </template>
    </v-calendar>
    <event-card v-for="event in events" :event="event" mobile v-else />
  </div>
</template>

<script lang="js" setup>
import { VCalendar } from 'vuetify/labs/VCalendar'
import { ref, onMounted, getCurrentInstance } from 'vue'
import { useAppStore } from '@/stores/app'

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

</script>
