<template>
  <edit-page :event="event" :removeSlot="removeSlot" :newSlot="newSlot" :saveEvent="saveEvent" :isTemplate="isTemplate"
    :isNewEvent="true" />
</template>

<script setup>
import { useAppStore } from '@/stores/app';


const event = ref({})
const { proxy } = getCurrentInstance()
const store = useAppStore();
const isTemplate = computed(() => proxy.$route.path.startsWith('/templates'));

onMounted(async () => {
  loadingData.value = true;
  if (!isTemplate.value) {
    if (!store.templatesLoaded || !store.templateSlotsLoaded) {
      await Promise.all([
        store.loadTemplates(),
        store.loadTemplateSlots(),
      ])
    } else {
      store.loadTemplates()
      store.loadTemplateSlots()
    }
  } else {

  }
  event.value = {
    slots: [],
    start: new Date(),
    end: new Date(),
    date: new Date(),
    startHours: "00",
    startMinutes: "00",
    endHours: "00",
    endMinutes: "00",
  }

  loadingData.value = false;
})


const removeSlot = (slot) => {
  event.value.slots = event.value.slots.filter(s => s !== slot);
};

const newSlot = () => {
  event.value.slots.push({
    start: new Date(),
    end: new Date(),
    startHours: event.value.startHours,
    startMinutes: event.value.startMinutes,
    endHours: event.value.endHours,
    endMinutes: event.value.endMinutes,
  });
};

const saveEvent = async () => {
  if (!event.value.title || !event.value.location || !event.value.date || (!event.value.template_name && isTemplate.value)) {
    store.showAlert('Missing Fields', 'Please fill in all required fields.')
    return;
  }

  if (isTemplate.value) {
    if (store.templates.find(template => template.template_name === event.value.template_name)) {
      store.showAlert('Duplicate Template', 'A template with that name already exists.')
      return;
    }

    event.value.date = event.value.start;
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

  for (const slot of event.value.slots) {
    const start = new Date(event.value.date);
    start.setHours(slot.startHours, slot.startMinutes, 0, 0);

    const end = new Date(event.value.date);
    end.setHours(slot.endHours, slot.endMinutes, 0, 0);

    slot.start = start;
    slot.end = end;

    if (slot.start >= slot.end) {
      store.showAlert('Invalid Time', 'Chaperone end time must be after start time.');
      return; // Exits the parent function.
    }

    if (slot.end > event.value.end || slot.start < event.value.start) {
      store.showAlert('Invalid Time', 'Chaperone times must be within event times.');
      return;
    }

    if (!slot.title) {
      store.showAlert('Missing Group', 'Chaperone must have a group.');
      return;
    }
  }

  if (isTemplate.value) {
    if (await store.createNewTemplate(event.value)) {
      proxy.$router.push('/templates');
    }

  } else {
    if (await store.createNewEvent(event.value)) {
      proxy.$router.push(`/event/${event.value.id}`);
    }
  }
}

</script>