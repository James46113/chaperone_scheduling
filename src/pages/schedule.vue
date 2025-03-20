<template>
  <app-header />
  <schedule-page :chaperone_id="proxy.$route.params.id" />
</template>

<script setup>
const { proxy } = getCurrentInstance();
</script>