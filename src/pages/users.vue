<template>
  <app-header />
  <div class="pa-4 d-flex justify-center">
    <v-card elevation="0" :width="isMobile ? '100vw' : '80vw'">
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
        <v-data-table :items="users" class="mt-4" :hide-default-header="loadingData" hide-default-footer
          items-per-page="-1" :headers="headers" density="compact"
          :height="loadingData ? 120 : (users.length + 1) * 64">
          <template #item.is_admin="{ item }">
            <v-switch :readonly="item.name === 'Admin'" @click="updateAdmin(item)" class="mb-n6" v-model="item.is_admin"
              color="primary" />
          </template>
          <template #item.delete="{ item }">
            <v-btn v-if="item.name !== 'Admin'" @click="deleteUser(item.id)"
              variant="flat"><v-icon>mdi-delete</v-icon></v-btn>
          </template>
          <template #item.email="{ item }">
            <v-row>
              <v-col>
                <v-card-text v-if="!item.editEmail">
                  {{ item.email }}
                </v-card-text>
                <v-text-field v-else v-model="item.email" class="mb-n3 mt-2" :rules="[required]" label="Email" required
                  @keyup.enter="saveEmail(item)" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col v-if="item.name !== 'Admin'">
                <v-btn v-if="!item.editEmail" variant="flat" class="mt-2"
                  @click="item.editEmail = true"><v-icon>mdi-pencil</v-icon></v-btn>
                <v-btn v-else variant="flat" class="mt-2" @click="saveEmail(item)"><v-icon>mdi-check</v-icon></v-btn>
              </v-col>
            </v-row>
          </template>
          <template v-slot:no-data>
            <v-progress-circular v-if="loadingData" color="primary" indeterminate size="40" class="mt-4" />
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
  { title: 'Name', key: 'name', mobile: true },
  { title: 'Email', key: 'email', mobile: false },
  { title: 'Admin', key: 'is_admin', mobile: true },
  { title: 'Delete', key: 'delete', mobile: true },
].filter(header => !isMobile.value || header.mobile))

// onMounted(() => {
loadingData.value = true;
fetchAPI('chaperones', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((response) => response.json())
  .then((data) => {
    data.sort((a, b) => a.name.localeCompare(b.name));
    data.forEach(user => user.editEmail = false);
    users.value = data;
    loadingData.value = false;
  })
  .catch((error) => {
    console.error('Error:', error)
  });
// })

const saveEmail = (user) => {
  user.editEmail = false;
  fetchAPI(`chaperones/${user.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: user.email })
  })
    .then((response) => response.json())
    .catch(() => {
      store.showAlert('Error', 'An error occurred while updating the user')
    });
}

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