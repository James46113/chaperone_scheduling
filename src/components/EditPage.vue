<template>
  <app-header />
  <div
    v-if="!loadingData && !notFound"
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
            :readonly="isDefaultTemplate"
          />

          <v-select
            v-if="!isTemplate && isNewEvent && isMobile"
            v-model="selectedTemplate"
            :items="store.templateNames"
            item-title="template_name"
            variant="outlined"
            placeholder="Load Template"
            width="100%"
            @update:model-value="loadTemplate"
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
            <v-select
              v-if="!isTemplate && isNewEvent"
              v-model="selectedTemplate"
              :items="store.templateNames"
              item-title="template_name"
              variant="outlined"
              class="mx-6"
              placeholder="Load Template"
              @update:model-value="loadTemplate"
            />

            <v-btn
              v-if="!event.isPastEvent && !isNewEvent && !(isTemplate && isDefaultTemplate)"
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
              @click="startSaveEvent"
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
          <date-picker
            label="Date"
            :date="event.date?.toISOString().split('T')[0]"
            total-width="240px"
            @update:date="event.date = new Date($event)"
          />
        </v-col>
        <v-col>
          <!-- <v-row class="my-2"> -->
          <!-- <span class="ml-4 mt-5 mr-3">Start</span> -->
          <time-picker
            label="Start"
            :hours="event.startHours"
            :minutes="event.startMinutes"
            @update:hours="updateEventStartHours"
            @update:minutes="updateEventStartMinutes"
          />
          <!-- </v-row> -->
        </v-col>
        <v-col>
          <!-- <v-row class="my-2"> -->
          <!-- <span class="ml-4 mt-5 mr-5">End</span> -->
          <time-picker
            label="End"
            :hours="event.endHours"
            :minutes="event.endMinutes"
            @update:hours="updateEventEndHours"
            @update:minutes="updateEventEndMinutes"
          />
          <!-- </v-row> -->
        </v-col>
        <v-col />
      </v-row>

      <div v-else>
        <!-- <v-text-field type="text" readonly variant="outlined" class="mt-3" max-width="300" prepend-icon="mdi-calendar"
          @click="showDateMenu = true" v-if="!isTemplate">
          {{ event.date?.toLocaleDateString('en-GB') }}
          <v-menu activator="parent" :close-on-content-click="false" v-model="showDateMenu">
            <v-confirm-edit v-model="event.date">
              <template v-slot:default="{ model: proxyModel, actions, save, cancel, isPristine }">
                <v-date-picker v-model="proxyModel.value">
                  <template v-slot:actions>
                    <v-btn text @click="() => { cancel(); showDateMenu = false; }">Cancel</v-btn>
                    <v-btn text color="primary" @click="() => { save(); showDateMenu = false; }">Ok</v-btn>
                  </template>
                </v-date-picker>
              </template>
            </v-confirm-edit>
          </v-menu>
        </v-text-field>
 -->
        <v-row class="px-3">
          <span class="ml-4 mt-3 mr-3">
            Date
          </span>
          <v-spacer />
          <date-picker
            :date="event.date?.toISOString().split('T')[0]"
            @update:date="event.date = new Date($event)"
          />
        </v-row>
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
      
      <v-checkbox
        v-model="event.juniors_present"
        label="Juniors Present"
        color="primary"
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
            class="mt-3"
            :hours="item.startHours"
            :minutes="item.startMinutes"
            @update:hours="item.startHours = $event"
            @update:minutes="item.startMinutes = $event"
          />
        </template>
        <template #item.endTime="{ item }">
          <time-picker
            class="mt-3"
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
        v-if="!isMobile && !isTemplate && !isNewEvent"
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

      <div v-else-if="!isTemplate && !isNewEvent">
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

      <v-card-text
        v-if="event.slots?.length === 0 && isMobile"
        class="mt-4"
      >
        <i>No chaperones assigned</i>
      </v-card-text>

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

          <v-row class="mt-n5">
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
          v-if="!event.isPastEvent && !isNewEvent && !(isTemplate && isDefaultTemplate)"
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
          @click="startSaveEvent"
        >
          Save
        </v-btn>
      </div>
    </v-card>
  </div>
  <div
    v-else-if="notFound"
    class="d-flex justify-center mt-10"
  >
    <v-card
      class="ma-4 pa-4"
      :width="isMobile ? '100vw' : '40vw'"
    >
      <v-img
        src="/Steel-City-Choristers.png"
        width="15vw"
      />
      <v-card-title>{{ isTemplate ? 'Template' : 'Event' }} Not Found</v-card-title>
      <v-card-text>
        The {{ isTemplate ? 'template' : 'event' }} you are looking for does not exist. It may have been deleted. Please
        check the URL and try again.
      </v-card-text>

      <div class="d-flex justify-center">
        <v-btn
          v-if="!isTemplate"
          variant="flat"
          width="20%"
          color="primary"
          @click="proxy.$router.push('/')"
        >
          Events
        </v-btn>
        <v-btn
          v-else
          variant="flat"
          width="20%"
          color="primary"
          @click="proxy.$router.push('/templates')"
        >
          Templates
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
    <v-card @keyup.enter="startDeleteEvent">
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
          @click="startDeleteEvent"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useAppStore } from '@/stores/app'


const definedProps = defineProps({
  isTemplate: Boolean,
  isNewEvent: Boolean,
  event: Object,
  deleteEvent: Function,
  saveEvent: Function,
  newSlot: Function,
  removeSlot: Function,
  notFound: Boolean,
})

const props = toRefs(definedProps)
const store = useAppStore();
const event = reactive(props.event)

const showConfirmDeleteDialog = ref(false)
const showDateMenu = ref(false)
const saving = ref(false)
const deleting = ref(false)
const required = value => !!value || 'Field is required.';
const isDefaultTemplate = computed(() => [2, 3].includes(event.value.id));

const { proxy } = getCurrentInstance();

const selectedTemplate = ref();

const tableHeaders = [
  { title: 'Group', key: 'title', width: '20%' },
  { title: 'Chaperone', key: 'chaperone', width: '15%', hideIfTemplate: true, hideIfNew: true },
  { title: 'Details', key: 'details', width: '35%' },
  { title: 'Start', key: 'startTime', width: '12%' },
  { title: 'End', key: 'endTime', width: '12%' },
  { title: 'Remove', key: 'remove', width: '6%' }
].filter(header => !(header.hideIfTemplate && props.isTemplate.value) && !(header.hideIfNew && props.isNewEvent.value));


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

const startSaveEvent = async () => {
  saving.value = true;
  await definedProps.saveEvent();
  saving.value = false;
};

const startDeleteEvent = async () => {
  deleting.value = true;
  await definedProps.deleteEvent();
  deleting.value = false;
  showConfirmDeleteDialog.value = false;
};

const loadTemplate = () => {
  const template = store.templates.find(template => template.template_name === selectedTemplate.value);

  event.value.start = new Date(template.start);
  event.value.end = new Date(template.end);
  event.value.startHours = String(template.start.getHours()).padStart(2, '0');
  event.value.startMinutes = String(template.start.getMinutes()).padStart(2, '0');
  event.value.endHours = String(template.end.getHours()).padStart(2, '0');
  event.value.endMinutes = String(template.end.getMinutes()).padStart(2, '0');
  event.value.title = template.title;
  event.value.location = template.location;
  event.value.details = template.details;
  event.value.juniors_present = template.juniors_present


  const tempChaperoneSlots = store.templateSlots.filter(slot => slot.template_id === template.id);
  tempChaperoneSlots.forEach(slot => {
    slot.start = new Date(slot.start);
    slot.end = new Date(slot.end);
    slot.startHours = String(slot.start.getHours()).padStart(2, '0');
    slot.startMinutes = String(slot.start.getMinutes()).padStart(2, '0');
    slot.endHours = String(slot.end.getHours()).padStart(2, '0');
    slot.endMinutes = String(slot.end.getMinutes()).padStart(2, '0');
    slot.id = undefined;
  });
  event.value.slots = tempChaperoneSlots
  selectedTemplate.value = 'Load Template';
}

</script>