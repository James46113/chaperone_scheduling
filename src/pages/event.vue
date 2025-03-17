<template>
  <app-header />
  <v-card :class="isMobile ? 'pa-4' : 'pa-10'" v-if="!loadingData">
    <v-row>
      <div>
        <v-card-title class="text-h4 mb-n5" style="white-space: pre-wrap;">{{ event.title
          }}</v-card-title>

        <v-btn v-if="!isMobile && store.isAdmin && !event.isPastEvent"
          @click="proxy.$router.push(`/event/${proxy.$route.params.id}/edit`)" color="primary"
          style="position: absolute; right: 32px;">Edit Event</v-btn>

        <v-card-title v-if="!loadingData">{{ event.dateString }}, {{ event.start?.toLocaleTimeString([], {
          hour:
            '2-digit', minute: '2-digit', hour12: false
        }) }}
          - {{ event.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          }}</v-card-title>
        <v-card-subtitle>
          {{ event.location }}
        </v-card-subtitle>
      </div>

      <!-- <v-divider class="my-4"></v-divider> -->
      <div :class="isMobile ? '' : 'ml-6 mt-4'" v-if="!loadingData && !isMobile">
        <availability-selector :event="event.id" />
      </div>
    </v-row>

    <v-btn v-if="isMobile && store.isAdmin && !event.isPastEvent"
      @click="proxy.$router.push(`/event/${proxy.$route.params.id}/edit`)" color="primary" class="mt-10"
      width="100vw">Edit</v-btn>

    <availability-selector :event="event.id" v-if="isMobile" class="mt-8" />

    <v-divider class="mb-4 mt-10"></v-divider>
    <v-row>
      <v-card-title>Chaperones</v-card-title>
      <v-spacer />
      <v-btn flat color="primary" class="my-1" v-if="store.isAdmin && !isMobile && !event.isPastEvent"
        @click="proxy.$router.push(`/event/${eventID}/edit/chaperones`)">Edit Chaperones</v-btn>
    </v-row>

    <v-card-text v-if="false">Lead Chaperone: {{ event.lead_chaperone }}</v-card-text>

    <v-data-table :headers="tableHeaders" :items="event.slots" hide-default-footer v-if="!isMobile">
      <template #item.startTime="{ item }">
        {{ item.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
      </template>
      <template #item.endTime="{ item }">
        {{ item.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
      </template>
      <template #item.chaperoneName="{ item }">
        <span v-if="item.chaperoneName">{{ item.chaperoneName }}</span>
        <v-alert v-else type="warning" class="pa-2">
          <span>No chaperone</span>
        </v-alert>
      </template>
      <template #item.details="{ item }">
        <span v-if="item.details?.length > 0">
          {{ item.details }}
        </span>
        <i v-else>No details available</i>
      </template>
      <template v-slot:no-data>
        <v-card-text v-if="loadingData">Loading...</v-card-text>
        <v-alert v-else type="warning" class="mt-3">
          No chaperones assigned
        </v-alert>
      </template>
    </v-data-table>

    <v-card v-else v-for="slot in event.slots" class="mb-4">
      <v-card-title v-if="slot.chaperone">{{store.chaperones.find(chaperone => chaperone.id === slot.chaperone)?.name
        }}</v-card-title>
      <v-alert v-else type="warning" class="mb-6">No Chaperone</v-alert>
      <v-card-subtitle class="mt-n2">{{ slot.title }}</v-card-subtitle>
      <v-card-subtitle>{{ slot.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }} -
        {{ slot.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}</v-card-subtitle>
      <v-card-text>
        <span v-if="slot.details?.length > 0">
          {{ slot.details }}
        </span>
        <i v-else>No details available</i>
      </v-card-text>

    </v-card>
    <v-divider />
    <v-card-title class="my-3">Details</v-card-title>
    <v-card-text>
      <span style="white-space: pre-wrap;">
        {{ event.details?.length > 0 ? event.details : 'No details available' }}
      </span>
    </v-card-text>
  </v-card>
  <div v-else class="d-flex justify-center align-center" style="height: 70vh;">
    <v-progress-circular color="primary" indeterminate size="40" />
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';


const { proxy } = getCurrentInstance()
const store = useAppStore();

const eventID = proxy.$route.params.id
const event = ref({})

const tableHeaders = [
  { title: 'Group', key: 'title', width: '20%' },
  { title: 'Chaperone', key: 'chaperoneName', width: '15%' },
  { title: 'Details', key: 'details', width: '35%' },
  { title: 'Start', key: 'startTime', width: '12%' },
  { title: 'End', key: 'endTime', width: '12%' },
];

onMounted(async () => {
  loadingData.value = true
  if (!store.eventsLoaded || !store.availabilityLoaded || !store.chaperonesLoaded || !store.chaperoneSlotsLoaded) {
    await Promise.all([
      store.loadEvents(),
      store.loadAvailability(),
      store.loadChaperoneSlots(),
      store.loadChaperones(),
    ])
  } else {
    store.loadEvents()
    store.loadChaperoneSlots()
    store.loadAvailability()
    store.loadChaperones()
  }

  event.value = store.getEvent(eventID)
  loadingData.value = false

  document.title = `${event.value.title} - Steel City Choristers`;
})
</script>