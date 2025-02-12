<template>
  <div v-if="store.userID">
    <v-card-text v-if="small">Available:</v-card-text>
    <v-card-title v-else>Available:</v-card-title>
    <v-row class="mx-2 mt-1 mb-3">
      <v-btn variant="flat" max-width="100px" width="50%"
        :color="event.available === null ? '' : event.available ? 'green' : ''" @click="updateAvailable(true)"
        :ripple="false">✓</v-btn>
      <v-btn variant="flat" max-width="100px" width="50%"
        :color="event.available === null ? '' : event.available ? '' : 'red'" @click="updateAvailable(false)"
        :ripple="false">⨯</v-btn>
    </v-row>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';


const props = defineProps({
  event: Object,
  small: Boolean
})

const store = useAppStore();


const updateAvailable = (availability) => {
  props.event.available = availability
  fetchAPI(`chaperones/availability/${store.userID}`, {
    // fetchAPI(`chaperones/availability/1`, { // DEBUG ONLY
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