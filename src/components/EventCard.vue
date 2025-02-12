<template>
  <v-card class="ma-1">
    <div @click="goToEvent" style="cursor: pointer;">
      <v-card-title>{{ isMobile ? event.start.toLocaleDateString() + ' - ' : '' }}{{ event.title }}</v-card-title>
      <v-card-subtitle class="mt-n3">
        {{ event.location }}
      </v-card-subtitle>
      <v-card-subtitle>
        {{ new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} -
        {{ new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </v-card-subtitle>
      <v-card-text>
        <v-card-text v-if="loadingData">
          Loading...
        </v-card-text>
        <span v-for="chaperone in event.chaperones" v-else-if="event.chaperones?.length > 0 ?? false">
          <span :style="chaperone == event.lead_chaperone ? 'font-weight: bold;' : ''">
            {{ chaperones.find(c => c.id === chaperone).name }}<br>
          </span>
        </span>
        <v-sheet v-else color="warning" class="pa-2">
          <span>No chaperones assigned</span>
        </v-sheet>
      </v-card-text>
      <v-card-text>
        Available:
      </v-card-text>
    </div>
    <v-row class="mx-2 mb-2">
      <v-btn variant="flat" max-width="200px" width="50%"
        :color="event.available === null ? '' : event.available ? 'green' : ''" @click="updateAvailable"
        :ripple="false">✓</v-btn>
      <v-btn variant="flat" max-width="200px" width="50%"
        :color="event.available === null ? '' : event.available ? '' : 'red'" @click="updateAvailable"
        :ripple="false">⨯</v-btn>
    </v-row>
  </v-card>

</template>

<script setup>
import { useAppStore } from '@/stores/app';

const store = useAppStore();

const { proxy } = getCurrentInstance()
const props = defineProps({
  event: Object,
  chaperones: Array,
})

const goToEvent = (value) => {
  if (!value.target.closest('.v-btn')) {
    proxy.$router.push(`/event?id=${props.event.id}`)
  }
}

const updateAvailable = () => {
  fetchAPI(`chaperones/availability/${store.userID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_id: props.event.id,
      available: props.event.available
    })
  })
    .then((response) => {
      if (!response.ok) {
        store.showAlert('Error updating availability', 'Please try again later, if this persists contact jamescaroe@gmail.com')
      }
    })
}

</script>