<template>
  <v-sheet elevation="2" class="ma-2" variant="outlined" color="primary" style="padding: 1px;" rounded>
    <v-card class="pa-1">
      <div @click="goToEvent" style="cursor: pointer;">
        <div v-if="isMobile">
          <v-icon v-if="isMobile" color="primary" size="25" class="mt-2 mr-3"
            style="position: absolute; right: 0px">mdi-open-in-new</v-icon>
          <v-card-title>
            {{
              event.start.toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric',
                month: 'short', year: 'numeric'
              })
            }}
          </v-card-title>
          <v-divider class="mt-n1" />
          <v-card-title class="mt-n1">
            {{ event.title }}
          </v-card-title>
        </div>

        <v-card-title v-if="small">
          {{ event.title }}
          <v-icon v-if="!small" color="primary" size="25" class="mt-n1 ml-2">mdi-open-in-new</v-icon>
          <v-icon v-else color="primary" size="25" style="position: absolute; right: 12px">mdi-open-in-new</v-icon>
        </v-card-title>

        <div v-else>
          <v-card-title>
            {{ event.start.toLocaleDateString('en-GB', {
              weekday: 'short', day: 'numeric',
              month: 'short', year: 'numeric'
            }) }} - {{ event.title }}
            <v-icon color="primary" size="25" class="mt-n1 ml-2">mdi-open-in-new</v-icon>
          </v-card-title>
        </div>

        <v-card-subtitle class="mt-n3">
          {{ event.location }}
        </v-card-subtitle>
        <v-card-subtitle>
          {{ new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} -
          {{ new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
        </v-card-subtitle>

        <v-card-text class="pl-0">
          <span v-for="chaperone in event.chaperones" v-if="event.chaperones?.length > 0 ?? false">
            <v-card-text v-if="!!chaperone" :style="chaperone == event.lead_chaperone ? 'font-weight: bold;' : ''"
              class="py-0">
              {{ chaperones.find(c => c.id === chaperone)?.name }}<br>
            </v-card-text>
          </span>
          <v-alert v-else-if="!loadingData" type="warning" class="ml-1 pa-2" max-width="400px">
            No chaperones assigned
          </v-alert>
          <div v-else class="d-flex justify-center align-center">
            <v-progress-circular color="primary" indeterminate />
          </div>
        </v-card-text>
      </div>
      <availability-selector :event="event" small class="mt-n3" />
    </v-card>
  </v-sheet>
</template>

<script setup>

const { proxy } = getCurrentInstance()
const props = defineProps({
  event: Object,
  chaperones: Array,
  small: Boolean
})


const goToEvent = (value) => {
  if (!value.target.closest('.v-btn')) {
    proxy.$router.push(`/event?id=${props.event.id}`)
  }
}

</script>