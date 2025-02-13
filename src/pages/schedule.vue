<template>
  <app-header />
  <schedule-page :chaperone_id="proxy.$route.query.id" />
</template>

<script setup>
const { proxy } = getCurrentInstance();
</script>