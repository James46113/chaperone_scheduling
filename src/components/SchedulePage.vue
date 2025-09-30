<template>
  <div
    v-if="!loadingData && !isChoirPhone && !notFound"
    class="pa-4 d-flex justify-center"
  >
    <v-card
      :width="isMobile ? '100vw' : '80vw'"
      elevation="0"
      class="mx-n1"
    >
      <v-card-title
        v-if="chaperone?.name"
        class="text-h5"
      >
        {{ chaperone?.name }}{{ chaperone?.name.slice(-1) === 's' ?
          "'"
          : "'s" }} Schedule
      </v-card-title>
      <event-card 
        v-for="event in events"
        show-slots
        :event="event"
        :chaperone-i-d="chaperone_id"
      />
      
      <v-card-text v-if="events.length === 0 && !loadingData">
        <i>No upcoming events scheduled</i>
      </v-card-text>
    </v-card>
  </div>
  <div v-else-if="isChoirPhone">
    <div class="pa-4">
      <v-card elevation="0">
        <v-card-title class=" text-h5">
          Choir Phone
        </v-card-title>
        <v-card-text>
          The choir phone is a dedicated phone used by the chaperones for communication during events. It ensures that
          there
          is always a reliable point of contact for chaperones, choristers, and parents during events.

          <br><br>

          <b>How to use the app:</b>
          <ul class="ml-6">
            <li>
              <b>View Events: </b>Click on the calendar or the list icon at the bottom of the screen to view events
              on
              a calendar or as a list respectively.
            </li>

            <li>
              <b>Event Details:</b> Each event card shows the title, date, time, and location. Click on the event to
              view the event's details page.
            </li>

            <li>
              <b>Chaperones:</b> Within each event, you can see the chaperones assigned to each of the groups.
              Details
              about each group, including start and end times, are provided.
            </li>

            <li>
              <b>Risk Assessments & Other Details:</b> Scroll down to the bottom of the event's details page to view
              the additional information such as risk assessments
            </li>
          </ul>
        </v-card-text>
      </v-card>
    </div>
  </div>
  <div
    v-else-if="notFound"
    class="d-flex justify-center mt-10"
  >
    <v-card
      class="ma-4 pa-4"
      :width="isMobile ? '100vw' : '40vw'"
    >
      <v-img
        src="/Steel-City-Choristers.png"
        width="15vw"
      />
      <v-card-title>Chaperone Not Found</v-card-title>
      <v-card-text>
        The chaperone you are looking for does not exist. Their account may have been deleted. Please check the URL and
        try again.
      </v-card-text>

      <div class="d-flex justify-center">
        <v-btn
          variant="flat"
          max-width="30%"
          color="primary"
          @click="proxy.$router.push('/chaperones')"
        >
          Chaperones
        </v-btn>
      </div>
    </v-card>
  </div>
  <div
    v-else
    class="d-flex justify-center align-center"
    style="height: 68vh;"
  >
    <v-progress-circular
      color="primary"
      indeterminate
      size="40"
    />
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