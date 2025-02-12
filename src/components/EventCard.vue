<template>
  <v-card class="ma-1">
    <div @click="goToEvent" style="cursor: pointer;">
      <v-card-title>{{ isMobile ? event.start.toLocaleDateString() + ' - ' : '' }}{{ event.title }}</v-card-title>
      <v-card-subtitle class="mt-n3">
        {{ event.location }}
      </v-card-subtitle>
      <v-card-subtitle>
        {{ new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} -
        {{ new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
      </v-card-subtitle>
      <v-card-text>
        <v-card-text v-if="loadingData">
          Loading...
        </v-card-text>
        <span v-for="chaperone in event.chaperones" v-else-if="event.chaperones?.length > 0 ?? false">
          <span :style="chaperone == event.lead_chaperone ? 'font-weight: bold;' : ''">
            {{ chaperones.find(c => c.id === chaperone).name }}<br>
          </span>
        </span>
        <v-sheet v-else color="warning" class="pa-2">
          <span>No chaperones assigned</span>
        </v-sheet>
      </v-card-text>
    </div>
    <availability-selector :event="event" small />
  </v-card>

</template>

<script setup>

const { proxy } = getCurrentInstance()
const props = defineProps({
  event: Object,
  chaperones: Array,
})

const goToEvent = (value) => {
  if (!value.target.closest('.v-btn')) {
    proxy.$router.push(`/event?id=${props.event.id}`)
  }
}

</script>