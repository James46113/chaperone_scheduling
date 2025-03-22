<template>
  <edit-page :event="event" :deleteEvent="deleteEvent" :saveEvent="saveEvent" :newSlot="newSlot"
    :removeSlot="removeSlot" :isTemplate="isTemplate" :isNewEvent="false" :notFound="notFound" />
</template>

<script setup>

import { useAppStore } from '@/stores/app';
import EditPage from '@/components/EditPage.vue';


const store = useAppStore();
const { proxy } = getCurrentInstance();
const EVENTID = computed(() => proxy.$route.params.id);
const isTemplate = computed(() => proxy.$route.path.startsWith('/templates'));
const event = ref({});
const notFound = ref(false);

onMounted(async () => {
  loadingData.value = true;
  if (isTemplate.value) {
    await loadTemplate();
  } else {
    await loadEvent();
  }
  loadingData.value = false;
})

onUnmounted(() => {
  store.unlockEvents();
})


const newSlot = () => {
  if (isTemplate.value) {
    store.newTemplateSlot({
      start: event.value.start,
      end: event.value.end,
      startHours: event.value.startHours,
      startMinutes: event.value.startMinutes,
      endHours: event.value.endHours,
      endMinutes: event.value.endMinutes,
      template_id: event.value.id,
    });
  } else {
    store.newChaperoneSlot({
      start: event.value.start,
      end: event.value.end,
      startHours: event.value.startHours,
      startMinutes: event.value.startMinutes,
      endHours: event.value.endHours,
      endMinutes: event.value.endMinutes,
      event_id: event.value.id,
    });
  }
};

const removeSlot = (slot) => {
  if (isTemplate.value) {
    store.removeTemplateSlot(slot);
  } else {
    store.removeChaperoneSlot(slot);
  }
};

const loadEvent = async () => {
  if (!store.allAvailabilityLoaded || !store.chaperonesLoaded || !store.eventsLoaded || !store.chaperoneSlotsLoaded) {
    await Promise.all([
      store.loadAllAvailability(),
      store.loadChaperones(),
      store.loadEvents(),
      store.loadChaperoneSlots(),
    ]);
  } else {
    store.loadAllAvailability()
  }
  store.lockEvents();
  const tempEvent = store.getEvent(EVENTID.value);
  if (!tempEvent) {
    notFound.value = true;
    return;
  }

  tempEvent.startHours = String(tempEvent.start.getHours()).padStart(2, '0');
  tempEvent.startMinutes = String(tempEvent.start.getMinutes()).padStart(2, '0');
  tempEvent.endHours = String(tempEvent.end.getHours()).padStart(2, '0');
  tempEvent.endMinutes = String(tempEvent.end.getMinutes()).padStart(2, '0');
  tempEvent.date = tempEvent.start;

  tempEvent.slots.forEach((slot) => {
    slot.startHours = String(slot.start.getHours()).padStart(2, '0');
    slot.startMinutes = String(slot.start.getMinutes()).padStart(2, '0');
    slot.endHours = String(slot.end.getHours()).padStart(2, '0');
    slot.endMinutes = String(slot.end.getMinutes()).padStart(2, '0');
    slot.selectedChaperoneName = slot.chaperoneName;
    slot.selectedChaperoneID = computed(() => store.getChaperoneIDByName(slot.selectedChaperoneName))
  });

  tempEvent.slotsToDelete = [];

  event.value = tempEvent;
}

const loadTemplate = async () => {
  if (!store.templatesLoaded || !store.templateSlotsLoaded) {
    await Promise.all([
      store.loadTemplates(),
      store.loadTemplateSlots(),
    ]);
  }

  const tempTemplate = store.getTemplate(EVENTID.value);
  if (!tempTemplate) {
    notFound.value = true;
    return;
  }

  tempTemplate.startHours = String(tempTemplate.start.getHours()).padStart(2, '0');
  tempTemplate.startMinutes = String(tempTemplate.start.getMinutes()).padStart(2, '0');
  tempTemplate.endHours = String(tempTemplate.end.getHours()).padStart(2, '0');
  tempTemplate.endMinutes = String(tempTemplate.end.getMinutes()).padStart(2, '0');
  tempTemplate.date = tempTemplate.start;

  tempTemplate.slots.forEach((slot) => {
    slot.startHours = String(slot.start.getHours()).padStart(2, '0');
    slot.startMinutes = String(slot.start.getMinutes()).padStart(2, '0');
    slot.endHours = String(slot.end.getHours()).padStart(2, '0');
    slot.endMinutes = String(slot.end.getMinutes()).padStart(2, '0');
    slot.selectedChaperoneName = slot.chaperoneName;
    slot.selectedChaperoneID = computed(() => store.getChaperoneIDByName(slot.selectedChaperoneName))
  });

  tempTemplate.slotsToDelete = [];

  event.value = tempTemplate;
}

const saveEvent = async () => {
  if (isTemplate.value) { // If is template
    if (!event.value.template_name || !event.value.title || !event.value.location) {
      store.showAlert('Missing Fields', 'Please fill in all required fields.')
      return;
    }

    const start = new Date(event.value.start);
    start.setHours(event.value.startHours, event.value.startMinutes, 0, 0);

    const end = new Date(event.value.start);
    end.setHours(event.value.endHours, event.value.endMinutes, 0, 0);

    event.value.start = start;
    event.value.end = end;

    if (event.value.start >= event.value.end) {
      store.showAlert('Invalid Time', 'Event end time must be after start time.')
      return;
    }

    event.value.slots.forEach((slot) => {
      const start = new Date(event.value.start);
      start.setHours(slot.startHours, slot.startMinutes, 0, 0);

      const end = new Date(event.value.start);
      end.setHours(slot.endHours, slot.endMinutes, 0, 0);

      slot.start = start;
      slot.end = end;

      if (slot.start >= slot.end) {
        store.showAlert('Invalid Time', 'Chaperone end time must be after start time.')
        return;
      }

      if (slot.end > event.value.end || slot.start < event.value.start) {
        store.showAlert('Invalid Time', 'Chaperone times must be within event times.')
        return;
      }
    });

    await store.saveTemplate(EVENTID.value);

  } else { // If is event

    if (event.isPastEvent) {
      store.showAlert('Past Event', 'Cannot edit past events.')
      return;
    }

    if (!event.value.title || !event.value.location || !event.value.date) {
      store.showAlert('Missing Fields', 'Please fill in all required fields.')
      return;
    }

    const start = new Date(event.value.date);
    start.setHours(event.value.startHours, event.value.startMinutes, 0, 0);

    const end = new Date(event.value.date);
    end.setHours(event.value.endHours, event.value.endMinutes, 0, 0);

    event.value.start = start;
    event.value.end = end;

    if (event.value.start >= event.value.end) {
      store.showAlert('Invalid Time', 'Event end time must be after start time.')
      return;
    }

    if (event.start < new Date()) {
      store.showAlert('Invalid Time', 'Event must be in the future.')
      return;
    }

    event.value.slots.forEach((slot) => {
      const start = new Date(event.value.date);
      start.setHours(slot.startHours, slot.startMinutes, 0, 0);

      const end = new Date(event.value.date);
      end.setHours(slot.endHours, slot.endMinutes, 0, 0);

      slot.start = start;
      slot.end = end;

      slot.setChaperone(slot.selectedChaperoneID);

      if (slot.start >= slot.end) {
        store.showAlert('Invalid Time', 'Chaperone end time must be after start time.')
        return;
      }

      if (slot.end > event.value.end || slot.start < event.value.start) {
        store.showAlert('Invalid Time', 'Chaperone times must be within event times.')
        return;
      }
    });

    if (await store.saveEvent(EVENTID.value)) {
      proxy.$router.push(`/event/${EVENTID.value}`);
    }

  }
}

const deleteEvent = async () => {
  if (isTemplate.value) { // If is template
    if (EVENTID.value == '2' || EVENTID.value == '3') {
      store.showAlert("Error", "Cannot delete default templates.");
      return;
    }

    await store.deleteTemplate(EVENTID.value);
    proxy.$router.push('/templates')

  } else { // If is event
    if (event.value.isPastEvent) {
      store.showAlert("Past Event", "Cannot delete past events.")
      return;
    }
    await store.deleteEvent(EVENTID.value);
    proxy.$router.push('/')
  }
}


</script>
