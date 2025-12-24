<template>
  <div
    v-if="!loadingData"
    class="pa-4 d-flex justify-center"
  >
    <v-card
      elevation="0"
      :width="isMobile ? '100vw' : '80vw'"
    >
      <v-row>
        <v-card-title class="text-h5 mt-3 ml-3">
          Chaperones' Schedules
        </v-card-title>
        <v-spacer />
        <v-btn
          v-if="!isMobile"
          variant="flat"
          class="mt-6 mr-6"
          color="primary"
          prepend-icon="mdi-account-question"
          @click="proxy.$router.push('/availability')"
        >
          Availability
        </v-btn>
        <v-btn
          v-if="!isMobile"
          variant="flat"
          class="mt-6 mr-6"
          color="primary"
          prepend-icon="mdi-account-multiple"
          @click="proxy.$router.push('/users')"
        >
          Manage Users
        </v-btn>
      </v-row>
      <v-card-text>Click on a chaperone below to view their schedule</v-card-text>

      <v-data-table
        :items="store.chaperones"
        :headers="headers"
        hide-default-footer
        items-per-page="-1"
        @click:row="showSchedule"
      >
        <template #no-data>
          <v-progress-circular
            v-if="loadingData"
            color="primary"
            indeterminate
            size="40"
          />
          <v-card-text v-else>
            No chaperones found
          </v-card-text>
        </template>
        <template #item.last_login="{ item }">
          {{ formatLastLogin(item.last_login) }}
        </template>
      </v-data-table>

      <div v-if="isMobile">
        <v-btn
          variant="flat"
          class="mt-6 mr-6"
          color="primary"
          width="100vw"
          prepend-icon="mdi-account-question"
          @click="proxy.$router.push('/availability')"
        >
          Availability
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          width="100vw"
          class="mt-4"
          prepend-icon="mdi-account-multiple"
          @click="proxy.$router.push('/users')"
        >
          Manage
          Users
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
</template>


<script setup>
import { useAppStore } from '@/stores/app';
import { onMounted } from 'vue';

document.title = "Chaperones - Steel City Choristers"

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Last Login', key: 'last_login' },
  { title: 'Assigned Events', key: 'numEvents', align: 'end' }
]

const { proxy } = getCurrentInstance();
const store = useAppStore();

const showSchedule = (value, row) => {
  proxy.$router.push(`/chaperones/${row.item.id}`)
}


onMounted(async () => {
  loadingData.value = true;
  if (!store.chaperonesLoaded || !store.chaperoneSlotsLoaded || !store.eventsLoaded) {
    await Promise.all([
      store.loadEvents(),
      store.loadChaperones(),
      store.loadChaperoneSlots()
    ])
  } else {
    store.loadEvents();
    store.loadChaperones();
    store.loadChaperoneSlots();
  }
  loadingData.value = false;
})

const formatLastLogin = (last_login) => {
  if (!last_login) {
    return ''
  }
  last_login = new Date(last_login)
  const now = new Date();
  const diffInMs = now - last_login;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays == 0){
    return 'Today';
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 30) {
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  } else {
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }

}

</script>