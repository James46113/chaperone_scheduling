<template>
  <v-sheet elevation="2" class="ma-2" variant="outlined" color="primary" style="padding: 1px;" rounded>
    <v-card class="pa-1">
      <div @click="goToEvent" style="cursor: pointer;">
        <div v-if="isMobile">
          <v-icon color="primary" size="25" class="mt-2 mr-3"
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
        <!-- <v-alert type="warning" width="60px" /> -->

        <v-card-title v-if="small && !isMobile">
          {{ event.title }}
          <v-icon v-if="!small" color="primary" size="25" class="mt-n1 ml-2">mdi-open-in-new</v-icon>
          <v-icon v-else color="primary" size="25" style="position: absolute; right: 12px">mdi-open-in-new</v-icon>
        </v-card-title>

        <div v-else-if="!isMobile">
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
          {{ new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }} -
          {{ new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
        </v-card-subtitle>

        <v-card-text class="pl-0">
          <span v-for="chaperone in sortedChaperones">
            <v-card-text v-if="chaperone" class="py-0">
              {{ chaperone }}<br>
            </v-card-text>
          </span>
          <v-alert v-if="missingChaperones && store.isAdmin" density="compact" type="warning" class="mt-1"
            max-width="400px">Empty
            Slot(s)</v-alert>
          <div v-if="loadingData" class="d-flex justify-center align-center">
            <v-progress-circular color="primary" indeterminate />
          </div>
        </v-card-text>
      </div>
      <availability-selector :event="event.id" small class="mt-n3" />
    </v-card>
  </v-sheet>
</template>

<script setup>
import { useAppStore } from '@/stores/app'


const { proxy } = getCurrentInstance()
const store = useAppStore();
const props = defineProps({
  event: Object,
  small: Boolean
})

const sortedChaperones = computed(() => [... new Set(props.event.chaperones)].sort())
const missingChaperones = computed(() => props.event.chaperones?.includes(null) && !props.event.chaperones?.every(chaperone => chaperone === null))

const goToEvent = (value) => {
  if (!value.target.closest('.v-btn')) {
    proxy.$router.push(`/event?id=${props.event.id}`)
  }
}

</script>