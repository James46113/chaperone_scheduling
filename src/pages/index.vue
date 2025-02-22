<template>
  <app-header />
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

        <v-calendar class="pa-0" :events="store.events" :weekdays="[0, 1, 2, 3, 4, 5, 6]" hide-week-number>
          <template #event="{ event }" v-if="!isMobile" :interval-height="20">
            <event-card :event="event" small />
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
        <event-card v-if="!loadingData" v-for="event in store.upcomingEvents" :event="event" />
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

const { proxy } = getCurrentInstance()

const store = useAppStore();


document.title = "Chaperones' Calendar - Steel City Choristers"

onMounted(async () => {
  if (proxy.$route.query.view) {
    store.tabView = proxy.$route.query.view;
  }

  try {
    loadingData.value = true;
    if (!store.eventsLoaded || !store.availabilityLoaded || !store.chaperonesLoaded || !store.chaperoneSlotsLoaded) {
      await loadData();
    } else {
      loadData();
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    loadingData.value = false;
  }
})

const loadData = async () => {
  await Promise.all([
    store.loadAvailability(),
    store.loadEvents(),
    store.loadChaperones(),
    store.loadChaperoneSlots(),
  ])
}
</script>