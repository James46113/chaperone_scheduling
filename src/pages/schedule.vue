<template>
  <app-header />
  <v-card class="ma-4">
    <v-card-title class="text-h5">{{ proxy.$route.query.name }}'s Schedule</v-card-title>
    <v-sheet v-for="event in events" class="ma-2" variant="outlined" color="primary" style="padding: 1px;" rounded>
      <v-card class="pa-1">
        <v-row class="pa-3" @click="proxy.$router.push(`/event?id=${event.id}`)" style="cursor: pointer;">
          <v-card-title style="white-space: pre; ">
            {{ event.title }}{{ isMobile ? '\n' : ' - ' }}{{ event.start.toLocaleDateString() }}
            <v-icon v-if="!isMobile" color="primary" size="25" class="mt-n1 ml-2">mdi-open-in-new</v-icon>
          </v-card-title>
          <v-spacer />
          <v-icon v-if="isMobile" color="primary" size="25" class="mt-3 mr-3">mdi-open-in-new</v-icon>
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
        <div v-if="loadingData">
          <v-divider></v-divider>
          <v-card-text>Loading...</v-card-text>
        </div>
      </v-card>
    </v-sheet>

    <v-card-text v-if="events.length === 0">
      <span v-if="loadingData">Loading...</span>
      <i v-else>No upcoming events scheduled</i>
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
  loadingData.value = true

  fetchAPI(`events/${proxy.$route.query.name}`, {
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
        fetchAPI(`events/${event.id}/${proxy.$route.query.name}`, {
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
            loadingData.value = false
          })
      })
    }).catch((error) => {
      console.error('Error:', error)
      loadingData.value = false
    });
})

</script>