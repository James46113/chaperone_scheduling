<template>
  <div class="pa-4">
    <v-card-title class="text-h5">Chaperones' Schedules</v-card-title>
    <v-card-text>Click on a chaperone below to view their schedule</v-card-text>
    <v-data-table :items="chaperones" hide-default-footer items-per-page="-1" @click:row="showSchedule"
      hide-default-header>
    </v-data-table>
  </div>
</template>


<script setup>
import { onMounted } from 'vue';

document.title = "Chaperones - Steel City Choristers"


const chaperones = ref([])
const headers = [
  { title: 'Name', key: 'chaperone' }
]

const { proxy } = getCurrentInstance();

const showSchedule = (value, row) => {
  proxy.$router.push(`/schedule?name=${row.item.chaperone}`)
}


onMounted(() => {
  fetchAPI('http://localhost:5001/chaperones', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      chaperones.value = data.map(chaperone => { return { chaperone: chaperone } })
      chaperones.value.sort((a, b) => a.chaperone.localeCompare(b.chaperone));
    })
    .catch((error) => {
      console.error('Error:', error)
    });
})

</script>
