<template>
  <div class="pa-4 d-flex justify-center">
    <v-card elevation="0" :width="isMobile ? '100vw' : '80vw'">
      <v-row>
        <v-card-title class="text-h5 mt-3 ml-3">Chaperones' Schedules</v-card-title>
        <v-spacer />
        <v-btn v-if="store.isAdmin && !isMobile" variant="flat" class="mt-6 mr-6" color="primary"
          @click="proxy.$router.push('/availability')">Availability</v-btn>
        <v-btn v-if="store.isAdmin && !isMobile" variant="flat" class="mt-6 mr-6" color="primary"
          @click="proxy.$router.push('/users')">Manage Users</v-btn>
      </v-row>
      <v-card-text>Click on a chaperone below to view their schedule</v-card-text>
      <v-data-table :items="chaperones" :headers="headers" hide-default-footer items-per-page="-1"
        @click:row="showSchedule" hide-default-header>
        <template v-slot:no-data>
          <v-progress-circular v-if="loadingData" color="primary" indeterminate size="40" />
          <v-card-text v-else>
            No chaperones found
          </v-card-text>
        </template>
      </v-data-table>
      <div v-if="store.isAdmin && isMobile">
        <v-btn variant="flat" class="mt-6 mr-6" color="primary" width="100vw"
          @click="proxy.$router.push('/availability')">Availability</v-btn>
        <v-btn variant="flat" color="primary" @click="proxy.$router.push('/users')" width="100vw" class="mt-4">Manage
          Users</v-btn>
      </div>
    </v-card>
  </div>

</template>


<script setup>
import { useAppStore } from '@/stores/app';
import { onMounted } from 'vue';

document.title = "Chaperones - Steel City Choristers"


const chaperones = ref([])
const headers = [
  { title: 'Name', key: 'name' }
]

const { proxy } = getCurrentInstance();
const store = useAppStore();

const showSchedule = (value, row) => {
  proxy.$router.push(`/schedule?id=${row.item.id}`)
}


// onMounted(() => {
loadingData.value = true;
fetchAPI('chaperones', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((response) => response.json())
  .then((data) => {
    chaperones.value = data;
    chaperones.value.sort((a, b) => a.name.localeCompare(b.name));
    loadingData.value = false;
  })
  .catch((error) => {
    console.error('Error:', error)
  });
// })

</script>
