<template>
  <!-- <table>
    <tr>
      <th v-for="event in events">{{ event.start.toLocaleDateString() }}</th>
    </tr>
  </table> -->
  <app-header />
  <div class="pa-4 d-flex justify-center">
    <v-card elevation="0" width="80vw">
      <v-card-title class="text-h5">Chaperone Availability</v-card-title>
      <v-row class="mt-6">
        <v-date-input variant="outlined" label="Start" class="px-3" max-width="300" v-model="start" :max="end" />
        <v-date-input variant="outlined" label="End" class="px-3" max-width="300" v-model="end" :min="start" />
      </v-row>
      <v-card-text v-if="loadingData">Loading...</v-card-text>

      <table v-else-if="showTable" class="ma-7">
        <tr>
          <th></th>
          <th v-for="event in eventsInRange">
            <div class="vertical-text">
              {{ event.start.toLocaleDateString() }}
            </div>
          </th>
        </tr>

        <tr v-for=" chaperone in chaperones">
          <td>{{ chaperone.name }}</td>
          <td v-for="event in eventsInRange">
            <span
              v-if="availabilities.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available">
              <v-icon>mdi-check</v-icon>
            </span>
            <span
              v-else-if="availabilities.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available === null">
              <pre> ?</pre>
            </span>
          </td>
        </tr>
      </table>
      <v-card-text v-else>No events found in the selected range</v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { VDateInput } from 'vuetify/labs/VDateInput'


const chaperones = ref([])
const events = ref([])
const eventsInRange = computed(() => events.value.filter(event => event.start >= start.value && event.end <= end.value))
const availabilities = ref([])
const showTable = computed(() => eventsInRange.value.length > 0)

const start = ref(new Date())
const end = ref(new Date())
end.value.setMonth(start.value.getMonth() + 1)

onMounted(async () => {
  loadingData.value = true

  await Promise.all([

    fetchAPI('chaperones', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        data.sort((a, b) => a.name.localeCompare(b.name));
        chaperones.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      }),

    fetchAPI('events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        data = data.map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }))
        data.sort((a, b) => a.start - b.start);
        events.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      }),

    fetchAPI('chaperones/availability', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        availabilities.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  ])
  loadingData.value = false
})

</script>

<style scoped>
table,
th,
td {
  border: 1px solid black;
  border-collapse: collapse;
}

th,
td {
  padding: 8px;
  text-align: left;
}

.vertical-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  text-align: start;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>