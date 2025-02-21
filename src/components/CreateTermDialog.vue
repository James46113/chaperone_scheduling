<template>
  <v-dialog v-model="store.showCreateTermDialog">

    <v-card class="pa-2" elevation="0">
      <v-card-title class="text-h5 mb-3">Create Term</v-card-title>

      <v-card-subtitle>Term Start</v-card-subtitle>

      <v-text-field type="text" readonly variant="outlined" class="px-3" max-width="300" prepend-icon="mdi-calendar"
        @click="showStartMenu = true">
        {{ start.toLocaleDateString() }}

        <v-menu activator="parent" :close-on-content-click="false" v-model="showStartMenu">
          <v-confirm-edit v-model="start">
            <template v-slot:default="{ model: proxyModel, actions, save, cancel, isPristine }">
              <v-date-picker v-model="proxyModel.value" :max="end">
                <template v-slot:actions>
                  <!-- <component :is="actions"></component> -->
                  <v-btn text @click="() => { cancel(); showStartMenu = false; }">Cancel</v-btn>
                  <v-btn text color="primary" @click="() => { save(); showStartMenu = false; }">Ok</v-btn>
                </template>
              </v-date-picker>
            </template>
          </v-confirm-edit>
        </v-menu>

      </v-text-field>


      <v-card-subtitle>Term End</v-card-subtitle>
      <v-text-field type="text" readonly variant="outlined" class="px-3" max-width="300" prepend-icon="mdi-calendar"
        @click="showEndMenu = true">
        {{ end.toLocaleDateString() }}
        <v-menu activator="parent" :close-on-content-click="false" v-model="showEndMenu">
          <v-confirm-edit v-model="end">
            <template v-slot:default="{ model: proxyModel, actions, save, cancel, isPristine }">
              <v-date-picker v-model="proxyModel.value" :min="start">
                <template v-slot:actions>
                  <!-- <component :is="actions"></component> -->
                  <v-btn text @click="() => { cancel(); showEndMenu = false; }">Cancel</v-btn>
                  <v-btn text color="primary" @click="() => { save(); showEndMenu = false; }">Ok</v-btn>
                </template>
              </v-date-picker>
            </template>
          </v-confirm-edit>
        </v-menu>
      </v-text-field>

      <v-card-actions>
        <v-btn text @click="store.showCreateTermDialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="createTerm">Create</v-btn>
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

onMounted(() => {
  if (isSignedIn.value) {

    fetchAPI('templates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        templates.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      })


    fetchAPI(`template_chaperone_slots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        templateChaperoneSlots.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }
})



const createTerm = () => {
  if (!start.value || !end.value) {
    return;
  }
  store.showCreateTermDialog.value = false;

  let currentDate = new Date(start.value);
  let day = currentDate.getDay();
  let diff = currentDate.getDate() - day + 1//(day === 0 ? -6 : 1); // adjust when day is sunday
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
  diff = currentDate.getDate() - day + 5//(day === 0 ? -6 : 1); // adjust when day is sunday

  currentDate.setDate(diff);
  if (currentDate < start.value) {
    currentDate.setDate(currentDate.getDate() + 7);
  }

  while (currentDate <= end.value) {
    createFridayRehearsal(currentDate);
    currentDate.setDate(currentDate.getDate() + 7);
  }
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
  const rehearsal = templates.value.find(template => template.id === template_id);
  // const rehearsal = {
  //   ...template,
  //   start: new Date(date.setHours(new Date(template.start).getHours(), new Date(template.start).getMinutes())).toISOString(),
  //   end: new Date(date.setHours(new Date(template.end).getHours(), new Date(template.end).getMinutes())).toISOString()
  // };
  const startDate = new Date(date);
  startDate.setHours(new Date(rehearsal.start).getHours(), new Date(rehearsal.start).getMinutes(), 0, 0);
  rehearsal.start = startDate.toISOString();

  const endDate = new Date(date);
  endDate.setHours(new Date(rehearsal.end).getHours(), new Date(rehearsal.end).getMinutes(), 0, 0);
  rehearsal.end = endDate.toISOString();

  let chaperoneSlots = templateChaperoneSlots.value.filter(slot => slot.template_id === template_id);
  console.log(JSON.stringify(rehearsal));


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
    return response.json()
  })
    .then((data) => {
      rehearsal.id = data.id;
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
        })
      });
    });
}

</script>