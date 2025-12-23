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

  if (start.value > end.value) {
    store.showAlert("Invalid Dates", "The start date must be before the end date.")
  }

  fetchAPI('create_term', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ start: start.value.getTime(), end: end.value.getTime() })
  })
  .then(response => {
    if (!response.ok) {
      store.showAlert("An Error Occurred", "There was a problem creating the term. Please try again later. If this issue persists, please contact jamescaroe@gmail.com.")
    } else {
        store.showCreateTermDialog = false;
        store.loadEvents();
    }
  })
}

</script>