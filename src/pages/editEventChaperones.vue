<template>
  <app-header />
  <v-card elevation="0" class="pa-6" v-if="!loadingData">
    <v-card-title class="text-h5">Assign Chaperones</v-card-title>
    <v-chip v-for="chaperone in sortedChaperones" :class="'ma-1 ' + chipColor(chaperone)"
      :draggable="chipColor(chaperone) !== 'error'" :color="chipColor(chaperone)"
      @dragstart="dragStart($event, chaperone)">{{
        chaperone.name + ': ' + chaperone.numEvents
      }}</v-chip>

    <v-divider class="my-4" />

    <v-card>
      <v-row class="pa-5">
        <v-btn flat color="primary" @click="previousEvent"><v-icon>mdi-chevron-left</v-icon>
          Previous</v-btn>
        <v-spacer />
        <v-btn flat color="primary" @click="nextEvent">Next
          <v-icon>mdi-chevron-right</v-icon></v-btn>
      </v-row>
      <v-row>
        <div class="pa-3">
          <v-card-title>{{ currentEvent?.title }}</v-card-title>
          <v-card-subtitle class="mt-n2">{{ currentEvent?.dateString }}, {{ currentEvent?.start.toLocaleTimeString([],
            {
              hour:
                '2-digit', minute: '2-digit', hour12: false
            }) }}
            - {{ currentEvent?.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            }}
          </v-card-subtitle>
          <v-card-subtitle>{{ currentEvent?.location }}</v-card-subtitle>
        </div>
        <v-spacer />
        <v-btn class="mt-7 mr-7" flat color="primary"
          @click="proxy.$router.push(`/editEvent?id=${currentEventID}`)">Edit Event</v-btn>
      </v-row>

      <div style="display: flex; flex-wrap: wrap;">
        <v-card v-for="slot in currentEvent?.slots" class="ma-3">
          <v-card-text>{{ slot.title }}</v-card-text>
          <v-card-subtitle class="mt-n4">{{ slot.start.toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit',
            hour12: false
          })
          }} - {{ slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
          </v-card-subtitle>
          <v-card-text>{{ slot.details }}</v-card-text>
          <v-text-field readonly variant="outlined" class="mx-2 mt-n5" width="10vw" density="compact"
            @dragover="allowDrop" @drop="drop($event, slot)">
            <v-chip v-if="slot.chaperone" append-icon="mdi-close" :color="chipColor(store.getChaperone(slot.chaperone))"
              @click="removeChaperone(slot)">{{
                store.getChaperone(slot.chaperone).name }}</v-chip>
          </v-text-field>
        </v-card>
        <v-card-text v-if="currentEvent?.slots.length === 0"><i>No Chaperone Slots</i></v-card-text>
      </div>

    </v-card>
  </v-card>
  <div v-else class="d-flex justify-center">
    <v-progress-circular color="primary" indeterminate size="40" />
  </div>

</template>

<script setup>
import { useAppStore } from '@/stores/app';

const { proxy } = getCurrentInstance()
const store = useAppStore();

const currentEventID = ref(parseInt(proxy.$route.query.id))
const currentEvent = computed(() => store.getEvent(currentEventID.value))

onMounted(async () => {
  loadingData.value = true
  if (!store.eventsLoaded || !store.allAvailabilityLoaded || !store.chaperoneSlotsLoaded || !store.chaperonesLoaded) {
    await Promise.all([
      store.loadEvents(),
      store.loadAllAvailability(),
      store.loadChaperoneSlots(),
      store.loadChaperones()
    ])
  } else {
    store.loadEvents()
    store.loadAllAvailability()
    store.loadChaperoneSlots()
    store.loadChaperones()
  }
  loadingData.value = false
})

const chipColor = (chaperone) => {
  const availability = store.allAvailability.find(availability => availability.chaperone_id === chaperone?.id && availability.event_id === currentEventID.value)?.available
  if (availability) return 'success'
  if (availability === null) return 'orange'
  return 'error'
}

const sortedChaperones = computed(() => {
  const eventAvailability = store.allAvailability.filter(availability => availability.event_id === currentEventID.value)
  const eventAvailabile = eventAvailability.filter(availability => availability.available)
  const eventUnknown = eventAvailability.filter(availability => availability.available === null)
  const eventUnavailable = eventAvailability.filter(availability => availability.available === false)
  return [...eventAvailabile, ...eventUnknown, ...eventUnavailable].map(availability => store.getChaperone(availability.chaperone_id))
})


const allowDrop = (e) => {
  e.preventDefault();
}

const drop = (e, slot) => {
  e.preventDefault();
  const chaperoneID = e.dataTransfer.getData('chaperoneID')
  slot.chaperone = parseInt(chaperoneID)
  store.updateChaperoneSlot(slot)
}

const dragStart = (e, chaperone) => {
  e.dataTransfer.setData('chaperoneID', chaperone.id)
}

const removeChaperone = (slot) => {
  currentEvent.value.slots.find(s => s.id === slot.id).chaperone = null
}

const nextEvent = () => {
  if (store.isLastEvent(currentEventID.value)) return
  const nextEventID = store.nextEvent(currentEventID.value)
  proxy.$router.push({ query: { id: nextEventID } })
  currentEventID.value = nextEventID
}

const previousEvent = () => {
  if (store.isFirstEvent(currentEventID.value)) return
  const previousEventID = store.previousEvent(currentEventID.value)
  proxy.$router.push({ query: { id: previousEventID } })
  currentEventID.value = previousEventID
}
</script>

<style scoped>
.success,
.orange {
  cursor: pointer;
}

.error {
  cursor: not-allowed;
}
</style>