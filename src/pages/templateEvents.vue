<template>
  <app-header />
  <div class="pa-4 d-flex justify-center">
    <v-card
      :width="isMobile ? '100vw' : '80vw'"
      elevation="0"
    >
      <v-row>
        <v-card-title class="text-h5 ml-3 mt-3">
          Event Templates
        </v-card-title>
        <v-spacer />
        <v-btn
          :disabled="offline"
          variant="flat"
          color="primary"
          class="mt-6 mr-6"
          @click="proxy.$router.push('/templates/new')"
        >
          New
          Template
        </v-btn>
      </v-row>
      <v-card-text>Click on an event template below to edit it</v-card-text>
      <v-data-table
        :items="store.templateNames"
        :headers="headers"
        hide-default-footer
        items-per-page="-1"
        hide-default-header
        @click:row="editTemplate"
      >
        <template #no-data>
          <v-progress-circular
            v-if="loadingData"
            color="primary"
            indeterminate
            size="40"
            class="mt-4"
          />
          <v-card-text v-else>
            No event templates found
          </v-card-text>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app'


const { proxy } = getCurrentInstance()
const store = useAppStore();
document.title = "Template Events - Steel City Choristers"

const headers = [
  { key: 'template_name' }
]

onMounted(async () => {
  loadingData.value = true;
  if (!store.templatesLoaded) {
    await Promise.all(
    store.loadTemplates(),
    store.loadTemplateSlots)
  } else {
    store.loadTemplates();
    store.loadTemplateSlots();
  }
  loadingData.value = false;
})

const editTemplate = (value, row) => {
  if (offline.value) return;
  proxy.$router.push(`/templates/${row.item.id}/edit`)
}

</script>