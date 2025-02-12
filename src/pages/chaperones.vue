<template>
  <app-header />
  <div class="pa-4 d-flex justify-center">
    <v-card elevation="0" width="80vw">
      <v-row>
        <v-card-title class="text-h5 mt-3 ml-3">Chaperones' Schedules</v-card-title>
        <v-spacer />
        <v-btn v-if="store.isAdmin && !isMobile" variant="flat" class="mt-6 mr-6" color="primary"
          @click="proxy.$router.push('/availability')">Availability</v-btn>
        <v-btn v-if="store.isAdmin && !isMobile" variant="flat" class="mt-6 mr-6" color="primary"
          @click="proxy.$router.push('/users')">Manage Users</v-btn>
      </v-row>
      <v-card-text>Click on a chaperone below to view their schedule</v-card-text>
      <v-data-table :items="chaperones" hide-default-footer items-per-page="-1" @click:row="showSchedule"
        hide-default-header>
        <template #item.chaperone="{ item }">
          <v-card-text>{{ item.chaperone.name }}</v-card-text>
        </template>
        <template v-slot:no-data>
          <v-card-text v-if="loadingData">Loading...</v-card-text>
          <v-card-text v-else>
            No chaperones found
          </v-card-text>
        </template>
      </v-data-table>
      <v-btn v-if="store.isAdmin && isMobile" variant="flat" color="primary" @click="proxy.$router.push('/users')"
        width="80vw" class="mt-4">Manage Users</v-btn>
    </v-card>
  </div>
</template>


<script setup>
import { useAppStore } from '@/stores/app';
import { onMounted } from 'vue';

document.title = "Chaperones - Steel City Choristers"


const chaperones = ref([])
const headers = [
  { title: 'Name', key: 'chaperone' }
]

const { proxy } = getCurrentInstance();
const store = useAppStore();

const showSchedule = (value, row) => {
  proxy.$router.push(`/schedule?id=${row.item.chaperone.id}`)
}


onMounted(() => {
  loadingData.value = true;
  fetchAPI('chaperones', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      chaperones.value = data.map(chaperone => { return { chaperone: chaperone } })
      chaperones.value.sort((a, b) => a.chaperone.localeCompare(b.chaperone));
      loadingData.value = false;
    })
    .catch((error) => {
      console.error('Error:', error)
    });
})

</script>
