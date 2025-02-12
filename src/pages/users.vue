<template>
  <app-header />
  <div class="pa-4 d-flex justify-center">
    <v-card elevation="0" width="80vw">
      <v-row class="pt-3 px-3">
        <v-card-title class="text-h5">Users</v-card-title>
        <v-spacer />
        <v-btn color="primary" variant="flat" class="mt-2 mr-1" @click="showNewUserDialog = true">New User</v-btn>
      </v-row>

      <v-alert type="warning" class="mt-4">
        Granting admin access gives users the ability to edit the chaperone schecule. Please ensure that
        only trusted individuals are given this level of access.
      </v-alert>

      <div class="d-flex justify-center">
        <v-data-table :items="users" :hide-default-header="loadingData" hide-default-footer items-per-page="-1"
          :headers="headers" density="compact" :height="loadingData ? 120 : (users.length + 1) * 64">
          <template #item.is_admin="{ item }">
            <v-switch @click="updateAdmin(item)" class="mb-n6" v-model="item.is_admin" color="primary" />
          </template>
          <template #item.delete="{ item }">
            <v-btn @click="deleteUser(item.id)" variant="flat"><v-icon>mdi-delete</v-icon></v-btn>
          </template>
          <template v-slot:no-data>
            <v-card-text v-if="loadingData">Loading...</v-card-text>
            <v-card-text v-else>No users found</v-card-text>
          </template>
        </v-data-table>
      </div>
    </v-card>
  </div>

  <v-dialog v-model="showNewUserDialog" :width="isMobile ? '100vw' : '30vw'" density="compact">
    <v-card>
      <v-card-title>New User</v-card-title>
      <v-card-text>
        <v-text-field v-model="newUser.email" :rules="[required]" label="Email" required
          @keyup.enter="createUser"></v-text-field>
        <v-text-field v-model="newUser.name" :rules="[required]" label="Name" required
          @keyup.enter="createUser"></v-text-field>
        <v-switch v-model="newUser.is_admin" label="Admin" color="primary" />
      </v-card-text>
      <v-card-actions>
        <v-btn @click="showNewUserDialog = false">Cancel</v-btn>
        <v-btn @click="createUser" color="primary">Create</v-btn>
      </v-card-actions>
    </v-card>

  </v-dialog>
</template>

<script setup>
import { useAppStore } from '@/stores/app'


const users = ref([])
const newUser = ref({ is_admin: false })
const showNewUserDialog = ref(false)

const store = useAppStore();

const required = (value) => !!value || 'This field is required.'

const headers = computed(() => [
  { title: 'Email', key: 'email', mobile: true },
  { title: 'Admin', key: 'is_admin', mobile: true },
  { title: 'Delete', key: 'delete', width: '10%', mobile: false },
].filter(header => !isMobile.value || header.mobile))

onMounted(() => {
  loadingData.value = true;
  fetchAPI('chaperones', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      data.sort((a, b) => a.email.localeCompare(b.email));
      users.value = data;
      loadingData.value = false;
    })
    .catch((error) => {
      console.error('Error:', error)
    });
})

const createUser = () => {
  if (!newUser.value.email) {
    store.showAlert('Invalid email', 'Please enter an email address')
    return;
  }
  if (!newUser.value.name) {
    store.showAlert('Invalid name', 'Please enter a name')
    return;
  }
  fetchAPI('chaperones', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newUser.value)
  })
    .then((response) => {
      if (!response.ok) {
        return Promise.reject(response);
      }
      return response.json()
    })
    .then((data) => {
      users.value.push(data)
      newUser.value = { is_admin: false, email: null }
      showNewUserDialog.value = false
    })
    .catch((response) => {
      if (response.status == 409) {
        store.showAlert('User Exists', 'A user with that email already exists')
        return;
      }
      store.showAlert('Error', 'An error occurred while creating the user')
    });
}

const deleteUser = (user_id) => {
  fetchAPI(`chaperones/${user_id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (!response.ok) {
        return Promise.reject(response);
      }
      return response.json()
    })
    .then((data) => {
      users.value = users.value.filter(user => user.id != user_id)
    })
    .catch((response) => {
      store.showAlert('Error', 'An error occurred while deleting the user')
    });
}

const updateAdmin = (user) => {
  fetchAPI(`chaperones/${user.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_admin: !user.is_admin })
  })
    .then((response) => {
      if (!response.ok) {
        return Promise.reject(response);
      }
    })
    .catch((response) => {
      store.showAlert('Error', 'An error occurred while updating the user')
    });
}

</script>