// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const showAlertDialog = ref(false);
  const alertTitle = ref('');
  const alertMessage = ref('');
  const userEmail = ref('');
  const isAdmin = ref(false);
  const userID = ref(null);
  const tabView = ref(isMobile.value ? 'schedule' : 'calendar');
  const showCreateTermDialog = ref(false);

  const showAlert = (title: string, message: string) => {
    alertTitle.value = title;
    alertMessage.value = message;
    showAlertDialog.value = true;
  };

  return {
    showAlertDialog,
    alertTitle,
    alertMessage,
    showAlert,
    userEmail,
    isAdmin,
    userID,
    tabView,
    showCreateTermDialog
  }
})


export const useDatabaseStore = defineStore('database', () => {
  const events = ref([]);
  const upcomingEvents = computed(() => events.value.filter((event: any) => event.start > new Date()));
  const chaperones = ref([]);
  const chaperoneSlots = ref([]);
  const availability = ref([]); // individual availability
  const allAvailability = ref([]);
  const templates = ref([]);
  const templateSlots = ref([]);
  const templateNames = computed(() => templates.value.map((template: any) => ({ template_name: template.template_name, id: template.id })));

  const loadEvents = async () => {
    const response = await fetchAPI('events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    events.value = data.map((event: any) => {
      event.start = new Date(event.start);
      event.end = new Date(event.end);
      event.date = new Date(event.start);
      event.slots = computed(() => chaperoneSlots.value.filter((slot: any) => slot.event_id === event.id));
      event.available = computed(() => availability.value.filter((avail: any) => avail.event_id === event.id).map((avail: any) => avail.availabile));

      event.chaperones = computed(() => {
        const slots = chaperoneSlots.value.filter((slot: any) => slot.event_id === event.id)
        const chaperoneIDs = slots.map((slot: any) => slot.chaperone)
        const chaperoneNames = chaperones.value.filter((chaperone: any) => chaperoneIDs.includes(chaperone.id)).map((chaperone: any) => chaperone.name)
        return chaperoneNames
      });

      event.availability = computed(() => allAvailability.value.filter((avail: any) => avail.event_id === event.id));
    });
    console.log(JSON.stringify(events.value)
    )
  };

  const loadChaperones = async () => {
    const response = await fetchAPI('chaperones', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    chaperones.value = data;
  }

  const loadChaperoneSlots = async () => {
    const response = await fetchAPI('chaperoneSlots', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    chaperoneSlots.value = data.map((slot: any) => {
      slot.start = new Date(slot.start);
      slot.end = new Date(slot.end);
    });
  }

  const loadAvailability = async () => {
    const response = await fetchAPI(`chaperones/availability/${useAppStore().userID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    availability.value = data;
  }

  const loadAllAvailability = async () => {
    const response = await fetchAPI(`chaperones/availability`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    allAvailability.value = data;
  }

  const loadTemplates = async () => {
    const response = await fetchAPI('templates', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();

    templates.value = data.map((template: any) => {
      template.start = new Date(template.start);
      template.end = new Date(template.end);
      template.template_slots = templateSlots.value.filter((slot: any) => slot.template_id === template.id);
    });
  }

  const loadTemplateSlots = async () => {
    const response = await fetchAPI('templateSlots', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    templateSlots.value = data.map((slot: any) => {
      slot.start = new Date(slot.start);
      slot.end = new Date(slot.end);
    });
  }


  return {
    events,
    upcomingEvents,
    chaperoneSlots,
    chaperones,
    availability,
    templates,
    templateSlots,
    templateNames,
    loadEvents,
    loadChaperones,
    loadChaperoneSlots,
    loadAvailability,
    loadAllAvailability,
    loadTemplates,
    loadTemplateSlots
  }
});
