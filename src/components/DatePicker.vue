<template>
  <div :style="`width: ${totalWidth};`">
    <div style="display: flex;">
      <div class="mt-2 mr-4">{{ label }}</div>
      <v-spacer />
      <v-text-field type="date" variant="outlined" density="compact" max-width="180px" :model-value="date"
        @update:model-value="(value) => {
          emit('update:date', value)
        }" />
    </div>
  </div>
</template>

<script setup>

const emit = defineEmits(['update:date'])

defineProps({
  label: String,
  date: String,
  totalWidth: String,
})

</script>