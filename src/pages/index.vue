<template>
  <app-header />
  <div class="pa-3">
    <v-tabs
      v-if="!isMobile"
      v-model="store.tabView"
      grow
      color="primary"
    >
      <v-tab value="calendar">
        Calendar
      </v-tab>
      <v-tab value="list">
        List
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="store.tabView">
      <v-tabs-window-item value="calendar">
        <div
          v-if="store.isAdmin && !isMobile"
          style="position: absolute; right: 0px;"
          class="mt-2"
        >
          <actions-menu
            activator-i-d="calendarMenu"
            label="Actions"
          />
        </div>

        <v-progress-linear
          v-if="loadingData"
          indeterminate
          color="primary"
        />
        <v-calendar
          v-model="store.calendarDate"
          class="pa-0"
          :events="store.events"
          :weekdays="[0, 1, 2, 3, 4, 5, 6]"
          hide-week-number
        >
          <template
            v-if="!isMobile"
            #event="{ event }"
            :interval-height="20"
          >
            <event-card
              :event="event"
              small
              get-availability
            />
          </template>
          <template
            v-if="isMobile"
            #event="{ event }"
          >
            <v-card-text
              style="font-size: x-small; border-left: 2px solid; padding-left: 0.2em; border-color: #a80056;"
              class="py-0"
              @click="proxy.$router.push(`/event/${event.id}`)"
            >
              {{ event.title }}
            </v-card-text>
          </template>
        </v-calendar>
      </v-tabs-window-item>

      <v-tabs-window-item value="list">
        <v-row class="pt-5 px-3">
          <v-card-title class="text-h5">
            Upcoming Events
          </v-card-title>
          <v-spacer />
          <div
            v-if="store.isAdmin"
            :class="isMobile ? '' : 'mt-4 mr-4'"
          >
            <actions-menu
              activator-i-d="listMenu"
              :label="isMobile ? '' : 'Actions'"
            />
          </div>
        </v-row>

        <v-card-text>
          To give your availability, press on the tick or the cross on each event.<br>
          <span v-if="store.isAdmin">
            Lead chaperones (if present) are <b style="text-decoration: underline;">bold and underlined</b>.<br />
            Singing chaperones are in <i class="text-primary">red italics</i>.
          </span>
        </v-card-text>

        <v-divider
          v-if="store.isAdmin"
          class="mt-3"
        />

        <div class="my-8" />
        <event-card
          v-for="event in store.upcomingEvents"
          v-if="!loadingData"
          :event="event"
          get-availability
          :chaperone-i-d="store.userID"
        />
        <div
          v-else
          class="d-flex justify-center align-center"
          style="height: 23vh;"
        >
          <v-progress-circular
            color="primary"
            indeterminate
            size="40"
          />
        </div>
        <v-card-text
          v-if="store.upcomingEvents.length === 0 && !loadingData"
          class="mt-n6"
        >
          <i>No upcoming events scheduled</i>
        </v-card-text>
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
import { notificationsSubscribe } from '@/services/functions.js'


const { proxy } = getCurrentInstance()

const store = useAppStore();

document.title = "Chaperones' Calendar - Steel City Choristers"

document.addEventListener('click', handleUserInteraction);
document.addEventListener('touchend', handleUserInteraction);

function handleUserInteraction() {
  if (isSignedIn.value && serviceworker.value) {
    notificationsSubscribe(store.userID)
  }
  document.removeEventListener('click', handleUserInteraction);
  document.removeEventListener('touchend', handleUserInteraction);
}

onMounted(async () => {
  if (proxy.$route.query.view) {
    store.tabView = proxy.$route.query.view;
  }

  loadingData.value = false;
  if (!store.eventsLoaded || !store.availabilityLoaded || !store.chaperonesLoaded || !store.chaperoneSlotsLoaded) {
    loadingData.value = true;
    await loadData();
  } else {
    loadData();
  }
  loadingData.value = false;
})

const loadData = async () => {
  if (store.isAdmin) {
    store.loadAllAvailability();
    store.loadTemplateSlots();
    store.loadTemplates();
  }

  await Promise.all([
    store.loadAvailability(),
    store.loadEvents(),
    store.loadChaperones(),
    store.loadChaperoneSlots(),
  ])
}
</script>