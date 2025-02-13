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
      <v-card-text class="pl-0">
        <v-card-text v-if="loadingData" class="ma-0">
          Loading...
        </v-card-text>
        <span v-for="chaperone in event.chaperones" v-else-if="event.chaperones?.length > 0 ?? false">
          <v-card-text v-if="!!chaperone" :style="chaperone == event.lead_chaperone ? 'font-weight: bold;' : ''"
            class="py-0">
            {{ chaperones.find(c => c.id === chaperone)?.name }}<br>
          </v-card-text>
        </span>
        <v-sheet v-else color="warning" class="pa-2">
          <span>No chaperones assigned</span>
        </v-sheet>
      </v-card-text>
    </div>
    <availability-selector :event="event" small class="mt-n3" />
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