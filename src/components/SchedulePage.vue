<template>
  <div class="pa-4 d-flex justify-center" v-if="!loadingData">
    <v-card :width="isMobile ? '100vw' : '80vw'" elevation="0" class="mx-n1">
      <v-card-title class="text-h5" v-if="chaperone?.name">{{ chaperone?.name }}{{ chaperone?.name.slice(-1) === 's' ?
        "'"
        : "'s" }} Schedule</v-card-title>

      <v-sheet v-for="event in events" elevation="2" class="my-2" variant="outlined" color="primary"
        style="padding: 1px;" rounded @click="proxy.$router.push(`/event?id=${event.id}`)">
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
            {{ event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} -
            {{ event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </v-card-subtitle>

          <v-card-text v-if="false">Lead Chaperone: {{ event.lead_chaperone }}</v-card-text>
          <div v-for="slot in event.slots" class="mt-2">
            <v-divider />
            <v-card-text><b>{{ slot.title }}</b></v-card-text>
            <v-card-subtitle class="mt-n4">{{ slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }}
              - {{
                slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</v-card-subtitle>
            <v-card-text class="mt-n3">
              <span v-if="slot.details?.length > 0">
                {{ slot.details }}
              </span>
              <i v-else>No Details Available</i>
            </v-card-text>
          </div>
        </v-card>
      </v-sheet>

      <v-card-text v-if="events.length === 0 && !loadingData">
        <i>No upcoming events scheduled</i>
      </v-card-text>
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


onMounted(async () => {
  loadingData.value = true
  store.loadChaperoneSlots();
  store.loadChaperones();

  // await getChaperones();
  // await Promise.all([
  //   fetchAPI(`events/chaperone/${props.chaperone_id}`, {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       events.value = data.map((event) => ({
  //         ...event,
  //         lead_chaperone: chaperones.value.find(chaperone => chaperone.id === event.lead_chaperone)?.name ?? null,
  //         start: new Date(event.start),
  //         end: new Date(event.end),
  //       }))
  //         .filter(event => event.end > new Date());
  //       events.value.sort((a, b) => a.start - b.start)
  //     }).catch((error) => {
  //       console.error('Error:', error)
  //     }),

  //   fetchAPI(`chaperone_slots/chaperone/${props.chaperone_id}`, {
  //     method: 'GET',
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       chaperone_slots.value = data;
  //     }).catch(error => {
  //       console.error('Error:', error)
  //     })
  // ])

  // events.value.forEach(event => {
  //   event.chaperone_slots = chaperone_slots.value.filter(slot => slot.event_id === event.id).map(slot => ({
  //     ...slot,
  //     start: new Date(slot.start),
  //     end: new Date(slot.end),
  //   }));
  //   event.chaperone_slots.sort((a, b) => a.start - b.start);
  // })

  loadingData.value = false
})

// const getChaperones = async () => {
//   await fetchAPI('chaperones', {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       chaperones.value = data;
//       chaperone.value = data.find(c => c.id == props.chaperone_id)
//       document.title = `${chaperone.value?.name}'s Schedule - Steel City Choristers`
//     })
//     .catch((error) => {
//       console.error('Error:', error)
//     });
// }

</script>