<template>
  <app-header />
  <div class="pa-4 d-flex justify-center">
    <v-card elevation="0" width="80vw">
      <v-row>
        <v-card-title class="text-h5 mt-3 ml-3">Chaperones' Schedules</v-card-title>
        <v-spacer />
        <v-btn v-if="store.isAdmin && !store.isMobile" variant="flat" class="mt-6 mr-6" color="primary"
          @click="proxy.$router.push('/users')">Manage Users</v-btn>
      </v-row>
      <v-card-text>Click on a chaperone below to view their schedule</v-card-text>
      <v-data-table :items="chaperones" hide-default-footer items-per-page="-1" @click:row="showSchedule"
        hide-default-header>
      </v-data-table>
      <v-btn v-if="store.isAdmin && store.isMobile" variant="flat" color="primary" @click="proxy.$router.push('/users')"
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
  proxy.$router.push(`/schedule?name=${row.item.chaperone}`)
}


onMounted(() => {
  fetchAPI('https://chaperoneschedulingapi-production-b505.up.railway.app/chaperones', {
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
