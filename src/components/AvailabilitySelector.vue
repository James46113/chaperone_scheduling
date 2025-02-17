<template>
  <div v-if="store.userID && !loadingAvailability && !isPastEvent"
    :style="small ? '' : 'border: 1px solid #ccc; border-radius: 5px;'">
    <v-card-text v-if="small">Available:</v-card-text>
    <v-card-title v-else class="mb-3">Available:</v-card-title>
    <v-row class="mx-2 mb-3">
      <v-btn variant="flat" max-width="100px" width="50%"
        :color="event.available === null ? '' : event.available ? '#198754' : ''" @click="updateAvailable(true)"
        :ripple="false">✓</v-btn>
      <v-btn variant="flat" max-width="100px" width="50%"
        :color="event.available === null ? '' : event.available ? '' : 'primary'" @click="updateAvailable(false)"
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
const isPastEvent = computed(() => props.event.date < new Date())


const updateAvailable = (availability) => {
  const originalAvailability = props.event.available
  props.event.available = availability
  fetchAPI(`chaperones/availability/${store.userID}`, {
    // fetchAPI(`chaperones/availability/1`, { // DEBUG ONLY
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_id: props.event.id,
      available: availability
    })
  })
    .then((response) => {
      if (response.status === 403) {
        store.showAlert('Assigned', 'You are already assigned to this event, please contact Angela on +44 7985 925570 if you are no longer available.')
        props.event.available = originalAvailability
      } else if (!response.ok) {
        store.showAlert('Failed to update availability', 'Are you connected to the internet?')
        props.event.available = originalAvailability
      }
    })
}

</script>