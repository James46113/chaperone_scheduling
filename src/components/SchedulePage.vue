<template>
  <div class="pa-4 d-flex justify-center" v-if="!loadingData && !isChoirPhone && !notFound">
    <v-card :width="isMobile ? '100vw' : '80vw'" elevation="0" class="mx-n1">
      <v-card-title class="text-h5" v-if="chaperone?.name">{{ chaperone?.name }}{{ chaperone?.name.slice(-1) === 's' ?
        "'"
        : "'s" }} Schedule</v-card-title>

      <v-card-text>
        Chaperone names in <i class="text-primary">red itallics</i> are singing chaperones.
      </v-card-text>

      <v-sheet v-for="event in events" elevation="2" class="my-2" variant="outlined" color="primary"
        style="padding: 1px; cursor: pointer;" rounded @click="proxy.$router.push(`/event/${event.id}`)">
        <v-card class="pa-1">
          <v-icon v-if="isMobile" color="primary" size="25" class="mt-2 mr-3"
            style="position: absolute; right: 0px">mdi-open-in-new</v-icon>

          <v-card-title v-if="!isMobile">
            {{ event.title }} - {{ event.start.toLocaleDateString('en-GB', {
              weekday: 'short', day: 'numeric',
              month: 'short', year: 'numeric'
            }) }}
            <v-icon v-if="!isMobile" color="primary" size="25" class="mt-n1 ml-2">mdi-open-in-new</v-icon>
          </v-card-title>
          <div v-else>
            <v-card-title>
              {{ event.start.toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric',
                month: 'short', year: 'numeric'
              }) }}
            </v-card-title>
            <v-divider class="mt-n1" />
            <v-card-title class="mt-n1 mb-n2">
              {{ event.title }}
            </v-card-title>
          </div>

          <v-card-subtitle>{{ event.location }}</v-card-subtitle>
          <v-card-subtitle>
            {{ event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }} -
            {{ event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
          </v-card-subtitle>

          <v-card-text v-if="false">Lead Chaperone: {{ event.lead_chaperone }}</v-card-text>
          <div v-for="slot in event.slots">
            <div class="mt-2" v-if="slot.chaperone == chaperone_id">
              <v-divider />
              <v-card-text><b>{{ slot.title }}</b></v-card-text>
              <v-card-subtitle class="mt-n4">{{ slot.start.toLocaleTimeString([], {
                hour: '2-digit', minute: '2-digit', hour12: false
              })
                }}
                - {{
                  slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                }}</v-card-subtitle>
              <v-card-text class="mt-n3">
                <span v-if="slot.details?.length > 0">
                  {{ slot.details }}
                </span>
                <i v-else>No Details Available</i>
              </v-card-text>
            </div>
          </div>
        </v-card>
      </v-sheet>

      <v-card-text v-if="events.length === 0 && !loadingData">
        <i>No upcoming events scheduled</i>
      </v-card-text>
    </v-card>
  </div>
  <div v-else-if="isChoirPhone">
    <div class="pa-4">
      <v-card elevation="0">
        <v-card-title class=" text-h5">Choir Phone</v-card-title>
        <v-card-text>
          The choir phone is a dedicated phone used by the chaperones for communication during events. It ensures that
          there
          is always a reliable point of contact for chaperones, choristers, and parents during events.

          <br><br>

          <b>How to use the app:</b>
          <ul class="ml-6">
            <li><b>View Events: </b>Click on the calendar or the list icon at the bottom of the screen to view events
              on
              a calendar or as a list respectively.</li>

            <li><b>Event Details:</b> Each event card shows the title, date, time, and location. Click on the event to
              view the event's details page.</li>

            <li><b>Chaperones:</b> Within each event, you can see the chaperones assigned to each of the groups.
              Details
              about each group, including start and end times, are provided.</li>

            <li><b>Risk Assessments & Other Details:</b> Scroll down to the bottom of the event's details page to view
              the additional information such as risk assessments</li>
          </ul>
        </v-card-text>
      </v-card>
    </div>
  </div>
  <div v-else-if="notFound" class="d-flex justify-center mt-10">
    <v-card class="ma-4 pa-4" :width="isMobile ? '100vw' : '40vw'">

      <v-img src="/Steel-City-Choristers.png" width="15vw"></v-img>
      <v-card-title>Chaperone Not Found</v-card-title>
      <v-card-text>
        The chaperone you are looking for does not exist. Their account may have been deleted. Please check the URL and
        try again.
      </v-card-text>

      <div class="d-flex justify-center">
        <v-btn @click="proxy.$router.push('/chaperones')" variant="flat" max-width="30%"
          color="primary">Chaperones</v-btn>
      </div>
    </v-card>
  </div>
  <div v-else class="d-flex justify-center align-center" style="height: 68vh;">
    <v-progress-circular color="primary" indeterminate size="40" />
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app'

const store = useAppStore();

const props = defineProps({
  chaperone_id: Number,
})

const { proxy } = getCurrentInstance()
const events = computed(() => store.getEventsByChaperone(props.chaperone_id))
const chaperone = computed(() => store.chaperones.find(chaperone => chaperone.id == props.chaperone_id))
const isChoirPhone = computed(() => props.chaperone_id == 0)
const notFound = ref(false)

onMounted(async () => {
  loadingData.value = true

  if (!store.eventsLoaded || !store.chaperonesLoaded || !store.chaperoneSlotsLoaded) {
    await Promise.all([
      store.loadChaperoneSlots(),
      store.loadChaperones(),
      store.loadEvents(),
    ])
  } else {
    store.loadEvents()
    store.loadChaperoneSlots()
    store.loadChaperones()
  }

  if (!chaperone.value) {
    notFound.value = true
  }

  loadingData.value = false
})

</script>

<style scoped>
li {
  margin-top: 0.5em;
}
</style>