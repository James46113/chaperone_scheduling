<template>
  <v-btn v-if="!label" icon variant="flat" :id="activatorID"><v-icon>mdi-menu</v-icon></v-btn>
  <v-btn v-else variant="flat" color="primary" :id="activatorID + label">{{ label }}<v-icon
      class="ml-3">mdi-menu</v-icon></v-btn>

  <v-menu :activator="'#' + activatorID + label">
    <v-card>
      <!-- <v-card-title>Actions</v-card-title> -->
      <v-divider />
      <v-list>
        <v-list-subheader prepend-icon="mdi-calendar">
          Create Events
          <v-icon class="mr-3" style="position: absolute; right: 0;">mdi-calendar-text</v-icon>
        </v-list-subheader>
        <v-list-item prepend-icon="mdi-calendar-plus" @click="proxy.$router.push('/event/new')">
          New Event
        </v-list-item>
        <v-list-item prepend-icon="mdi-calendar-multiple" @click="createTerm">
          New Term
        </v-list-item>
        <v-divider class="mt-2" />
        <v-list-subheader>
          Send Emails
          <v-icon class="mr-4" style="position: absolute; right: 0;">mdi-email-outline</v-icon>
        </v-list-subheader>
        <v-list-item prepend-icon="mdi-calendar-check" @click="sendAssignedEventsEmail">
          Assigned Events
        </v-list-item>
        <v-list-item prepend-icon="mdi-calendar-question" @click="sendAvailabilityEmail">
          Availability
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { useAppStore } from '@/stores/app';


const { proxy } = getCurrentInstance();
const store = useAppStore();

defineProps({
  activatorID: String,
  label: String,
})

const createTerm = () => {
  store.loadTemplateSlots();
  store.loadTemplates();
  store.showCreateTermDialog = true;
}

const sendAssignedEventsEmail = () => {
  store.showAlert('Sending Email', 'Sending chaperones their assigned events')
  fetchAPI('chaperones/events/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (response.ok) {
        store.showAlert('Email Sent', 'Chaperones have been emailed their assigned events')
      } else {
        store.showAlert('Error', 'An error occurred while sending the email')
        console.error('Error:', response)
      }
    })
    .catch((error) => {
      store.showAlert('Error', 'An error occurred while sending the email')
      console.error('Error:', error)
    })
}

const sendAvailabilityEmail = () => {
  store.showAlert('Sending Email', 'Sending availability email')
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
    })
    .catch((error) => {
      store.showAlert("Error", "An error occurred while sending the availability email")
      console.error('Error:', error)
    });
}

</script>
