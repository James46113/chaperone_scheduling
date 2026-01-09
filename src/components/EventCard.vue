<template>
  <v-card
    class="my-3 mx-1"
    :elevation="small ? 0 : 3"
    :style="small ? 'border: 1px solid rgb(var(--v-theme-primary))' : ''"
  >
    <v-row class="flex-nowrap">
      <v-col
        v-if="!small"
        cols="auto"
        max-width="200"
        class="mr-n4"
      >
        <v-card
          class="pa-2 date"
          max-width="100px"
          min-width="60px"
          elevation="0"
          style="border-radius: 0;"
          height="100%"
        >
          <p
            class="dow"
            height="100%"
          >
            {{ props.event.start.toLocaleString('en-GB', { weekday: 'short' }) }}
          </p>
          <p class="day">
            {{ props.event.start.getDate() }}
          </p>
          <p class="month">
            {{ props.event.start.toLocaleString('en-GB', { month: 'short' }) }}
          </p>
        </v-card>
      </v-col>
      <v-col class="pt-5">
        <div
          class="d-flex flex-row flex-wrap justify-start"
          style="width: 100%;"
        >
          <router-link
            :to="`/event/${props.event.id}`"
            class="routerlink"
          >
            <div class="flex-grow-1">
              <v-card-title style="white-space: normal; overflow-wrap: anywhere; line-height: 1.1; ">
                {{ props.event.title }}
              </v-card-title>
              <v-card-subtitle
                v-if="!small"
                class="mt-n2 mb-2"
                style="white-space: normal; overflow-wrap: anywhere;"
              >
                {{ props.event.location }}, {{ props.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }} – {{ props.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
              </v-card-subtitle>
              <div v-else>
                <v-card-subtitle
                  class="mt-n2 mb-1"
                  style="white-space: normal; overflow-wrap: anywhere;"
                >
                  {{ props.event.location }}
                </v-card-subtitle>
                <v-card-subtitle
                  class="mt-n2 mb-2"
                  style="white-space: normal; overflow-wrap: anywhere;"
                >
                  {{ props.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }} – {{ props.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                </v-card-subtitle>
              </div>
              <v-card-text
                v-if="store.isAdmin"
                class="mt-n4"
              >
                <b style="text-decoration: underline;">{{ lead_chaperone_name }}</b><br v-if="lead_chaperone_name">
                
                <span v-for="chaperone in sortedChaperones">
                    <i v-if="store.isSingingChaperoneFromName(chaperone)" style="color: rgb(var(--v-theme-primary))">
                      {{ chaperone }}
                    </i>
                    <span v-else>
                      {{ chaperone }}
                    </span>
                    <span v-if="chaperone !== sortedChaperones[sortedChaperones.length - 1]">, </span>
                </span>
              </v-card-text>
              <availability-selector
                v-if="props.small"
                :event="props.event.id"
                small
                class="mt-n3 ml-1"
                @mousedown.stop
                @click.stop
              />
            </div>
            <v-expand-transition style="margin-top: -28px;">
              <div
                v-if="showSlots && props.event.slots.filter(slot => slot.chaperone == props.chaperoneID).length > 0 && isMobile"
                v-show="showTimeline"
                class="pa-2 pt-5"
              >
                <v-fade-transition>
                  <v-timeline
                    v-show="showTimeline"
                    direction="vertical"
                    side="end"
                    dot-color="primary"
                    density="compact"
                    truncate-line="both"
                  >
                    <v-timeline-item :size="16">
                      <div class="mb-n2">
                        <b>
                          {{ props.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                        </b>
                        <p class="mt-n1">
                          Start
                        </p>
                      </div>
                    </v-timeline-item>
                    <template
                      v-for="slot in props.event.slots"
                      :key="slot.id"
                    >
                      <v-timeline-item
                        v-if="slot.chaperone == props.chaperoneID"
                        :size="16"
                      >
                        <div class="my-n2">
                          <b style="white-space: nowrap; overflow: visible;">
                            {{ slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }} – {{ slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                          </b>
                          <p class="mt-n1">
                            {{ slot.title }}
                          </p>
                        </div>
                      </v-timeline-item>
                    </template>
                    <v-timeline-item :size="16">
                      <div class="mt-n2">
                        <b>
                          {{ props.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                        </b>
                        <p class="mt-n1">
                          End
                        </p>
                      </div>
                    </v-timeline-item>
                  </v-timeline>
                </v-fade-transition>
              </div>
            </v-expand-transition>
          </router-link>
          <div
            v-if="showSlots && props.event.slots.filter(slot => slot.chaperone == props.chaperoneID).length > 0 && !isMobile"
            class="pa-2 mr-4"
          >
            <v-timeline
              direction="horizontal"
              side="end"
              dot-color="primary"
              density="compact"
              truncate-line="both"
            >
              <v-timeline-item :size="16">
                <div
                  class="mt-n6 d-flex flex-column justify-center align-center"
                  style="align-items: center;"
                >
                  <b>
                    {{ props.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                  </b>
                  <p class="mt-n1">
                    Start
                  </p>
                </div>
              </v-timeline-item>
              <template
                v-for="slot in props.event.slots"
                :key="slot.id"
              >
                <v-timeline-item
                  v-if="slot.chaperone == props.chaperoneID"
                  :size="16"
                >
                  <div
                    class="mt-n6 d-flex flex-column justify-center align-center"
                    style="align-items: center;"
                  >
                    <b style="white-space: nowrap; overflow: visible;">
                      {{ slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }} – {{ slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                    </b>
                    <p
                      class="mt-n1"
                      style="text-align: center;"
                    >
                      {{ slot.title }}
                    </p>
                  </div>
                </v-timeline-item>
              </template>
              <v-timeline-item :size="16">
                <div
                  class="mt-n6 d-flex flex-column justify-center align-center"
                  style="align-items: center;"
                >
                  <b>
                    {{ props.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                  </b>
                  <p class="mt-n1">
                    End
                  </p>
                </div>
              </v-timeline-item>
            </v-timeline>
          </div>
          <div
            v-if="props.getAvailability"
            class="ml-2"
            style="min-width: 200px; margin-left: auto"
          >
            <availability-selector
              v-if="!props.small"
              :event="props.event.id"
              small
              :class="isMobile ? 'mt-n6' : 'mt-n3'"
              @mousedown.stop
              @click.stop
            />
          </div>
        </div>
      </v-col>
      <v-col
        v-if="isMobile && props.showSlots"
        cols="auto"
      >
        <v-btn
          variant="text"
          color="primary"
          height="100%"
          @click="showTimeline = !showTimeline"
        >
          <v-icon size="32">
            {{ showTimeline ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
          </v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { useAppStore } from '@/stores/app'

const { proxy } = getCurrentInstance()
const store = useAppStore();
const props = defineProps({
  event: Object,
  small: Boolean,
  getAvailability: Boolean,
  showSlots: Boolean,
  chaperoneID: Number,
})

const showTimeline = ref(false);

const lead_chaperone_name = computed(() => store.getChaperone(props.event.lead_chaperone)?.name)
const sortedChaperones = computed(() => { 
  const sorted_names =  [... new Set(props.event.chaperones)].sort() 
  return sorted_names.filter(name => name !== lead_chaperone_name.value && name)
})
const missingChaperones = computed(() => props.event.chaperones?.includes(null) && !props.event.chaperones?.every(chaperone => chaperone === null))

const goToEvent = (value) => {
  if (!value.target.closest('.v-btn')) {
    proxy.$router.push(`/event/${props.event.id}`)
  }
}

</script>

<style lang="scss" scoped>
  .eventcard {
    border: 1px solid rgb(var(--v-theme-primary));
  }

  .routerlink {
    display: contents !important;
    text-decoration: none !important;
    color: inherit !important;
    
    &:hover, &:visited, &:active {
      text-decoration: none !important;
      color: inherit !important;
    }  
  }

  .month, .dow {
    text-transform: uppercase;
    text-align: center;
  }

  .day {
    padding-top: 0;
    margin-top: -10px;
    margin-bottom: -10px;
    font-size: x-large;
    font-weight: bold;
    text-align: center;
  }

  .date {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 1px solid rgb(var(--v-theme-primary));
    color: white;
    background-color: rgb(var(--v-theme-primary));
  }
</style>