<template>
  <!-- <div style="display: flex; gap: 0.5rem;" class="mt-3"> -->
  <!-- <v-select :model-value="hours" :items="Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))"
      density="compact" class="mb-1" variant="outlined" width="90px" @update:model-value="updateHours" />
    <v-select :model-value="minutes" :items="Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))"
      density="compact" class="mb-1" variant="outlined" width="90px" @update:model-value="updateMinutes" /> -->
  <!-- <v-row> -->
  <div style="display: flex;">

    <span class="mt-2 mr-4">{{ label }}</span>
    <v-text-field type="time" variant="outlined" density="compact" class="mb-1" max-width="120px"
      :model-value="`${hours}:${minutes}`" @update:model-value="(value) => {
        const [h, m] = value.split(':')
        updateHours(h)
        updateMinutes(m)
      }" />
  </div>
  <!-- </v-row> -->
  <!-- </div> -->
</template>

<script lang="js" setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  hours: String,
  minutes: String,
  label: String,
})


const emit = defineEmits(['update:hours', 'update:minutes'])

const updateHours = (value) => {
  emit('update:hours', value)
}

const updateMinutes = (value) => {
  emit('update:minutes', value)
}
</script>
