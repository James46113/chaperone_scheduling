<template>
  <app-header />
  <div class="pa-4 d-flex justify-center">
    <v-card width="80vw" elevation="0">
      <v-row>
        <v-card-title class="text-h5 ml-3 mt-3">Event Templates</v-card-title>
        <v-spacer />
        <v-btn variant="flat" color="primary" class="mt-6 mr-6"
          @click="proxy.$router.push('/editEvent?id=new&isTemplate=1')">New Template</v-btn>
      </v-row>
      <v-card-text>Click on an event template below to edit it</v-card-text>
      <v-data-table :items="templates" :headers="headers" hide-default-footer items-per-page="-1"
        @click:row="editTemplate" hide-default-header />
    </v-card>
  </div>
</template>

<script setup>

const { proxy } = getCurrentInstance()
document.title = "Template Events - Steel City Choristers"


const templates = ref([])
const headers = [
  { key: 'template_name' }
]

onMounted(() => {
  fetchAPI('http://localhost:5001/templates/list', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      data.sort((a, b) => a.template_name.localeCompare(b.template_name));
      templates.value = data;
    })
    .catch((error) => {
      console.error('Error:', error)
    });
})

const editTemplate = (value, row) => {
  proxy.$router.push(`/editEvent?id=${row.item.id}&isTemplate=1`)
}

</script>