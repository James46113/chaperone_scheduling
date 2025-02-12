<template>
  <app-header />
  <div class="pa-6">
    <v-card class="pa-3">
      <v-row>
        <v-col>
          <v-text-field v-if="isTemplate" width="65vw" :rules="[required]" v-model="event.template_name"
            label="Template Name" variant="outlined" class="mb-1" />

          <v-text-field width="65vw" :rules="[required]" v-model="event.title" label="Event Title" variant="outlined"
            class="mb-1" />

          <v-text-field width="65vw" :rules="[required]" v-model="event.location" label="Location" variant="outlined"
            class="mb-1" />
        </v-col>
        <v-col>
          <div class="d-flex justify-end">
            <v-select v-if="!isTemplate && newEvent" :items="templateNames" v-model="selectedTemplate"
              variant="outlined" class="mx-6" @update:model-value="loadTemplate" placeholder="Load Template" />

            <v-btn v-if="!newEvent" color="primary" class="mt-2 mr-4" variant="outlined"
              @click="showConfirmDeleteDialog = true">
              Delete {{ isTemplate ? 'Template' : 'Event' }}</v-btn>
            <v-btn color="primary" class="mt-2" @click="saveEvent" :loading="saving">Save</v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row class="mb-1">
        <v-col v-if="!isTemplate">
          <v-date-input v-if="!isTemplate" :rules="[required]" v-model="event.date" label="Date" variant="outlined"
            class="mt-3" :first-day-of-week="1" placeholder="dd/mm/yyyy" @input="formatDate" />
        </v-col>
        <v-col>
          <v-row class="my-2">
            <span class="ml-4 mt-5 mr-3">Start</span>
            <time-picker :hours="event.startHours" :minutes="event.startMinutes" @update:hours="updateEventStartHours"
              @update:minutes="updateEventStartMinutes" />
          </v-row>
        </v-col>
        <v-col>
          <v-row class="my-2">
            <span class="ml-4 mt-5 mr-5">End</span>
            <time-picker :hours="event.endHours" :minutes="event.endMinutes" @update:hours="updateEventEndHours"
              @update:minutes="updateEventEndMinutes" />
          </v-row>
        </v-col>
        <v-col><v-spacer /></v-col>
        <v-col v-if="isTemplate"><v-spacer /></v-col>
      </v-row>

      <!-- <v-card-subtitle>{{ event.start ? event.start.toLocaleDateString('en-UK', {
        weekday: 'short', day: 'numeric',
        month: 'short', year: 'numeric'
        }) : 'N/A' }}</v-card-subtitle> -->
      <v-textarea v-model="event.details" label="Event Details" variant="outlined" auto-grow rows="2" />

      <v-divider class="mt-4"></v-divider>

      <v-row class="my-3">
        <v-card-title class="mt-4">Chaperones</v-card-title>
        <v-select v-if="!isTemplate" :items="assignedChaperones" v-model="event.lead_chaperone" label="Lead Chaperone"
          variant="outlined" class="mt-3 ml-7" hide-no-data />
        <v-spacer /> <v-spacer /> <v-spacer />
        <v-btn color="primary" variant="outlined" class="mt-6 mr-6" @click="newSlot">Add Chaperone</v-btn>
      </v-row>

      <v-data-table :height="chaperoneSlots.length > 0 ? (chaperoneSlots.length + 1) * 76 : undefined"
        :items="chaperoneSlots" :headers="tableHeaders" items-per-page="-1" hide-default-footer>
        <template v-slot:item.chaperone="{ item }">
          <v-select :items="chaperoneNames" v-model="item.chaperone" variant="outlined" density="compact"
            class="mt-3 mb-1" auto-select-first />
        </template>
        <template v-slot:item.startTime="{ item }">
          <time-picker :hours="item.startHours" :minutes="item.startMinutes" @update:hours="item.startHours = $event"
            @update:minutes="item.startMinutes = $event" />
        </template>
        <template v-slot:item.endTime="{ item }">
          <time-picker :hours="item.endHours" :minutes="item.endMinutes" @update:hours="item.endHours = $event"
            @update:minutes="item.endMinutes = $event" />
        </template>
        <template v-slot:item.details="{ item }">
          <v-textarea v-model="item.details" variant="outlined" density="compact" class="mt-3 mb-1" auto-grow
            rows="1" />
        </template>
        <template v-slot:item.title="{ item }">
          <v-text-field v-model="item.title" variant="outlined" density="compact" class="mt-3 mb-1"
            :rules="[required]" />
        </template>
        <template v-slot:item.remove="{ item }">
          <v-btn variant="flat" class="mt-n3" icon @click="chaperoneSlots.splice(chaperoneSlots.indexOf(item), 1)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
        <template v-slot:no-data>
          <v-alert type="warning" class="mt-3">
            No chaperones assigned
          </v-alert>
        </template>
      </v-data-table>
    </v-card>
  </div>

  <v-dialog v-model="showConfirmDeleteDialog" width="30vw">
    <v-card @keyup.enter="deleteEvent">
      <v-card-title>Confirm Delete</v-card-title>
      <v-card-text class="mt-3 mb-n2">Are you sure you want to delete this event?</v-card-text>
      <v-card-actions>
        <v-btn @click="showConfirmDeleteDialog = false" color="primary" variant="text">Cancel</v-btn>
        <v-btn @click="deleteEvent" color="primary" variant="flat">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="js" setup>
import { useAppStore } from '@/stores/app';
import { getCurrentInstance } from 'vue';
import { VDateInput } from 'vuetify/labs/VDateInput'


const { proxy } = getCurrentInstance();
const event = ref({});
const chaperoneSlots = ref([]);
const chaperones = ref([]);
const chaperoneNames = ref([])

const saving = ref(false);
const store = useAppStore();
let newEvent = false;
let isTemplate = ref(false);

const templates = ref([]);
const templateNames = computed(() => templates.value.map(template => template.template_name).sort());
const selectedTemplate = ref('Load Template');
const templateChaperoneSlots = ref([]);

const showConfirmDeleteDialog = ref(false);

const assignedChaperones = computed(() => [... new Set(chaperoneSlots.value.map(slot => slot.chaperone))].sort());

const required = value => !!value || 'Field is required.';

const tableHeaders = computed(() => [
  { title: 'Group', key: 'title', width: '20%', showTemplate: true },
  { title: 'Chaperone', key: 'chaperone', width: '15%', showTemplate: false },
  { title: 'Details', key: 'details', width: '35%', showTemplate: true },
  { title: 'Start', key: 'startTime', width: '12%', showTemplate: true },
  { title: 'End', key: 'endTime', width: '12%', showTemplate: true },
  { title: 'Remove', key: 'remove', width: '6%', showTemplate: true }
].filter(header => isTemplate.value ? header.showTemplate : true));


onMounted(async () => {

  if (!proxy.$route.query.id) {
    proxy.$router.push('/');
  }

  if (proxy.$route.query.isTemplate) {
    isTemplate.value = proxy.$route.query.isTemplate === '1';
  }

  await getChaperones();

  if (proxy.$route.query.id === 'new') {
    newEvent = true;
    document.title = (isTemplate.value ? "New Template" : "New Event") + " - Steel City Choristers";
    event.value = {
      date: new Date(),
      start: new Date(),
      end: new Date(),
      startHours: '00',
      startMinutes: '00',
      endHours: '00',
      endMinutes: '00',
      details: '',
      lead_chaperone: '',
    };

    fetchAPI('templates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        templates.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      });

    fetchAPI(`template_chaperone_slots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        templateChaperoneSlots.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      });
    return;
  }

  if (!isTemplate.value) {
    fetchAPI(`events/${proxy.$route.query.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        data.start = new Date(data.start);
        data.end = new Date(data.end);
        data.startHours = String(data.start.getHours()).padStart(2, '0');
        data.startMinutes = String(data.start.getMinutes()).padStart(2, '0');
        data.endHours = String(data.end.getHours()).padStart(2, '0');
        data.endMinutes = String(data.end.getMinutes()).padStart(2, '0');
        data.date = data.start;
        data.lead_chaperone = chaperones.value.find(chaperone => chaperone.id === data.lead_chaperone)?.name ?? null;
        event.value = data;
        document.title = `${data.title} - Steel City Choristers`;
      })
      .catch((error) => {
        console.error('Error:', error)
      });

    fetchAPI(`chaperone_slots/${proxy.$route.query.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        data.forEach(slot => {
          slot.start = new Date(slot.start);
          slot.end = new Date(slot.end);
          slot.startHours = String(slot.start.getHours()).padStart(2, '0');
          slot.startMinutes = String(slot.start.getMinutes()).padStart(2, '0');
          slot.endHours = String(slot.end.getHours()).padStart(2, '0');
          slot.endMinutes = String(slot.end.getMinutes()).padStart(2, '0');
          slot.chaperone = chaperones.value.find(chaperone => chaperone.id === slot.chaperone)?.name ?? null;
        });
        data.sort((a, b) => a.start - b.start)
        chaperoneSlots.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      });
  }

  else {
    fetchAPI(`templates/${proxy.$route.query.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        data.start = new Date(data.start);
        data.end = new Date(data.end);
        data.startHours = String(data.start.getHours()).padStart(2, '0');
        data.startMinutes = String(data.start.getMinutes()).padStart(2, '0');
        data.endHours = String(data.end.getHours()).padStart(2, '0');
        data.endMinutes = String(data.end.getMinutes()).padStart(2, '0');
        data.date = data.start;
        event.value = data;
        document.title = `${data.template_name} Template - Steel City Choristers`;
      })
      .catch((error) => {
        console.error('Error:', error)
      });

    fetchAPI(`template_chaperone_slots/${proxy.$route.query.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        data.forEach(slot => {
          slot.start = new Date(slot.start);
          slot.end = new Date(slot.end);
          slot.startHours = String(slot.start.getHours()).padStart(2, '0');
          slot.startMinutes = String(slot.start.getMinutes()).padStart(2, '0');
          slot.endHours = String(slot.end.getHours()).padStart(2, '0');
          slot.endMinutes = String(slot.end.getMinutes()).padStart(2, '0');
        });
        chaperoneSlots.value = data;
      })
      .catch((error) => {
        console.error('Error:', error)
      });
  }
});

const leadChaperoneAssigned = () => {
  if (assignedChaperones.value.length > 0 && !event.value.lead_chaperone) {
    return false
  }

  if (!assignedChaperones.value.includes(chaperones.value.find(chaperone => chaperone.name === event.value.lead_chaperone)?.id ?? null) && event.value.lead_chaperone) {
    return false
  }
  return true
}

const loadTemplate = () => {
  const template = templates.value.find(template => template.template_name === selectedTemplate.value);
  template.start = new Date(template.start);
  template.end = new Date(template.end);
  template.startHours = String(template.start.getHours()).padStart(2, '0');
  template.startMinutes = String(template.start.getMinutes()).padStart(2, '0');
  template.endHours = String(template.end.getHours()).padStart(2, '0');
  template.endMinutes = String(template.end.getMinutes()).padStart(2, '0');
  event.value = template;
  const tempChaperoneSlots = templateChaperoneSlots.value.filter(slot => slot.template_id === template.id);
  tempChaperoneSlots.forEach(slot => {
    slot.start = new Date(slot.start);
    slot.end = new Date(slot.end);
    slot.startHours = String(slot.start.getHours()).padStart(2, '0');
    slot.startMinutes = String(slot.start.getMinutes()).padStart(2, '0');
    slot.endHours = String(slot.end.getHours()).padStart(2, '0');
    slot.endMinutes = String(slot.end.getMinutes()).padStart(2, '0');
  });
  chaperoneSlots.value = tempChaperoneSlots
  selectedTemplate.value = 'Load Template';
}

const deleteEvent = () => {
  let failed = false;
  if (isTemplate.value) {
    fetchAPI(`templates/${event.value.id}`, {
      method: 'DELETE',
    }).then((response) => {
      if (!response.ok) {
        failed = true;
      }
      fetchAPI(`template_chaperone_slots/${event.value.id}`, {
        method: 'DELETE',
      }).then((response) => {
        if (!response.ok) {
          failed = true;
        }
        if (failed) {
          store.showAlert("Error", "Failed to delete template.");
          return;
        } else {
          store.showAlert("Success", "Template deleted successfully.");
          proxy.$router.push('/');
        }
      });
    });
  }

  else {

    fetchAPI(`events/${event.value.id}`, {
      method: 'DELETE',
    }).then((response) => {
      if (!response.ok) {
        failed = true;
      }
      fetchAPI(`chaperone_slots/${event.value.id}`, {
        method: 'DELETE',
      }).then((response) => {
        if (!response.ok) {
          failed = true;
        }
        if (failed) {
          store.showAlert("Error", "Failed to delete event.");
          return;
        } else {
          store.showAlert("Success", "Event deleted successfully.");
          proxy.$router.push('/');
        }
      });
    });
  }
}

const updateEventStartMinutes = (value) => {
  chaperoneSlots.value.forEach(slot => {
    if (slot.startMinutes == event.value.startMinutes && slot.startHours == event.value.startHours) {
      slot.startMinutes = value;
    }
  });
  event.value.startMinutes = value;
};

const updateEventStartHours = (value) => {
  chaperoneSlots.value.forEach(slot => {
    if (slot.startMinutes == event.value.startMinutes && slot.startHours == event.value.startHours) {
      slot.startHours = value;
    }
  });
  event.value.startHours = value;
};

const updateEventEndMinutes = (value) => {
  chaperoneSlots.value.forEach(slot => {
    if (slot.endMinutes == event.value.endMinutes && slot.endHours == event.value.endHours) {
      slot.endMinutes = value;
    }
  });
  event.value.endMinutes = value;
};

const updateEventEndHours = (value) => {
  chaperoneSlots.value.forEach(slot => {
    if (slot.endMinutes == event.value.endMinutes && slot.endHours == event.value.endHours) {
      slot.endHours = value;
    }
  });
  event.value.endHours = value;
};

const newSlot = () => {
  chaperoneSlots.value.push({
    title: '',
    details: '',
    start: event.value.start,
    end: event.value.end,
    startHours: event.value.startHours,
    startMinutes: event.value.startMinutes,
    endHours: event.value.endHours,
    endMinutes: event.value.endMinutes,
    chaperone: '',
  });
};

const saveEvent = async () => {
  saving.value = true;
  getChaperones();
  if (!event.value.title || !event.value.location || !event.value.date) {
    store.showAlert('Invalid Data', 'Please fill in all required fields.');
    saving.value = false;
    return;
  }

  const start = new Date(event.value.date);
  start.setHours(event.value.startHours, event.value.startMinutes, 0, 0);
  event.value.start = start;

  const end = new Date(event.value.date);
  end.setHours(event.value.endHours, event.value.endMinutes, 0, 0);
  event.value.end = end;

  if (event.value.end <= event.value.start) {
    store.showAlert('Invalid Data', 'Event end time must be after start time.');
    saving.value = false;
    return;
  }

  if (newEvent) {
    if (isTemplate.value) {
      await saveNewTemplate();
    } else {
      await saveNewEvent();
    }
  } else {
    if (isTemplate.value) {
      await saveExistingTemplate();
    } else {
      await saveExistingEvent();
    }
  }
}

const saveNewTemplate = async () => {
  await fetchAPI("templates", {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event.value),
  }).then((response) => {
    if (!response.ok) {
      store.showAlert("Error", "Failed to save template.");
      saving.value = false;
      return;
    }
    return response.json()
  }
  )
    .then((data) => {
      event.value.id = data.id;
      saveTemplateChaperoneSlots()
        .then(() => {
          store.showAlert("Success", "Template saved successfully.");
          proxy.$router.push(`/templateEvents`)
          saving.value = false;
        });
    });
}

const saveNewEvent = () => {
  fetchAPI("events", {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...event.value, lead_chaperone: chaperones.value.find(chaperone => chaperone.name === event.value.lead_chaperone)?.id ?? null }),
  }).then((response) => {
    if (!response.ok) {
      store.showAlert("Error", "Failed to save event.");
      saving.value = false;
      return;
    }
    return response.json()
  })
    .then((data) => {
      event.value.id = data.id;
      saveChaperoneSlots()
        .then((success) => {
          if (success) {
            store.showAlert("Success", "Event saved successfully.");
            proxy.$router.push(`/event?id=${event.value.id}`)
            saving.value = false;
          }
        });
    });
}

const getChaperones = async () => {
  await fetchAPI('chaperones', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      chaperones.value = data;
      chaperoneNames.value = chaperones.value.map(chaperone => chaperone.name).sort()
    })
    .catch((error) => {
      console.error('Error:', error)
    });
}

const saveExistingEvent = () => {
  fetchAPI(`events/${event.value.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...event.value, lead_chaperone: chaperones.value.find(chaperone => chaperone.name === event.value.lead_chaperone)?.id ?? null }),
  }).then(response => {
    if (!response.ok) {
      store.showAlert("Error", "Failed to save event.");
      saving.value = false;
      return;
    }
    saveChaperoneSlots().then(success => {
      if (success) {
        store.showAlert("Success", "Event saved successfully.");
        proxy.$router.push(`/event?id=${event.value.id}`)
        saving.value = false;
      }
    })
  });
}

const saveExistingTemplate = () => {
  fetchAPI(`templates/${event.value.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event.value),
  }).then(response => {
    if (!response.ok) {
      saving.value = false;
      store.showAlert("Error", "Failed to save template.");
      return;
    }
    store.showAlert("Success", "Template saved successfully.");
    return saveTemplateChaperoneSlots();
  }).then(() => proxy.$router.push(`/templateEvents`));
}

const saveTemplateChaperoneSlots = async () => {
  let validData = true;
  let validTimes = true;

  chaperoneSlots.value.forEach(slot => {
    const start = new Date(event.value.date);
    start.setHours(slot.startHours, slot.startMinutes, 0, 0);
    slot.start = start;

    const end = new Date(event.value.date);
    end.setHours(slot.endHours, slot.endMinutes, 0, 0);
    slot.end = end;

    if (!slot.title || !slot.start || !slot.end) {
      validData = false;
    }
    if (slot.end <= slot.start) {
      validTimes = false;
    }
  });
  if (!validData) {
    store.showAlert('Invalid Data', 'Please fill in all required fields.');
    saving.value = false;
    return;
  }
  if (!validTimes) {
    store.showAlert('Invalid Data', 'End time must be after start time for all chaperones.');
    saving.value = false;
    return;
  }
  await fetchAPI(`template_chaperone_slots/${event.value.id}`, {
    method: 'DELETE'
  }).then(response => {
    if (!response.ok) {
      store.showAlert("Error", "Failed to save template.");
      return;
    }
  });


  await Promise.all(chaperoneSlots.value.map(slot => {
    return fetchAPI("template_chaperone_slots", {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: event.value.id,
        chaperone: slot.chaperone,
        title: slot.title,
        start: slot.start,
        end: slot.end,
        details: slot.details,
      }),
    }).then(response => {
      saving.value = false;
      if (!response.ok) {
        saving.value = false;
        store.showAlert("Error", "Failed to save template.");
        return;
      }
    });
  }));
}

const saveChaperoneSlots = async () => {
  let validData = true;
  let validTimes = true;
  chaperoneSlots.value.forEach(slot => {
    const start = new Date(event.value.date);
    start.setHours(slot.startHours, slot.startMinutes, 0, 0);
    slot.start = start;

    const end = new Date(event.value.date);
    end.setHours(slot.endHours, slot.endMinutes, 0, 0);
    slot.end = end;
    slot.chaperone = chaperones.value.find(chaperone => chaperone.name === slot.chaperone)?.id ?? null;

    if (!slot.chaperone || !slot.title || !slot.start || !slot.end) {
      validData = false;
    }
    if (slot.end <= slot.start) {
      validTimes = false;
    }
  });
  if (!validData) {
    store.showAlert('Invalid Data', 'Please fill in all required fields.');
    saving.value = false;
    return false;
  }
  if (!validTimes) {
    store.showAlert('Invalid Data', 'End time must be after start time for all chaperones.');
    saving.value = false;
    return false;
  }

  if (!leadChaperoneAssigned()) {
    store.showAlert('Invalid Data', 'Lead chaperone must be assigned to a chaperone slot.');
    saving.value = false;
    return false;
  }

  await fetchAPI(`chaperone_slots/${event.value.id}`, {
    method: 'DELETE'
  })

  await Promise.all(chaperoneSlots.value.map(slot => {
    return fetchAPI("chaperone_slots", {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_id: event.value.id,
        chaperone: slot.chaperone,
        title: slot.title,
        start: slot.start,
        end: slot.end,
        details: slot.details,
      }),
    })
  }));
  saving.value = false;
  return true;
}

</script>
