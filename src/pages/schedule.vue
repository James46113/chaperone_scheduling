<template>
  <app-header />
  <v-card class="ma-4">
    <v-card-title class="text-h5">{{ proxy.$route.query.name }}'s Schedule</v-card-title>
    <v-sheet v-for="event in events" class="ma-2" variant="outlined" color="primary" style="padding: 1px;" rounded>
      <v-card class="pa-1">
        <v-row class="pa-3">
          <v-card-title>
            {{ event.title }} - {{ event.start.toLocaleDateString() }}

            <v-icon color="primary" size="25" class="mt-n1 ml-2"
              @click="proxy.$router.push(`/event?id=${event.id}`)">mdi-open-in-new</v-icon>
          </v-card-title>
        </v-row>
        <v-card-subtitle>{{ event.location }}</v-card-subtitle>
        <v-card-text>Lead Chaperone: {{ event.lead_chaperone }}</v-card-text>
        <div v-for="slot in event.chaperone_slots">
          <v-divider></v-divider>
          <v-card-text><b>{{ slot.title }}</b></v-card-text>
          <v-card-subtitle class="mt-n4">{{ slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
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

    <v-card-text>
      <i v-if="events.length === 0">No upcoming events scheduled</i>
    </v-card-text>
  </v-card>
</template>

<script setup>

const { proxy } = getCurrentInstance()
const events = ref([])

onMounted(() => {
  if (!proxy.$route.query.name) {
    proxy.$router.push('/chaperones')
  }
  document.title = `${proxy.$route.query.name}'s Schedule - Steel City Choristers`

  fetchAPI(`http://localhost:5001/events/${proxy.$route.query.name}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      events.value = data.map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }))
      events.value.sort((a, b) => a.start - b.start)
    })
    .then(() => {
      events.value.forEach(event => {
        fetchAPI(`http://localhost:5001/events/${event.id}/${proxy.$route.query.name}`, {
          method: 'GET',
        })
          .then((response) => response.json())
          .then((data) => {
            event.chaperone_slots = data.map(slot => ({
              ...slot,
              start: new Date(slot.start),
              end: new Date(slot.end),
            }));
            event.chaperone_slots.sort((a, b) => a.start - b.start);
          })
      })
    }).catch((error) => {
      console.error('Error:', error)
    });
})

</script>