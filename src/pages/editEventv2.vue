<template>
  <app-header />
  <div
    v-if="!loadingData"
    class="pa-6"
  >
    <v-card
      class="pa-3"
      elevation="0"
    >
      <v-card-title class="text-h5 ml-n6 mb-4">
        Edit {{ isTemplate ? 'Template' : 'Event' }}
      </v-card-title>
      <v-row>
        <v-col>
          <v-text-field
            v-if="isTemplate"
            v-model="event.template_name"
            :width="isMobile ? '100%' : '65vw'"
            :rules="[required]"
            label="Template Name"
            variant="outlined"
            class="mb-1"
          />

          <v-text-field
            v-model="event.title"
            :width="isMobile ? '100%' : '65vw'"
            :rules="[required]"
            label="Event Title"
            variant="outlined"
            class="mb-1"
          />

          <v-text-field
            v-model="event.location"
            :width="isMobile ? '100%' : '65vw'"
            :rules="[required]"
            label="Location"
            variant="outlined"
            class="mb-1"
          />
        </v-col>
        <v-col v-if="!isMobile">
          <div class="d-flex justify-end">
            <v-btn
              v-if="!event.isPastEvent"
              color="primary"
              class="mt-2 mr-4"
              variant="outlined"
              @click="showConfirmDeleteDialog = true"
            >
              Delete {{ isTemplate ? 'Template' : 'Event' }}
            </v-btn>
            <v-btn
              color="primary"
              class="mt-2"
              :loading="saving"
              @click="saveEvent"
            >
              Save
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row
        v-if="!isMobile"
        class="mb-1"
      >
        <v-col v-if="!isTemplate">
          <v-text-field
            type="text"
            readonly
            variant="outlined"
            class="mt-3"
            max-width="300"
            prepend-icon="mdi-calendar"
            @click="showDateMenu = true"
          >
            {{ event.date?.toLocaleDateString('en-GB') }}
            <v-menu
              v-model="showDateMenu"
              activator="parent"
              :close-on-content-click="false"
            >
              <v-confirm-edit v-model="event.date">
                <template #default="{ model: proxyModel, actions, save, cancel, isPristine }">
                  <v-date-picker v-model="proxyModel.value">
                    <template #actions>
                      <!-- <component :is="actions"></component> -->
                      <v-btn
                        text
                        @click="() => { cancel(); showDateMenu = false; }"
                      >
                        Cancel
                      </v-btn>
                      <v-btn
                        text
                        color="primary"
                        @click="() => { save(); showDateMenu = false; }"
                      >
                        Ok
                      </v-btn>
                    </template>
                  </v-date-picker>
                </template>
              </v-confirm-edit>
            </v-menu>
          </v-text-field>
        </v-col>
        <v-col>
          <v-row class="my-2">
            <span class="ml-4 mt-5 mr-3">Start</span>
            <time-picker
              :hours="event.startHours"
              :minutes="event.startMinutes"
              @update:hours="updateEventStartHours"
              @update:minutes="updateEventStartMinutes"
            />
          </v-row>
        </v-col>
        <v-col>
          <v-row class="my-2">
            <span class="ml-4 mt-5 mr-5">End</span>
            <time-picker
              :hours="event.endHours"
              :minutes="event.endMinutes"
              @update:hours="updateEventEndHours"
              @update:minutes="updateEventEndMinutes"
            />
          </v-row>
        </v-col>
        <v-col />
      </v-row>

      <div v-else>
        <v-text-field
          v-if="!isTemplate"
          type="text"
          readonly
          variant="outlined"
          class="mt-3"
          max-width="300"
          prepend-icon="mdi-calendar"
          @click="showDateMenu = true"
        >
          {{ event.date?.toLocaleDateString('en-GB') }}
          <v-menu
            v-model="showDateMenu"
            activator="parent"
            :close-on-content-click="false"
          >
            <v-confirm-edit v-model="event.date">
              <template #default="{ model: proxyModel, actions, save, cancel, isPristine }">
                <v-date-picker v-model="proxyModel.value">
                  <template #actions>
                    <!-- <component :is="actions"></component> -->
                    <v-btn
                      text
                      @click="() => { cancel(); showDateMenu = false; }"
                    >
                      Cancel
                    </v-btn>
                    <v-btn
                      text
                      color="primary"
                      @click="() => { save(); showDateMenu = false; }"
                    >
                      Ok
                    </v-btn>
                  </template>
                </v-date-picker>
              </template>
            </v-confirm-edit>
          </v-menu>
        </v-text-field>

        <v-row class="px-3">
          <span class="ml-4 mt-5 mr-3">Start</span>
          <v-spacer />
          <time-picker
            :hours="event.startHours"
            :minutes="event.startMinutes"
            @update:hours="updateEventStartHours"
            @update:minutes="updateEventStartMinutes"
          />
        </v-row>

        <v-row class="px-3">
          <span class="ml-4 mt-5 mr-5">End</span>
          <v-spacer />
          <time-picker
            :hours="event.endHours"
            :minutes="event.endMinutes"
            @update:hours="updateEventEndHours"
            @update:minutes="updateEventEndMinutes"
          />
        </v-row>
      </div>

      <v-textarea
        v-model="event.details"
        class="mt-6"
        label="Event Details (Optional)"
        variant="outlined"
        auto-grow
        rows="2"
      />

      <v-divider class="mt-4" />

      <v-row class="my-3">
        <v-card-title class="mt-4">
          Chaperones
        </v-card-title>
        <v-spacer />
        <v-btn
          v-if="!isMobile"
          color="primary"
          variant="outlined"
          class="mt-6 mr-6"
          @click="newSlot"
        >
          Add
          Chaperone
        </v-btn>
      </v-row>

      <v-spacer />

      <v-data-table
        v-if="!isMobile"
        :height="event.slots?.length > 0 ? (event.slots?.length + 1) * 76 : undefined"
        :items="event.slots"
        :headers="tableHeaders"
        items-per-page="-1"
        hide-default-footer
      >
        <template #item.chaperone="{ item }">
          <v-select
            v-model="item.selectedChaperoneName"
            clearable
            :items="event.availability"
            item-title="chaperoneName"
            label="Chaperone"
            variant="outlined"
            density="compact"
            class="mt-3 mb-1"
          >
            <template #item="{ props, item }">
              <v-list-item
                v-bind="props"
                :disabled="item.raw.available === false"
              >
                <v-list-item-subtitle>
                  <v-chip
                    variant="outlined"
                    width="100px"
                    height="100%"
                    density="compact"
                    size="small"
                    :color="item.raw.available ? 'green' : item.raw.available === false ? 'error' : 'orange'"
                  >
                    {{
                      item.raw.available ? 'Available' : item.raw.available === false ? 'Unavailable' : 'Not Answered'
                    }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>
        </template>

        <template #item.startTime="{ item }">
          <time-picker
            :hours="item.startHours"
            :minutes="item.startMinutes"
            @update:hours="item.startHours = $event"
            @update:minutes="item.startMinutes = $event"
          />
        </template>
        <template #item.endTime="{ item }">
          <time-picker
            :hours="item.endHours"
            :minutes="item.endMinutes"
            @update:hours="item.endHours = $event"
            @update:minutes="item.endMinutes = $event"
          />
        </template>
        <template #item.details="{ item }">
          <v-textarea
            v-model="item.details"
            label="Details (Optional)"
            variant="outlined"
            density="compact"
            class="mt-3 mb-1"
            auto-grow
            rows="1"
          />
        </template>
        <template #item.title="{ item }">
          <v-text-field
            v-model="item.title"
            label="Group"
            variant="outlined"
            density="compact"
            class="mt-3 mb-1"
            :rules="[required]"
          />
        </template>
        <template #item.remove="{ item }">
          <v-btn
            variant="flat"
            class="mt-n3"
            icon
            @click="removeSlot(item)"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
        <template #no-data>
          <v-alert
            type="warning"
            class="mt-3"
          >
            No chaperones assigned
          </v-alert>
        </template>
      </v-data-table>


      <v-divider />

      <!-- <v-sheet v-if="!isMobile && !isTemplate && isDev && !loadingData" color="primary" class="my-4" rounded
        style="padding: 1px;" elevation="2"> -->
      <v-card
        v-if="!isMobile && !isTemplate"
        elevation="0"
      >
        <v-card-title class="text-h5 mt-4 mb-n4">
          Availability
        </v-card-title>
        <v-row class="mt-n3 mb-4">
          <v-col class="pl-7 pt-7">
            <v-card-title>Available</v-card-title>
            <v-card-text>
              <span
                v-if="event.availableChaperones?.length === 0"
                class="ml-2"
              ><i>None available</i></span>
              <ul class="ml-7">
                <li v-for="chaperone in event.availableChaperones">
                  {{ chaperone }}
                </li>
              </ul>
            </v-card-text>
          </v-col>
          <v-col class="pl-7 pt-7">
            <v-card-title>Not Available</v-card-title>
            <v-card-text>
              <span
                v-if="event.unavailableChaperones?.length === 0"
                class="ml-2"
              ><i>None unavailable</i></span>
              <ul class="ml-7">
                <li v-for="chaperone in event.unavailableChaperones">
                  {{ chaperone }}
                </li>
              </ul>
            </v-card-text>
          </v-col>
          <v-col class="pl-7 pt-7">
            <v-card-title>Not Answered</v-card-title>
            <v-card-text>
              <span
                v-if="event.unansweredChaperones?.length === 0"
                class="ml-2"
              ><i>All chaperones have
                responded</i></span>
              <ul class="ml-7">
                <li v-for="chaperone in event.unansweredChaperones">
                  {{ chaperone }}
                </li>
              </ul>
            </v-card-text>
          </v-col>
        </v-row>
      </v-card>

      <div v-else-if="!isTemplate">
        <v-card>
          <v-card-title>Available</v-card-title>
          <v-card-text>
            <span v-if="event.availableChaperones?.length === 0"><i>None available</i></span>
            <ul class="ml-5">
              <li v-for="chaperone in event.availableChaperones">
                {{ chaperone }}
              </li>
            </ul>
          </v-card-text>
        </v-card>
        <v-card class="mt-2">
          <v-card-title>Not Available</v-card-title>
          <v-card-text>
            <span v-if="event.unavailableChaperones?.length === 0"><i>None unavailable</i></span>
            <ul class="ml-5">
              <li v-for="chaperone in event.unavailableChaperones">
                {{ chaperone }}
              </li>
            </ul>
          </v-card-text>
        </v-card>
        <v-card class="mt-2">
          <v-card-title>Not Answered</v-card-title>
          <v-card-text>
            <span v-if="event.unansweredChaperones?.length === 0"><i>All chaperones have responded</i></span>
            <ul class="ml-5">
              <li v-for="chaperone in event.unansweredChaperones">
                {{ chaperone }}
              </li>
            </ul>
          </v-card-text>
        </v-card>
      </div>

      <v-divider class="my-4" />

      <v-sheet
        v-for="slot in event.slots"
        v-if="isMobile"
        color="primary"
        class="my-4"
        rounded
        style="padding: 1px;"
      >
        <v-card class="pa-2">
          <v-text-field
            v-model="slot.title"
            label="Group"
            variant="outlined"
            density="compact"
            class="mt-3"
            :rules="[required]"
          />
          <v-textarea
            v-model="slot.details"
            label="Details (Optional)"
            variant="outlined"
            density="compact"
            auto-grow
            rows="2"
            class="mt-n2"
          />
          <v-select
            v-if="!isTemplate"
            v-model="slot.selectedChaperoneName"
            clearable
            :items="event.availability"
            item-title="chaperoneName"
            label="Chaperone"
            variant="outlined"
            density="compact"
            auto-select-first
            class="mt-n2"
          >
            <template
              #item="{ props, item }"
              item-value="id"
            >
              <v-list-item
                v-bind="props"
                :disabled="item.raw.available === false"
              >
                <v-list-item-subtitle>
                  <v-chip
                    variant="outlined"
                    width="100px"
                    height="100%"
                    density="compact"
                    size="small"
                    :color="item.raw.available ? 'green' : item.raw.available === false ? 'error' : 'orange'"
                  >
                    {{ item.raw.available ? 'Available' : item.raw.available === false ? 'Unavailable' : 'Not Answered'
                    }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>

          <v-row>
            <span class="mt-4 ml-7">Start</span>
            <v-spacer />
            <time-picker
              :hours="slot.startHours"
              :minutes="slot.startMinutes"
              class="mr-3"
              @update:hours="slot.startHours = $event"
              @update:minutes="slot.startMinutes = $event"
            />
          </v-row>

          <v-row class="mt-n7">
            <span class="mt-4 ml-7">End</span>
            <v-spacer />
            <time-picker
              :hours="slot.endHours"
              :minutes="slot.endMinutes"
              class="mr-3"
              @update:hours="slot.endHours = $event"
              @update:minutes="slot.endMinutes = $event"
            />
          </v-row>

          <v-btn
            variant="outlined"
            width="100%"
            color="primary"
            @click="removeSlot(slot)"
          >
            Remove
            Chaperone
          </v-btn>
        </v-card>
      </v-sheet>

      <div v-if="isMobile">
        <v-btn
          color="primary"
          variant="outlined"
          width="100vw"
          class="mt-6 mr-6"
          @click="newSlot"
        >
          Add
          Chaperone
        </v-btn>

        <v-divider class="my-6" />

        <v-btn
          v-if="!event.isPastEvent"
          color="primary"
          class="mt-2 mr-4"
          variant="outlined"
          width="100vw"
          @click="showConfirmDeleteDialog = true"
        >
          {{ 'Delete ' + (isTemplate ? 'Template' : 'Event') }}
        </v-btn>

        <v-btn
          color="primary"
          class="mt-4"
          :loading="saving"
          width="100vw"
          @click="saveEvent"
        >
          Save
        </v-btn>
      </div>
    </v-card>
  </div>
  <div
    v-else
    class="d-flex justify-center align-center"
    style="height: 70vh;"
  >
    <v-progress-circular
      color="primary"
      indeterminate
      size="40"
    />
  </div>

  <v-dialog
    v-model="showConfirmDeleteDialog"
    :width="isMobile ? '100vw' : '30vw'"
  >
    <v-card @keyup.enter="deleteEvent">
      <v-card-title>Confirm Delete</v-card-title>
      <v-card-text class="mt-3 mb-n2">
        Are you sure you want to delete this {{ isTemplate ? 'template' : 'event'
        }}?
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary"
          variant="text"
          @click="showConfirmDeleteDialog = false"
        >
          Cancel
        </v-btn>
        <v-btn
          :loading="deleting"
          color="primary"
          variant="flat"
          @click="deleteEvent"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>

import { useAppStore } from '@/stores/app';


const store = useAppStore();
const { proxy } = getCurrentInstance();
const EVENTID = computed(() => proxy.$route.params.id);
const isTemplate = computed(() => proxy.$route.path.startsWith('/templates'));
const event = ref({});

const required = value => !!value || 'Field is required.';
const showDateMenu = ref(false)
const showConfirmDeleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)


const tableHeaders = [
  { title: 'Group', key: 'title', width: '20%' },
  { title: 'Chaperone', key: 'chaperone', width: '15%', hideIfTemplate: true },
  { title: 'Details', key: 'details', width: '35%' },
  { title: 'Start', key: 'startTime', width: '12%' },
  { title: 'End', key: 'endTime', width: '12%' },
  { title: 'Remove', key: 'remove', width: '6%' }
].filter(header => !header.hideIfTemplate || !isTemplate.value);

onMounted(async () => {
  loadingData.value = true;
  if (isTemplate.value) {
    await loadTemplate();
  } else {
    await loadEvent();
  }
  loadingData.value = false;
})

onUnmounted(() => {
  store.unlockEvents();
})


const updateEventStartMinutes = (value) => {
  event.value.slots.forEach(slot => {
    if (slot.startMinutes == event.value.startMinutes && slot.startHours == event.value.startHours) {
      slot.startMinutes = value;
    }
  });
  event.value.startMinutes = value;
};

const updateEventStartHours = (value) => {
  event.value.slots.forEach(slot => {
    if (slot.startMinutes == event.value.startMinutes && slot.startHours == event.value.startHours) {
      slot.startHours = value;
    }
  });
  event.value.startHours = value;
};

const updateEventEndMinutes = (value) => {
  event.value.slots.forEach(slot => {
    if (slot.endMinutes == event.value.endMinutes && slot.endHours == event.value.endHours) {
      slot.endMinutes = value;
    }
  });
  event.value.endMinutes = value;
};

const updateEventEndHours = (value) => {
  event.value.slots.forEach(slot => {
    if (slot.endMinutes == event.value.endMinutes && slot.endHours == event.value.endHours) {
      slot.endHours = value;
    }
  });
  event.value.endHours = value;
};

const newSlot = () => {
  if (isTemplate.value) {
    store.newTemplateSlot({
      start: event.value.start,
      end: event.value.end,
      startHours: event.value.startHours,
      startMinutes: event.value.startMinutes,
      endHours: event.value.endHours,
      endMinutes: event.value.endMinutes,
      template_id: event.value.id,
    });
  } else {
    store.newChaperoneSlot({
      start: event.value.start,
      end: event.value.end,
      startHours: event.value.startHours,
      startMinutes: event.value.startMinutes,
      endHours: event.value.endHours,
      endMinutes: event.value.endMinutes,
      event_id: event.value.id,
    });
  }
};

const removeSlot = (slot) => {
  if (isTemplate.value) {
    store.removeTemplateSlot(slot);
  } else {
    store.removeChaperoneSlot(slot);
  }
};

const loadEvent = async () => {
  if (!store.allAvailabilityLoaded || !store.chaperonesLoaded || !store.eventsLoaded || !store.chaperoneSlotsLoaded) {
    await Promise.all([
      store.loadAllAvailability(),
      store.loadChaperones(),
      store.loadEvents(),
      store.loadChaperoneSlots(),
    ]);
  } else {
    store.loadAllAvailability()
  }
  store.lockEvents();
  const tempEvent = store.getEvent(EVENTID.value);

  tempEvent.startHours = String(tempEvent.start.getHours()).padStart(2, '0');
  tempEvent.startMinutes = String(tempEvent.start.getMinutes()).padStart(2, '0');
  tempEvent.endHours = String(tempEvent.end.getHours()).padStart(2, '0');
  tempEvent.endMinutes = String(tempEvent.end.getMinutes()).padStart(2, '0');
  tempEvent.date = tempEvent.start;

  tempEvent.slots.forEach((slot) => {
    slot.startHours = String(slot.start.getHours()).padStart(2, '0');
    slot.startMinutes = String(slot.start.getMinutes()).padStart(2, '0');
    slot.endHours = String(slot.end.getHours()).padStart(2, '0');
    slot.endMinutes = String(slot.end.getMinutes()).padStart(2, '0');
    slot.selectedChaperoneName = slot.chaperoneName;
    slot.selectedChaperoneID = computed(() => store.getChaperoneIDByName(slot.selectedChaperoneName))
  });

  tempEvent.slotsToDelete = [];

  event.value = tempEvent;
}

const loadTemplate = async () => {
  if (!store.templatesLoaded || !store.templateSlotsLoaded) {
    await Promise.all([
      store.loadTemplates(),
      store.loadTemplateSlots(),
    ]);
  }

  const tempTemplate = store.getTemplate(EVENTID.value);
  console.log(tempTemplate);

  tempTemplate.startHours = String(tempTemplate.start.getHours()).padStart(2, '0');
  tempTemplate.startMinutes = String(tempTemplate.start.getMinutes()).padStart(2, '0');
  tempTemplate.endHours = String(tempTemplate.end.getHours()).padStart(2, '0');
  tempTemplate.endMinutes = String(tempTemplate.end.getMinutes()).padStart(2, '0');
  tempTemplate.date = tempTemplate.start;

  tempTemplate.slots.forEach((slot) => {
    slot.startHours = String(slot.start.getHours()).padStart(2, '0');
    slot.startMinutes = String(slot.start.getMinutes()).padStart(2, '0');
    slot.endHours = String(slot.end.getHours()).padStart(2, '0');
    slot.endMinutes = String(slot.end.getMinutes()).padStart(2, '0');
    slot.selectedChaperoneName = slot.chaperoneName;
    slot.selectedChaperoneID = computed(() => store.getChaperoneIDByName(slot.selectedChaperoneName))
  });

  tempTemplate.slotsToDelete = [];

  event.value = tempTemplate;
}

const saveEvent = async () => {
  saving.value = true;
  if (isTemplate.value) { // If is template
    if (!event.value.template_name || !event.value.title || !event.value.location) {
      store.showAlert('Missing Fields', 'Please fill in all required fields.')
      saving.value = false;
      return;
    }

    const start = new Date(event.value.start);
    start.setHours(event.value.startHours, event.value.startMinutes, 0, 0);

    const end = new Date(event.value.start);
    end.setHours(event.value.endHours, event.value.endMinutes, 0, 0);

    event.value.start = start;
    event.value.end = end;

    if (event.value.start >= event.value.end) {
      store.showAlert('Invalid Time', 'Event end time must be after start time.')
      saving.value = false;
      return;
    }

    event.value.slots.forEach((slot) => {
      const start = new Date(event.value.start);
      start.setHours(slot.startHours, slot.startMinutes, 0, 0);

      const end = new Date(event.value.start);
      end.setHours(slot.endHours, slot.endMinutes, 0, 0);

      slot.start = start;
      slot.end = end;

      if (slot.start >= slot.end) {
        store.showAlert('Invalid Time', 'Chaperone end time must be after start time.')
        saving.value = false;
        return;
      }

      if (slot.end > event.value.end || slot.start < event.value.start) {
        store.showAlert('Invalid Time', 'Chaperone times must be within event times.')
        saving.value = false;
        return;
      }
    });

    await store.saveTemplate(EVENTID.value);

  } else { // If is event

    if (event.isPastEvent) {
      store.showAlert('Past Event', 'Cannot edit past events.')
      return;
    }

    if (!event.value.title || !event.value.location || !event.value.date) {
      store.showAlert('Missing Fields', 'Please fill in all required fields.')
      saving.value = false;
      return;
    }

    const start = new Date(event.value.date);
    start.setHours(event.value.startHours, event.value.startMinutes, 0, 0);

    const end = new Date(event.value.date);
    end.setHours(event.value.endHours, event.value.endMinutes, 0, 0);

    event.value.start = start;
    event.value.end = end;

    if (event.value.start >= event.value.end) {
      store.showAlert('Invalid Time', 'Event end time must be after start time.')
      saving.value = false;
      return;
    }

    event.value.slots.forEach((slot) => {
      const start = new Date(event.value.date);
      start.setHours(slot.startHours, slot.startMinutes, 0, 0);

      const end = new Date(event.value.date);
      end.setHours(slot.endHours, slot.endMinutes, 0, 0);

      slot.start = start;
      slot.end = end;

      slot.chaperone = slot.selectedChaperoneID;

      if (slot.start >= slot.end) {
        store.showAlert('Invalid Time', 'Chaperone end time must be after start time.')
        saving.value = false;
        return;
      }

      if (slot.end > event.value.end || slot.start < event.value.start) {
        store.showAlert('Invalid Time', 'Chaperone times must be within event times.')
        saving.value = false;
        return;
      }
    });

    if (await store.saveEvent(EVENTID.value)) {
      proxy.$router.push(`/event/${EVENTID.value}`);
    }

  }
  saving.value = false;
}

const deleteEvent = async () => {
  deleting.value = true;
  if (isTemplate.value) { // If is template
    if (EVENTID.value == '2' || EVENTID.value == '3') {
      store.showAlert("Error", "Cannot delete default templates.");
      return;
    }

    await store.deleteTemplate(EVENTID.value);
    deleting.value = false;
    showConfirmDeleteDialog.value = false;
    proxy.$router.push('/templates')

  } else { // If is event
    if (event.value.isPastEvent) {
      store.showAlert("Past Event", "Cannot delete past events.")
      return;
    }
    await store.deleteEvent(EVENTID.value);
    deleting.value = false;
    showConfirmDeleteDialog.value = false;
    proxy.$router.push('/')
  }
}


</script>
