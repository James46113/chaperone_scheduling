// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const showAlertDialog = ref(false);
  const alertTitle = ref('');
  const alertMessage = ref('');
  const userEmail = ref('');
  const isAdmin = ref(false);
  const userID = ref();
  const tabView = ref(isMobile.value ? 'schedule' : 'calendar');
  const showCreateTermDialog = ref(false);

  const showAlert = (title: string, message: string) => {
    alertTitle.value = title;
    alertMessage.value = message;
    showAlertDialog.value = true;
  };

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

    data.forEach((event: any) => {
      event.start = new Date(event.start);
      event.end = new Date(event.end);
      event.date = new Date(event.start);
      event.dateString = event.date.toLocaleDateString('en-UK', {
        weekday: 'short', day: 'numeric',
        month: 'short', year: 'numeric'
      });
      event.isPastEvent = event.start < new Date();
      event.slots = computed(() => chaperoneSlots.value.filter((slot: any) => slot.event_id === event.id).sort((a: any, b: any) => a.start - b.start));
      event.available = computed(() => availability.value.filter((avail: any) => avail.event_id === event.id).map((avail: any) => avail.available)[0] ?? null);

      event.chaperones = computed(() => {
        const slots = chaperoneSlots.value.filter((slot: any) => slot.event_id === event.id)
        const chaperoneIDs = slots.map((slot: any) => slot.chaperone)
        const chaperoneNames = chaperones.value.filter((chaperone: any) => chaperoneIDs.includes(chaperone.id)).map((chaperone: any) => chaperone.name)
        return chaperoneNames
      });

      event.availability = computed(() => allAvailability.value.filter((avail: any) => avail.event_id === event.id));
    });
    events.value = data;
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
    data.forEach((slot: any) => {
      slot.start = new Date(slot.start);
      slot.end = new Date(slot.end);
    });
    chaperoneSlots.value = data;
  }

  const loadAvailability = async () => {
    console.log(`loading availability for ${userID.value}`)

    const response = await fetchAPI(`chaperones/availability/${userID.value}`, {
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

    data.forEach((template: any) => {
      template.start = new Date(template.start);
      template.end = new Date(template.end);
      template.template_slots = templateSlots.value.filter((slot: any) => slot.template_id === template.id);
    });
    templates.value = data;
  }

  const loadTemplateSlots = async () => {
    const response = await fetchAPI('templateSlots', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    data.forEach((slot: any) => {
      slot.start = new Date(slot.start);
      slot.end = new Date(slot.end);
    });
    templateSlots.value = data;
  }

  const getEvent = (id: number) => {
    return events.value.find((event: any) => event.id === id);
  }

  const getEventAvailability = (id: number) => {
    return availability.value.find((avail: any) => avail.event_id === id);
  }


  return {
    // GENERAL
    showAlertDialog,
    alertTitle,
    alertMessage,
    showAlert,
    userEmail,
    isAdmin,
    userID,
    tabView,
    showCreateTermDialog,

    // DATABASE
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
    loadTemplateSlots,
    getEvent,
    getEventAvailability,
  }
});
