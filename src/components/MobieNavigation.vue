<template>
  <v-bottom-navigation grow color="primary">
    <v-btn @click="goHome('calendar')"><v-icon>mdi-calendar</v-icon></v-btn>
    <v-btn @click="goHome('list')"><v-icon>mdi-format-list-bulleted</v-icon></v-btn>
    <v-btn v-if="store.isAdmin" @click="goHome('chaperones')"><v-icon>mdi-account-multiple</v-icon></v-btn>
    <v-btn @click="goHome('schedule')"><v-icon>mdi-account</v-icon></v-btn>
  </v-bottom-navigation>
</template>

<script setup>
const { proxy } = getCurrentInstance();
const goHome = (tab) => {
  store.tabView = tab;
  proxy.$router.push(`/?view=${tab}`)
}
</script>