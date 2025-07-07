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

      <v-row class="mt-6 pl-5" v-if="!isMobile">

        <date-picker label="Start" totalWidth="240px" :date="start.toISOString().split('T')[0]"
          @update:date="start = new Date($event)"></date-picker>

        <date-picker label="End" totalWidth="240px" :date="end.toISOString().split('T')[0]"
          @update:date="end = new Date($event)" class="ml-6"></date-picker>

        <v-spacer />

        <v-btn :disabled="offline" v-if="showTable" color="primary" :loading="sendingEmails" @click="sendAvailabilityEmail" class="mr-4"
          variant="flat">Send
          Availability Email</v-btn>
        <v-btn v-if="showTable" color="primary" @click="saveTableAsImage" class="mr-4" variant="flat">Save as
          Image</v-btn>
        <v-btn v-if="showTable && isDev" color="primary" @click="printTable" class="mr-4" variant="flat">Print</v-btn>
      </v-row>

      <v-div v-else>
        <date-picker label="Start" totalWidth="240px" :date="start.toISOString().split('T')[0]"
          @update:date="start = new Date($event)" class="ml-6"></date-picker>

        <date-picker label="End" totalWidth="240px" :date="end.toISOString().split('T')[0]"
          @update:date="end = new Date($event)" class="ml-6"></date-picker>
      </v-div>

      <div v-if="loadingData" class="d-flex justify-center align-center" style="height: 40vh;">
        <v-progress-circular color="primary" indeterminate size="40" />
      </div>
      <v-sheet v-else-if="showTable" class="table_container">
        <div style="max-width: 100vw; overflow: scroll;" class="justify-center">
          <table class="my-6">
            <tr>
              <th></th><th></th>
              <th v-for="event in gigs" class="pa-1">
                <span class="vertical-text rotate gig-location">
                  {{ event.location }}
                </span>
              </th>
              <th class="divider"></th>
              <th :colspan="rehearsalMonday.length">Monday Rehearsals</th>              
              <th class="divider"></th>
              <th :colspan="rehearsalFriday.length">Friday Rehearsals</th>
            </tr>
            <tr>
              <th></th><th></th>
              <th v-for="event in gigs" class="pa-1">
                <span class="vertical-text rotate">
                  {{ event.start.toLocaleDateString('en-GB') }}
                </span>
              </th>
              <th class="divider"></th>
              <th v-for="mon in rehearsalMonday">
                <span class="vertical-text rotate">
                  {{ mon.start.toLocaleDateString('en-GB') }}
                </span> 
              </th>
              <th class="divider"></th>
              <th v-for="fri in rehearsalFriday">
                <span class="vertical-text rotate">
                  {{ fri.start.toLocaleDateString('en-GB') }}
                </span> 
              </th>
            </tr>
            <tr>
              <td colspan="2"><b>Juniors Present</b></td>
              <td v-for="gig in gigs">
                <b><pre v-if="gig.juniors_present"> J</pre></b>
              </td>
              <td class="divider"></td>
              <td v-for="mon in rehearsalMonday">
                <b><pre v-if="mon.juniors_present"> J</pre></b>
              </td>
              <td class="divider"></td>
              <td v-for="fri in rehearsalFriday">
                <b><pre v-if="fri.juniors_present"> J</pre></b>
              </td>
            </tr>
            <tr>
              <td class="divider" v-for="i in eventsInRange.length + 4"></td>
            </tr>
            <tr v-for="chaperone in nonSingingChaperones">
              <td v-if="chaperone === nonSingingChaperones[0]">
                <i>Non-Singing</i>
              </td>
              <td v-else></td>
              <td>{{ chaperone.name }}</td>
              <td v-for="event in gigs">
                <span
                  v-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available"
                  style="text-align: center;">
                  <!-- <v-icon>mdi-check</v-icon> -->
                  <pre>Y</pre>
                </span>
                <span
                  v-else-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available === null"
                  style="text-align: center;">
                  <pre>?</pre>
                </span>
              </td>
              <td class="divider"></td>
              <td v-for="event in rehearsalMonday">
                <span
                  v-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available"
                  style="text-align: center;">
                  <!-- <v-icon>mdi-check</v-icon> -->
                  <pre>Y</pre>
                </span>
                <span
                  v-else-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available === null"
                  style="text-align: center;">
                  <pre>?</pre>
                </span>
              </td>
              <td class="divider"></td>
              <td v-for="event in rehearsalFriday">
                <span
                  v-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available"
                  style="text-align: center;">
                  <!-- <v-icon>mdi-check</v-icon> -->
                  <pre>Y</pre>
                </span>
                <span
                  v-else-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available === null"
                  style="text-align: center;">
                  <pre>?</pre>
                </span>
              </td>
            </tr>
            <tr>
              <td class="divider" v-for="i in eventsInRange.length + 4"></td>
            </tr>
            <tr v-for="chaperone in singingChaperones">
              <td v-if="chaperone === singingChaperones[0]">
                <i>Singing</i>
              </td>
              <td v-else></td>
              <td>{{ chaperone.name }}</td>
              <td v-for="event in gigs">
                <span
                  v-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available"
                  style="text-align: center;">
                  <!-- <v-icon>mdi-check</v-icon> -->
                  <pre>Y</pre>
                </span>
                <span
                  v-else-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available === null"
                  style="text-align: center;">
                  <pre>?</pre>
                </span>
              </td>
              <td class="divider"></td>
              <td v-for="event in rehearsalMonday">
                <span
                  v-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available"
                  style="text-align: center;">
                  <!-- <v-icon>mdi-check</v-icon> -->
                  <pre>Y</pre>
                </span>
                <span
                  v-else-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available === null"
                  style="text-align: center;">
                  <pre>?</pre>
                </span>
              </td>
              <td class="divider"></td>
              <td v-for="event in rehearsalFriday">
                <span
                  v-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available"
                  style="text-align: center;">
                  <!-- <v-icon>mdi-check</v-icon> -->
                  <pre>Y</pre>
                </span>
                <span
                  v-else-if="store.allAvailability.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available === null"
                  style="text-align: center;">
                  <pre>?</pre>
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
      <v-btn :disabled="offline" v-if="isMobile" :loading="sendingEmails" class="mt-4" width="100vw" color="primary"
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
const rehearsalMonday = computed(() =>
  eventsInRange.value.filter(
    event =>
      event.title === "Rehearsal" &&
      event.start.getDay() === 1 // 1 = Monday
  )
)
const rehearsalFriday = computed(() => 
  eventsInRange.value.filter(
    event => 
      event.title === "Rehearsal" &&
      event.start.getDay() === 5 // 5 = Friday
  )
)
const gigs = computed(() => 
  eventsInRange.value.filter(
    event => 
      event.title !== "Rehearsal"
  )
)

const singingChaperones = computed(() => {
  const orderedNames = ['Jeremy', 'Kate', 'Chris'];
  const chaps = store.chaperones.filter(
    chaperone => chaperone.is_singing_chaperone
  );
  return [
    ...orderedNames
      .map(name =>
        chaps.find(
          c => c.name && c.name.includes(name)
        )
      )
      .filter(Boolean),
    ...chaps.filter(
      c =>
        !orderedNames.some(name =>
          c.name && c.name.includes(name)
        )
    ),
  ];
});

const nonSingingChaperones = computed(() => store.chaperones.filter(
  chapeorne => 
    !chapeorne.is_singing_chaperone
))

const showTable = computed(() => eventsInRange.value.length > 0 && start.value < end.value)

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
  justify-content: flex-end;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
th {
  vertical-align: bottom;
}

.gig-location{
  font-size: small;
}

.divider {
  background-color: gray;
  border: 0px;
}
</style>