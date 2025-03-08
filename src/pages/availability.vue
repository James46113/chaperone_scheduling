<template>
  <!-- <table>
    <tr>
      <th v-for="event in events">{{ event.start.toLocaleDateString('en-GB') }}</th>
    </tr>
  </table> -->
  <app-header />
  <div class="pa-4 d-flex justify-center">
    <v-card elevation="0" :width="isMobile ? '100vw' : '80vw'">
      <v-card-title class="text-h5 mb-3">Chaperone Availability</v-card-title>

      <v-row class="mt-6" v-if="!isMobile">
        <v-card-text class="mr-n9">From</v-card-text>

        <v-text-field type="text" readonly variant="outlined" class="px-3" max-width="300" prepend-icon="mdi-calendar"
          @click="showStartMenu = true">
          {{ start.toLocaleDateString('en-GB') }}

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

        <v-card-text class="mr-n9">To</v-card-text>

        <v-text-field type="text" readonly variant="outlined" class="px-3" max-width="300" prepend-icon="mdi-calendar"
          @click="showEndMenu = true">
          {{ end.toLocaleDateString('en-GB') }}
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

        <v-spacer />

        <v-btn v-if="showTable" color="primary" :loading="sendingEmails" @click="sendAvailabilityEmail" class="mr-4"
          variant="flat">Send
          Availability Email</v-btn>
        <v-btn v-if="showTable" color="primary" @click="saveTableAsImage" class="mr-4" variant="flat">Save as
          Image</v-btn>
        <v-btn v-if="showTable && isDev" color="primary" @click="printTable" class="mr-4" variant="flat">Print</v-btn>
      </v-row>

      <v-div v-else>
        <v-text-field type="text" readonly variant="outlined" class="px-3" max-width="300" prepend-icon="mdi-calendar"
          @click="showStartMenu = true">
          {{ start.toLocaleDateString('en-GB') }}

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
        <v-card-text class="mt-n4" width="100%" style="text-align: center;">To</v-card-text>
        <v-text-field type="text" readonly variant="outlined" class="px-3" max-width="300" prepend-icon="mdi-calendar"
          @click="showEndMenu = true">
          {{ end.toLocaleDateString('en-GB') }}
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
      </v-div>

      <div v-if="loadingData" class="d-flex justify-center align-center" style="height: 40vh;">
        <v-progress-circular color="primary" indeterminate size="40" />
      </div>
      <v-sheet v-else-if="showTable" class="table_container">
        <div style="max-width: 100vw; overflow: scroll;" class="justify-center">
          <table class="my-6">
            <tr>
              <th></th>
              <th v-for="event in eventsInRange">
                <div class="vertical-text rotate">
                  {{ event.start.toLocaleDateString('en-GB') }}
                </div>
              </th>
            </tr>

            <tr v-for="chaperone in store.chaperones">
              <td>{{ chaperone.name }}</td>
              <td v-for="event in eventsInRange">
                <span
                  v-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available">
                  <v-icon>mdi-check</v-icon>
                </span>
                <span
                  v-else-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available === null">
                  <pre> ?</pre>
                </span>
              </td>
            </tr>
            <tr style="font-size: xx-small;">
              <td colspan="100%">
                Generated on {{ new Date().toLocaleDateString('en-GB') }} - Steel City Choristers
              </td>
            </tr>
          </table>
        </div>
        <!-- <v-btn v-if="isMobile" class="mt-3" width="100vw" color="primary" @click="saveTableAsImage" variant="flat">Save
          as
          Image</v-btn> -->
      </v-sheet>
      <v-card-text v-else>No events found in the selected range</v-card-text>
      <v-btn v-if="isMobile" :loading="sendingEmails" class="mt-4" width="100vw" color="primary"
        @click="sendAvailabilityEmail" variant="flat">Send
        Availability Email</v-btn>
    </v-card>
  </div>
</template>

<script setup>
import domtoimage from 'dom-to-image';
import { useAppStore } from '@/stores/app';

const store = useAppStore();
const eventsInRange = computed(() => store.events.filter(event => event.start >= start.value && event.end <= end.value))
const showTable = computed(() => eventsInRange.value.length > 0)

const sendingEmails = ref(false)

const start = ref(new Date())
const end = ref(new Date())
end.value = new Date(start.value.getFullYear(), start.value.getMonth() + 2, 0)

const showStartMenu = ref(false)
const showEndMenu = ref(false)

onMounted(async () => {
  loadingData.value = true

  if (!store.allAvailabilityLoaded || !store.eventsLoaded || !store.chaperonesLoaded) {
    await Promise.all([
      store.loadChaperones(),
      store.loadEvents(),
      store.loadAllAvailability()
    ])
  } else {
    store.loadChaperones()
    store.loadEvents()
    store.loadAllAvailability()
  }

  loadingData.value = false
})

const sendAvailabilityEmail = () => {
  sendingEmails.value = true
  fetchAPI('availability/mail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (response.ok) {
        store.showAlert("Email Sent", "Availability email sent successfully")
      } else {
        store.showAlert("Error", "An error occurred while sending the availability email")
      }
      sendingEmails.value = false
    })
    .catch((error) => {
      console.error('Error:', error)
    });
}

const printTable = () => {
  const tableElement = document.querySelector('.table_container');
  domtoimage.toPng(tableElement, {
    filter: (element) => element.className !== 'v-btn',
    quality: 1
  })
    .then((dataUrl) => {
      const pwin = window.open();
      pwin.document.write(`<img src='${dataUrl}' />`)
      pwin.focus()
      pwin.print()
    });
}

const saveTableAsImage = () => {
  const tableElement = document.querySelector('.table_container');

  domtoimage.toPng(tableElement, { filter: (element) => element.className !== 'v-btn' })
    .then((dataUrl) => {
      const link = document.createElement('a');
      link.download = `availability-${start.value.toLocaleDateString('en-GB')}-${end.value.toLocaleDateString('en-GB')}.png`;
      link.href = dataUrl;
      link.click();
    })
    .catch(function (error) {
      console.error('Error:', error)
    });
}

</script>

<style scoped>
table,
th,
td {
  border: 1px solid black;
  border-collapse: collapse;
}

th,
td {
  padding: 8px;
  text-align: left;
}

.vertical-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  text-align: start;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>