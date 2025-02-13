<template>
  <!-- <table>
    <tr>
      <th v-for="event in events">{{ event.start.toLocaleDateString() }}</th>
    </tr>
  </table> -->
  <app-header />
  <div class="pa-4 d-flex justify-center">
    <v-card elevation="0" width="80vw">
      <v-card-title class="text-h5">Chaperone Availability</v-card-title>
      <v-row class="mt-6" v-if="!isMobile">
        <v-date-input variant="outlined" label="Start" class="px-3" max-width="300" v-model="start" :max="end" />
        <v-date-input variant="outlined" label="End" class="px-3" max-width="300" v-model="end" :min="start" />
        <v-spacer />
        <v-btn v-if="showTable" color="primary" @click="saveTableAsImage" class="mr-4" variant="flat">Save as
          Image</v-btn>
      </v-row>
      <v-div v-else>
        <v-date-input variant="outlined" label="Start" class="px-3" max-width="300" v-model="start" :max="end" />
        <v-date-input variant="outlined" label="End" class="px-3" max-width="300" v-model="end" :min="start" />
      </v-div>

      <v-card-text v-if="loadingData">Loading...</v-card-text>
      <div v-else-if="showTable" class="table_container pa-4" style="display: inline-block;">
        <table class="ma-7">
          <tr>
            <th></th>
            <th v-for="event in eventsInRange">
              <div class="vertical-text rotate">
                {{ event.start.toLocaleDateString() }}
              </div>
            </th>
          </tr>

          <tr v-for="chaperone in chaperones">
            <td>{{ chaperone.name }}</td>
            <td v-for="event in eventsInRange">
              <span
                v-if="availabilities.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available">
                <v-icon>mdi-check</v-icon>
              </span>
              <span
                v-else-if="availabilities.find(availability => availability.chaperone_id === chaperone.id && availability.event_id === event.id)?.available === null">
                <pre> ?</pre>
              </span>
            </td>
          </tr>
        </table>
        <v-btn v-if="isMobile" width="80vw" color="primary" @click="saveTableAsImage" class="mr-4 save-button"
          variant="flat">Save as Image</v-btn>
      </div>
      <v-card-text v-else>No events found in the selected range</v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { VDateInput } from 'vuetify/labs/VDateInput'
import html2canvas from 'html2canvas';


const chaperones = ref([])
const events = ref([])
const eventsInRange = computed(() => events.value.filter(event => event.start >= start.value && event.end <= end.value))
const availabilities = ref([])
const showTable = computed(() => eventsInRange.value.length > 0)

const start = ref(new Date())
const end = ref(new Date())
end.value.setMonth(start.value.getMonth() + 1)

onMounted(async () => {
  loadingData.value = true

  await Promise.all([

    fetchAPI('chaperones', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        data.sort((a, b) => a.name.localeCompare(b.name));
        chaperones.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      }),

    fetchAPI('events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        data = data.map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }))
        data.sort((a, b) => a.start - b.start);
        events.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      }),

    fetchAPI('chaperones/availability', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        availabilities.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  ])
  loadingData.value = false
})

const saveTableAsImage = () => {
  try {
    const tableElement = document.querySelector('.table_container');

    const footerText = document.createElement('div');
    footerText.style.textAlign = 'center';
    footerText.style.marginTop = '20px';
    footerText.innerHTML = `<i style="font-size: small;">Generated on ${new Date().toLocaleDateString()} - Steel City Choristers<br /><span style="font-size: xx-small;">Date formatting changed to work with the canvas</span></i>`;
    tableElement.appendChild(footerText);

    tableElement.querySelectorAll('.rotate').forEach(element => {
      element.classList.remove('vertical-text');
    });

    tableElement.querySelectorAll('.save-button').forEach(element => {
      element.style.display = 'none';
    });

    html2canvas(tableElement).then(canvas => {
      const link = document.createElement('a');
      link.download = `availability-${start.value.toLocaleDateString()}-${end.value.toLocaleDateString()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });

    tableElement.querySelectorAll('.save-button').forEach(element => {
      element.style.display = 'block';
    });

    tableElement.querySelectorAll('.rotate').forEach(element => {
      element.classList.add('vertical-text');
    });
    tableElement.removeChild(footerText);
  } catch (error) { console.error('Error:', error) }
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