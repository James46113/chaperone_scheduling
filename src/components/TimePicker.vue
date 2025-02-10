<template>
  <div style="display: flex; gap: 0.5rem;" class="mt-3">
    <v-select :model-value="hours" :items="Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))"
      density="compact" class="mb-1" variant="outlined" width="90px" @update:model-value="updateHours" />
    <v-select :model-value="minutes" :items="Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))"
      density="compact" class="mb-1" variant="outlined" width="90px" @update:model-value="updateMinutes" />
  </div>
</template>

<script lang="js" setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  hours: String,
  minutes: String
})


const emit = defineEmits(['update:hours', 'update:minutes'])

const updateHours = (value) => {
  emit('update:hours', value)
}

const updateMinutes = (value) => {
  emit('update:minutes', value)
}
</script>