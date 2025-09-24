<template>
  <v-dialog
    v-model="store.showCreateTermDialog"
    :width="isMobile ? '100vw' : '27vw'"
  >
    <v-card
      class="pa-2 pl-8"
      elevation="0"
    >
      <v-card-title class="text-h5 mb-3 ml-n3">
        Create Term
      </v-card-title>

      <div class="ml-7">
        <date-picker
          label="Term Start"
          total-width="17vw"
          :date="start.toISOString().split('T')[0]"
          class="mt-4"
          @update:date="start = new Date($event)"
        />

        <date-picker
          label="Term End"
          total-width="17vw"
          :date="end.toISOString().split('T')[0]"
          class="my-4"
          @update:date="end = new Date($event)"
        />
      </div>

      <v-card-text
        v-if="start > end"
        class="text-primary"
      >
        Term start date must be after the term end
        date.
      </v-card-text>

      <v-card-actions>
        <v-btn
          text
          @click="store.showCreateTermDialog = false"
        >
          Cancel
        </v-btn>
        <v-btn
          :disabled="start > end"
          color="primary"
          variant="flat"
          @click="createTerm"
        >
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { onMounted } from 'vue';

const start = ref(new Date())
const end = ref(new Date(new Date().setMonth(new Date().getMonth() + 1)))
const templates = ref()
const templateChaperoneSlots = ref()

const showStartMenu = ref(false)
const showEndMenu = ref(false)

const store = useAppStore();

defineProps({
  close: Function,
})


const createTerm = () => {
  if (!start.value || !end.value) {
    return;
  }
  store.showCreateTermDialog = false;

  let currentDate = new Date(start.value);
  let day = currentDate.getDay();
  let diff = currentDate.getDate() - (day === 0 ? 6 : day - 1); // For Monday
  currentDate.setDate(diff);
  if (currentDate < start.value) {
    currentDate.setDate(currentDate.getDate() + 7);
  }

  while (currentDate <= end.value) {
    createMondayRehearsal(currentDate);
    currentDate.setDate(currentDate.getDate() + 7);
  }

  currentDate = new Date(start.value);
  day = currentDate.getDay();
  diff = currentDate.getDate() - (day === 0 ? 2 : day - 5); // For Friday

  currentDate.setDate(diff);
  if (currentDate < start.value) {
    currentDate.setDate(currentDate.getDate() + 7);
  }

  while (currentDate <= end.value) {
    createFridayRehearsal(currentDate);
    currentDate.setDate(currentDate.getDate() + 7);
  }
  store.loadEvents();
}

const createMondayRehearsal = (date) => {
  console.log('Creating rehearsal for', date);
  const template_id = 2;
  createRehearsal(template_id, date);
}

const createFridayRehearsal = (date) => {
  console.log('Creating rehearsal for', date);
  const template_id = 3;
  createRehearsal(template_id, date);
}

const createRehearsal = (template_id, date) => {
  // Create a new copy of the rehearsal object to avoid modifying the original
  const template = store.templates.find(template => template.id === template_id);
  const rehearsal = { ...template };

  // Set the start and end times for the rehearsal
  const startDate = new Date(date);
  startDate.setHours(new Date(template.start).getHours(), new Date(template.start).getMinutes(), 0, 0);
  rehearsal.start = startDate.toISOString();

  const endDate = new Date(date);
  endDate.setHours(new Date(template.end).getHours(), new Date(template.end).getMinutes(), 0, 0);
  rehearsal.end = endDate.toISOString();

  const chaperoneSlots = store.templateSlots.filter(slot => slot.template_id === template_id);
  console.log(JSON.stringify(rehearsal));

  // Save the rehearsal
  fetchAPI("events", {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rehearsal),
  }).then((response) => {
    if (!response.ok) {
      store.showAlert("Error", "Failed to save event.");
      saving.value = false;
      return;
    }
    return response.json();
  })
    .then((data) => {
      rehearsal.id = data.id;

      // Save chaperone slots for the event
      chaperoneSlots.forEach(slot => {
        fetchAPI("chaperone_slots", {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...slot,
            event_id: rehearsal.id,
            start: new Date(slot.start).toISOString(),
            end: new Date(slot.end).toISOString(),
            chaperone: null,
          }),
        });
      });
    });
};

</script>