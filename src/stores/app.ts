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

  // DATABASE

  const events = ref<any>([]);
  const upcomingEvents = computed(() => events.value.filter((event: any) => event.start > new Date()));
  const chaperones = ref<any[]>([]);
  const chaperoneNames = computed(() => chaperones.value.map((chaperone: any) => chaperone.name).sort());
  const chaperoneSlots = ref<any[]>([]);
  const availability = ref([]); // individual availability
  const allAvailability = ref<any[]>([]);
  const templates = ref([]);
  const templateSlots = ref([]);
  const templateNames = computed(() => templates.value.map((template: any) => ({ template_name: template.template_name, id: template.id })));

  const eventsLoaded = computed(() => events.value.length > 0);
  const chaperonesLoaded = computed(() => chaperones.value.length > 0);
  const chaperoneSlotsLoaded = computed(() => chaperoneSlots.value.length > 0);
  const availabilityLoaded = computed(() => availability.value.length > 0);
  const allAvailabilityLoaded = computed(() => allAvailability.value.length > 0);
  const templatesLoaded = computed(() => templates.value.length > 0);
  const templateSlotsLoaded = computed(() => templateSlots.value.length > 0);


  const loadEvents = async () => {
    const response = await fetchAPI('events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    events.value = formatEvents(data);
  };


  const formatEvents = (data: any) => {
    data.forEach((event: any) => {
      event.start = new Date(event.start);
      event.end = new Date(event.end);
      event.date = new Date(event.start);
      event.dateString = event.date.toLocaleDateString('en-UK', {
        weekday: 'short', day: 'numeric',
        month: 'short', year: 'numeric'
      });
      event.isPastEvent = computed(() => event.start < new Date());
      event.slots = computed(() => chaperoneSlots.value.filter((slot: any) => slot.event_id === event.id).sort((a: any, b: any) => a.start - b.start) ?? []);
      event.available = computed(() => availability.value.filter((avail: any) => avail.event_id === event.id).map((avail: any) => avail.available)[0] ?? null);

      event.chaperones = computed(() => {
        const slots = chaperoneSlots.value.filter((slot: any) => slot.event_id === event.id)
        const chaperoneIDs = slots.map((slot: any) => slot.chaperone)
        const chaperoneNames = chaperoneIDs.map((chaperoneID: any) => chaperones.value.filter((chaperone: any) => chaperone.id === chaperoneID).map((c: any) => c.name)[0] ?? null)
        // const chaperoneNames = chaperones.value.filter((chaperone: any) => chaperoneIDs.includes(chaperone.id)).map((chaperone: any) => chaperone.name)
        return chaperoneNames ?? []
      });

      event.availability = computed(() => allAvailability.value.filter((avail: any) => avail.event_id === event.id));
    });

    return data.sort((a: any, b: any) => a.start - b.start);
  }

  const loadChaperones = async () => {
    const response = await fetchAPI('chaperones', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    data.forEach((chaperone: any) => {
      chaperone.numEvents = computed(() => {
        const uniqueEventIDs = [...new Set(chaperoneSlots.value.filter((slot: any) => slot.chaperone === chaperone.id).map((slot: any) => slot.event_id))];
        return uniqueEventIDs.filter((eventID: any) => getEvent(eventID).start > new Date()).length;
      });
    });

    chaperones.value = data.sort((a: any, b: any) => a.name.localeCompare(b.name)).filter((chaperone: any) => chaperone.name !== 'Choir Phone');
  }

  const loadChaperoneSlots = async () => {
    const response = await fetchAPI('chaperone_slots', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    data.forEach((slot: any) => {
      slot.start = new Date(slot.start);
      slot.end = new Date(slot.end);
      slot.chaperoneName = computed(() => chaperones.value.filter((chaperone: any) => chaperone.id === slot.chaperone).map((c: any) => c.name)[0] ?? null);
    });
    chaperoneSlots.value = data;
  }

  const loadAvailability = async () => {
    const response = await fetchAPI(`chaperones/availability/${userID.value}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    availability.value = data.filter((avail: any) => avail.chaperone_id !== 10);
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
    const response = await fetchAPI('template_chaperone_slots', {
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

  const updateChaperoneSlot = async (slot: any) => {
    const response = await fetchAPI(`chaperone_slots/${slot.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slot),
    });
    if (!response.ok) {
      showAlert('Error', 'Failed to update chaperone slot');
      loadChaperoneSlots();
    }
  }

  const getEvent = (id: number) => {
    return events.value.find((event: any) => event.id == id);
  }

  const getEventAvailability = (id: number) => {
    return availability.value.find((avail: any) => avail.event_id == id);
  }

  const getEventsByChaperone = (chaperoneID: number) => {
    const slots = chaperoneSlots.value.filter((slot: any) => slot.chaperone == chaperoneID && slot.start > new Date());
    const uniqueEvents = [... new Set(slots.map((slot: any) => getEvent(slot.event_id)))].sort((a: any, b: any) => a.start - b.start);
    return uniqueEvents;
  }

  const deleteChaperone = async (id: number) => {
    chaperones.value = chaperones.value.filter((chaperone: any) => chaperone.id !== id);
    loadChaperones();
    loadChaperoneSlots();
  }

  const addChaperone = async (chaperone: any) => {
    chaperones.value.push(chaperone);
  }

  const nextEvent = (eventID: number) => {
    const event = getEvent(eventID);
    const eventIndex = events.value.indexOf(event);
    return events.value[eventIndex + 1].id;
  }

  const previousEvent = (eventID: number) => {
    const event = getEvent(eventID);
    const eventIndex = events.value.indexOf(event);
    return events.value[eventIndex - 1].id;
  }

  const isLastEvent = (eventID: number) => {

    return eventID === events.value[events.value.length - 1].id;
  }

  const isFirstEvent = (eventID: number) => {
    return eventID === upcomingEvents.value[0].id;
  }

  const getChaperone = (id: number) => {
    return chaperones.value.find((chaperone: any) => chaperone.id === id);
  }

  const loadDevEvents = () => {
    const data = [
      {
        "details": "Josh Stephens is taking the rehearsal",
        "end": "Fri, 14 Feb 2025 19:30:00 GMT",
        "id": 17,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Fri, 14 Feb 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": null,
        "end": "Sat, 15 Feb 2025 14:00:00 GMT",
        "id": 18,
        "lead_chaperone": null,
        "location": "St Matthew's Carver Street",
        "start": "Sat, 15 Feb 2025 11:45:00 GMT",
        "title": "Wedding"
      },
      {
        "details": "Normal Monday rehearsal\nGold and Silver Loose Change Challenge",
        "end": "Mon, 03 Mar 2025 18:00:00 GMT",
        "id": 30,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Mon, 03 Mar 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": "Normal Monday rehearsal\nBeing a Performer - Julie",
        "end": "Mon, 10 Mar 2025 18:00:00 GMT",
        "id": 31,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Mon, 10 Mar 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": "Normal Monday rehearsal\nSt Paul's Cathedral - Guest speaker, Tom Daggett - DoM at Sheffield Cathedral, formerly of St Paul's",
        "end": "Mon, 17 Mar 2025 18:00:00 GMT",
        "id": 32,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Mon, 17 Mar 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": "Normal Monday rehearsal",
        "end": "Mon, 24 Mar 2025 18:00:00 GMT",
        "id": 33,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Mon, 24 Mar 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": "Normal Friday rehearsal",
        "end": "Fri, 07 Mar 2025 19:30:00 GMT",
        "id": 34,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Fri, 07 Mar 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": "Normal Friday rehearsal",
        "end": "Fri, 14 Mar 2025 19:30:00 GMT",
        "id": 35,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Fri, 14 Mar 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": "Normal Friday rehearsal",
        "end": "Fri, 21 Mar 2025 19:30:00 GMT",
        "id": 36,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Fri, 21 Mar 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": "Normal Friday rehearsal",
        "end": "Fri, 28 Mar 2025 19:30:00 GMT",
        "id": 37,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Fri, 28 Mar 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": "No senior choristers' rehearsal",
        "end": "Mon, 24 Feb 2025 18:00:00 GMT",
        "id": 93,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Mon, 24 Feb 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": "Normal Friday rehearsal",
        "end": "Fri, 28 Feb 2025 19:30:00 GMT",
        "id": 94,
        "lead_chaperone": null,
        "location": "St John's Owlerton",
        "start": "Fri, 28 Feb 2025 16:30:00 GMT",
        "title": "Rehearsal"
      },
      {
        "details": "",
        "end": "Sun, 09 Mar 2025 17:00:00 GMT",
        "id": 96,
        "lead_chaperone": null,
        "location": "St Andrew's Psalter Lane",
        "start": "Sun, 09 Mar 2025 14:30:00 GMT",
        "title": "Evensong"
      },
      {
        "details": "14:00 - 15:30 Rehearsal\nBreak\n18:30 - 19:45 Concert",
        "end": "Sat, 15 Mar 2025 19:45:00 GMT",
        "id": 97,
        "lead_chaperone": null,
        "location": "Sheffield Cathedral",
        "start": "Sat, 15 Mar 2025 14:00:00 GMT",
        "title": "St Matthew Passion"
      },
      {
        "details": "Joint choirs event.",
        "end": "Sun, 23 Mar 2025 16:00:00 GMT",
        "id": 98,
        "lead_chaperone": null,
        "location": "St Marie's Cathedral",
        "start": "Sun, 23 Mar 2025 14:00:00 GMT",
        "title": "Classical Sheffield Concert"
      },
      {
        "details": "",
        "end": "Sat, 05 Apr 2025 22:00:00 GMT",
        "id": 99,
        "lead_chaperone": null,
        "location": "St Paul's Cathedral, London",
        "start": "Sat, 05 Apr 2025 07:00:00 GMT",
        "title": "Evensong"
      },
      {
        "details": "",
        "end": "Fri, 18 Apr 2025 18:00:00 GMT",
        "id": 100,
        "lead_chaperone": null,
        "location": "St Marie's Cathedral",
        "start": "Fri, 18 Apr 2025 15:00:00 GMT",
        "title": "Good Friday Service"
      },
      {
        "details": "",
        "end": "Sat, 01 Mar 2025 17:00:00 GMT",
        "id": 102,
        "lead_chaperone": null,
        "location": "St Mary's Ecclesfield",
        "start": "Sat, 01 Mar 2025 14:45:00 GMT",
        "title": "Wedding"
      }
    ]
    events.value = formatEvents(data);
  }

  const loadDevAvailability = () => {
    const data = [
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 17
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 17
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 17
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 17
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 18
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 18
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 18
      },
      {
        "available": null,
        "chaperone_id": 4,
        "event_id": 30
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 30
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 30
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 30
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 31
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 31
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 31
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 31
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 32
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 32
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 32
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 32
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 33
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 33
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 33
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 33
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 34
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 34
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 34
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 34
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 35
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 35
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 35
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 35
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 36
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 36
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 36
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 36
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 37
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 37
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 37
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 37
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 93
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 93
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 93
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 93
      },
      {
        "available": false,
        "chaperone_id": 4,
        "event_id": 94
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 94
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 94
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 94
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 96
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 96
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 96
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 96
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 97
      },
      {
        "available": false,
        "chaperone_id": 5,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 97
      },
      {
        "available": false,
        "chaperone_id": 8,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 97
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 97
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 98
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 98
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 98
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 98
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 99
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 99
      },
      {
        "available": false,
        "chaperone_id": 8,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 99
      },
      {
        "available": true,
        "chaperone_id": 23,
        "event_id": 99
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 99
      },
      {
        "available": true,
        "chaperone_id": 4,
        "event_id": 100
      },
      {
        "available": true,
        "chaperone_id": 5,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 100
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 100
      },
      {
        "available": null,
        "chaperone_id": 4,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 5,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 6,
        "event_id": 102
      },
      {
        "available": true,
        "chaperone_id": 8,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 10,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 11,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 12,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 13,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 14,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 15,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 16,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 17,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 18,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 19,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 20,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 21,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 22,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 23,
        "event_id": 102
      },
      {
        "available": null,
        "chaperone_id": 24,
        "event_id": 102
      }
    ]
    allAvailability.value = data.filter((avail: any) => avail.chaperone_id !== 10);
  }

  const loadDevChaperones = () => {
    const data = [
      {
        "email": "kdcaroe@gmail.com",
        "id": 4,
        "is_admin": true,
        "name": "Kate"
      },
      {
        "email": "jfdawson76@gmail.com",
        "id": 5,
        "is_admin": true,
        "name": "Jeremy"
      },
      {
        "email": "cwcaroe@gmail.com",
        "id": 6,
        "is_admin": false,
        "name": "Chris"
      },
      {
        "email": "jamescaroe@gmail.com",
        "id": 8,
        "is_admin": true,
        "name": "James"
      },
      {
        "email": "chaperones@steelcitychoristers.org.uk",
        "id": 10,
        "is_admin": false,
        "name": "Choir Phone"
      },
      {
        "email": "holmansupply@gmail.com",
        "id": 11,
        "is_admin": true,
        "name": "Angela"
      },
      {
        "email": "clarewallace24@gmail.com",
        "id": 12,
        "is_admin": false,
        "name": "Clare"
      },
      {
        "email": "violawillington@googlemail.com",
        "id": 13,
        "is_admin": false,
        "name": "David"
      },
      {
        "email": "eleanorjarvis2107@gmail.com",
        "id": 14,
        "is_admin": false,
        "name": "Eleanor"
      },
      {
        "email": "juliedoubleday@hotmail.co.uk",
        "id": 15,
        "is_admin": false,
        "name": "Julie"
      },
      {
        "email": "morris@alastairmorris.com",
        "id": 16,
        "is_admin": true,
        "name": "Alastair"
      },
      {
        "email": "anna@rozenberg.org",
        "id": 17,
        "is_admin": false,
        "name": "Anna"
      },
      {
        "email": "enrico.italy@hotmail.co.uk",
        "id": 18,
        "is_admin": false,
        "name": "Enrico"
      },
      {
        "email": "oconnell105@gmail.com",
        "id": 19,
        "is_admin": false,
        "name": "Gill"
      },
      {
        "email": "rachelamymorris@gmail.com",
        "id": 20,
        "is_admin": false,
        "name": "Rachel"
      },
      {
        "email": "rainymayer@gmail.com",
        "id": 21,
        "is_admin": false,
        "name": "Rayna"
      },
      {
        "email": "rebwong4083@gmail.com",
        "id": 22,
        "is_admin": false,
        "name": "Rebecca"
      },
      {
        "email": "tobiasgmayer@gmail.com",
        "id": 23,
        "is_admin": false,
        "name": "Toby"
      },
      {
        "email": "placeholder2@noemail.invalid",
        "id": 24,
        "is_admin": false,
        "name": "Jon"
      }
    ].filter((chaperone: any) => chaperone.name !== 'Choir Phone')
    data.forEach((chaperone: any) => {
      chaperone.numEvents = computed(() => {
        const uniqueEventIDs = [...new Set(chaperoneSlots.value.filter((slot: any) => slot.chaperone === chaperone.id).map((slot: any) => slot.event_id))];
        return uniqueEventIDs.filter((eventID: any) => getEvent(eventID).start > new Date()).length;
      });
    });
    chaperones.value = data;
  }

  const loadDevChaperoneSlots = () => {
    const data = [
      {
        "chaperone": 8,
        "details": null,
        "end": "Sat, 15 Feb 2025 14:00:00 GMT",
        "event_id": 18,
        "id": 261,
        "start": "Sat, 15 Feb 2025 11:45:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 5,
        "details": null,
        "end": "Sat, 15 Feb 2025 14:00:00 GMT",
        "event_id": 18,
        "id": 262,
        "start": "Sat, 15 Feb 2025 11:45:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 10,
        "details": null,
        "end": "Sat, 15 Feb 2025 14:00:00 GMT",
        "event_id": 18,
        "id": 263,
        "start": "Sat, 15 Feb 2025 11:45:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Fri, 14 Feb 2025 17:45:00 GMT",
        "event_id": 17,
        "id": 338,
        "start": "Fri, 14 Feb 2025 16:30:00 GMT",
        "title": "Singing Lessons"
      },
      {
        "chaperone": 6,
        "details": null,
        "end": "Fri, 14 Feb 2025 17:30:00 GMT",
        "event_id": 17,
        "id": 339,
        "start": "Fri, 14 Feb 2025 16:30:00 GMT",
        "title": "Changing Voices' Rehearsal"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Fri, 14 Feb 2025 19:00:00 GMT",
        "event_id": 17,
        "id": 340,
        "start": "Fri, 14 Feb 2025 18:30:00 GMT",
        "title": "Senior Choristers with Clerks"
      },
      {
        "chaperone": 8,
        "details": null,
        "end": "Fri, 14 Feb 2025 18:30:00 GMT",
        "event_id": 17,
        "id": 341,
        "start": "Fri, 14 Feb 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 5,
        "details": null,
        "end": "Mon, 03 Mar 2025 17:30:00 GMT",
        "event_id": 30,
        "id": 348,
        "start": "Mon, 03 Mar 2025 16:30:00 GMT",
        "title": "Juniors' Rehearsal"
      },
      {
        "chaperone": 23,
        "details": null,
        "end": "Mon, 03 Mar 2025 17:10:00 GMT",
        "event_id": 30,
        "id": 349,
        "start": "Mon, 03 Mar 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 23,
        "details": null,
        "end": "Mon, 03 Mar 2025 18:00:00 GMT",
        "event_id": 30,
        "id": 350,
        "start": "Mon, 03 Mar 2025 17:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 11,
        "details": "",
        "end": "Mon, 03 Mar 2025 18:00:00 GMT",
        "event_id": 30,
        "id": 351,
        "start": "Mon, 03 Mar 2025 16:30:00 GMT",
        "title": "Singing lessons"
      },
      {
        "chaperone": 22,
        "details": null,
        "end": "Mon, 03 Mar 2025 18:00:00 GMT",
        "event_id": 30,
        "id": 352,
        "start": "Mon, 03 Mar 2025 17:30:00 GMT",
        "title": "Juniors' Youth Work"
      },
      {
        "chaperone": 8,
        "details": null,
        "end": "Mon, 03 Mar 2025 18:00:00 GMT",
        "event_id": 30,
        "id": 353,
        "start": "Mon, 03 Mar 2025 17:30:00 GMT",
        "title": "Senior Choristers' Rehearsal"
      },
      {
        "chaperone": 23,
        "details": null,
        "end": "Mon, 03 Mar 2025 17:30:00 GMT",
        "event_id": 30,
        "id": 354,
        "start": "Mon, 03 Mar 2025 17:10:00 GMT",
        "title": "Choristers' Youth Work"
      },
      {
        "chaperone": 17,
        "details": null,
        "end": "Mon, 17 Mar 2025 17:10:00 GMT",
        "event_id": 32,
        "id": 376,
        "start": "Mon, 17 Mar 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 5,
        "details": null,
        "end": "Mon, 17 Mar 2025 17:30:00 GMT",
        "event_id": 32,
        "id": 377,
        "start": "Mon, 17 Mar 2025 16:30:00 GMT",
        "title": "Juniors' Rehearsal"
      },
      {
        "chaperone": 23,
        "details": null,
        "end": "Mon, 17 Mar 2025 18:00:00 GMT",
        "event_id": 32,
        "id": 378,
        "start": "Mon, 17 Mar 2025 16:30:00 GMT",
        "title": "Singing Lessons"
      },
      {
        "chaperone": 17,
        "details": null,
        "end": "Mon, 17 Mar 2025 18:00:00 GMT",
        "event_id": 32,
        "id": 379,
        "start": "Mon, 17 Mar 2025 17:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 17,
        "details": null,
        "end": "Mon, 17 Mar 2025 17:30:00 GMT",
        "event_id": 32,
        "id": 380,
        "start": "Mon, 17 Mar 2025 17:10:00 GMT",
        "title": "Choristers' Youth Work"
      },
      {
        "chaperone": 8,
        "details": null,
        "end": "Mon, 17 Mar 2025 18:00:00 GMT",
        "event_id": 32,
        "id": 381,
        "start": "Mon, 17 Mar 2025 17:30:00 GMT",
        "title": "Senior Choristers' Rehearsal"
      },
      {
        "chaperone": 22,
        "details": null,
        "end": "Mon, 17 Mar 2025 18:00:00 GMT",
        "event_id": 32,
        "id": 382,
        "start": "Mon, 17 Mar 2025 17:30:00 GMT",
        "title": "Juniors' Youth Work"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Fri, 14 Mar 2025 17:45:00 GMT",
        "event_id": 35,
        "id": 398,
        "start": "Fri, 14 Mar 2025 16:30:00 GMT",
        "title": "Singing Lessons"
      },
      {
        "chaperone": 6,
        "details": null,
        "end": "Fri, 14 Mar 2025 17:30:00 GMT",
        "event_id": 35,
        "id": 399,
        "start": "Fri, 14 Mar 2025 16:30:00 GMT",
        "title": "Changing Voices' Rehearsal"
      },
      {
        "chaperone": 11,
        "details": null,
        "end": "Fri, 14 Mar 2025 18:30:00 GMT",
        "event_id": 35,
        "id": 400,
        "start": "Fri, 14 Mar 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Fri, 14 Mar 2025 19:00:00 GMT",
        "event_id": 35,
        "id": 401,
        "start": "Fri, 14 Mar 2025 18:30:00 GMT",
        "title": "Senior Choristers with Clerks"
      },
      {
        "chaperone": 11,
        "details": null,
        "end": "Fri, 21 Mar 2025 18:30:00 GMT",
        "event_id": 36,
        "id": 402,
        "start": "Fri, 21 Mar 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Fri, 21 Mar 2025 19:00:00 GMT",
        "event_id": 36,
        "id": 403,
        "start": "Fri, 21 Mar 2025 18:30:00 GMT",
        "title": "Senior Choristers with Clerks"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Fri, 21 Mar 2025 17:45:00 GMT",
        "event_id": 36,
        "id": 404,
        "start": "Fri, 21 Mar 2025 16:30:00 GMT",
        "title": "Singing Lessons"
      },
      {
        "chaperone": 6,
        "details": null,
        "end": "Fri, 21 Mar 2025 17:30:00 GMT",
        "event_id": 36,
        "id": 405,
        "start": "Fri, 21 Mar 2025 16:30:00 GMT",
        "title": "Changing Voices' Rehearsal"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Fri, 28 Mar 2025 17:45:00 GMT",
        "event_id": 37,
        "id": 406,
        "start": "Fri, 28 Mar 2025 16:30:00 GMT",
        "title": "Singing Lessons"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Fri, 28 Mar 2025 19:00:00 GMT",
        "event_id": 37,
        "id": 407,
        "start": "Fri, 28 Mar 2025 18:30:00 GMT",
        "title": "Senior Choristers with Clerks"
      },
      {
        "chaperone": 6,
        "details": null,
        "end": "Fri, 28 Mar 2025 17:30:00 GMT",
        "event_id": 37,
        "id": 408,
        "start": "Fri, 28 Mar 2025 16:30:00 GMT",
        "title": "Changing Voices' Rehearsal"
      },
      {
        "chaperone": 19,
        "details": null,
        "end": "Fri, 28 Mar 2025 18:30:00 GMT",
        "event_id": 37,
        "id": 409,
        "start": "Fri, 28 Mar 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 11,
        "details": "",
        "end": "Sun, 09 Mar 2025 17:00:00 GMT",
        "event_id": 96,
        "id": 420,
        "start": "Sun, 09 Mar 2025 14:30:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 16,
        "details": "",
        "end": "Sun, 09 Mar 2025 17:00:00 GMT",
        "event_id": 96,
        "id": 421,
        "start": "Sun, 09 Mar 2025 14:30:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 24,
        "details": "",
        "end": "Sun, 09 Mar 2025 17:00:00 GMT",
        "event_id": 96,
        "id": 422,
        "start": "Sun, 09 Mar 2025 14:30:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 17,
        "details": "",
        "end": "Sun, 23 Mar 2025 16:00:00 GMT",
        "event_id": 98,
        "id": 425,
        "start": "Sun, 23 Mar 2025 14:00:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 18,
        "details": "",
        "end": "Sun, 23 Mar 2025 16:00:00 GMT",
        "event_id": 98,
        "id": 426,
        "start": "Sun, 23 Mar 2025 14:00:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 17,
        "details": "",
        "end": "Fri, 18 Apr 2025 18:00:00 GMT",
        "event_id": 100,
        "id": 427,
        "start": "Fri, 18 Apr 2025 15:00:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 11,
        "details": "",
        "end": "Fri, 18 Apr 2025 18:00:00 GMT",
        "event_id": 100,
        "id": 428,
        "start": "Fri, 18 Apr 2025 15:00:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 23,
        "details": null,
        "end": "Mon, 24 Feb 2025 18:00:00 GMT",
        "event_id": 93,
        "id": 429,
        "start": "Mon, 24 Feb 2025 16:30:00 GMT",
        "title": "Singing Lessons"
      },
      {
        "chaperone": 17,
        "details": null,
        "end": "Mon, 24 Feb 2025 17:10:00 GMT",
        "event_id": 93,
        "id": 430,
        "start": "Mon, 24 Feb 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 5,
        "details": null,
        "end": "Mon, 24 Feb 2025 17:30:00 GMT",
        "event_id": 93,
        "id": 431,
        "start": "Mon, 24 Feb 2025 16:30:00 GMT",
        "title": "Juniors' Rehearsal"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Mon, 24 Feb 2025 17:30:00 GMT",
        "event_id": 93,
        "id": 432,
        "start": "Mon, 24 Feb 2025 17:10:00 GMT",
        "title": "Choristers' Youth Work"
      },
      {
        "chaperone": 5,
        "details": null,
        "end": "Mon, 24 Feb 2025 18:00:00 GMT",
        "event_id": 93,
        "id": 433,
        "start": "Mon, 24 Feb 2025 17:30:00 GMT",
        "title": "Juniors' Youth Work"
      },
      {
        "chaperone": 17,
        "details": null,
        "end": "Mon, 24 Feb 2025 18:00:00 GMT",
        "event_id": 93,
        "id": 434,
        "start": "Mon, 24 Feb 2025 17:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 18,
        "details": "",
        "end": "Sat, 01 Mar 2025 17:00:00 GMT",
        "event_id": 102,
        "id": 435,
        "start": "Sat, 01 Mar 2025 14:45:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 15,
        "details": "",
        "end": "Sat, 01 Mar 2025 17:00:00 GMT",
        "event_id": 102,
        "id": 436,
        "start": "Sat, 01 Mar 2025 14:45:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 8,
        "details": null,
        "end": "Fri, 28 Feb 2025 17:30:00 GMT",
        "event_id": 94,
        "id": 447,
        "start": "Fri, 28 Feb 2025 16:30:00 GMT",
        "title": "Changing Voices' Rehearsal"
      },
      {
        "chaperone": 15,
        "details": null,
        "end": "Fri, 28 Feb 2025 18:30:00 GMT",
        "event_id": 94,
        "id": 448,
        "start": "Fri, 28 Feb 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 13,
        "details": null,
        "end": "Fri, 28 Feb 2025 17:45:00 GMT",
        "event_id": 94,
        "id": 449,
        "start": "Fri, 28 Feb 2025 16:30:00 GMT",
        "title": "Singing Lessons"
      },
      {
        "chaperone": 5,
        "details": null,
        "end": "Fri, 28 Feb 2025 19:00:00 GMT",
        "event_id": 94,
        "id": 450,
        "start": "Fri, 28 Feb 2025 18:30:00 GMT",
        "title": "Senior Choristers with Clerks"
      },
      {
        "chaperone": 16,
        "details": null,
        "end": "Mon, 24 Mar 2025 18:00:00 GMT",
        "event_id": 33,
        "id": 451,
        "start": "Mon, 24 Mar 2025 16:30:00 GMT",
        "title": "Singing Lessons"
      },
      {
        "chaperone": 5,
        "details": null,
        "end": "Mon, 24 Mar 2025 17:30:00 GMT",
        "event_id": 33,
        "id": 452,
        "start": "Mon, 24 Mar 2025 16:30:00 GMT",
        "title": "Juniors' Rehearsal"
      },
      {
        "chaperone": 11,
        "details": null,
        "end": "Mon, 24 Mar 2025 17:10:00 GMT",
        "event_id": 33,
        "id": 453,
        "start": "Mon, 24 Mar 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 11,
        "details": null,
        "end": "Mon, 24 Mar 2025 17:30:00 GMT",
        "event_id": 33,
        "id": 454,
        "start": "Mon, 24 Mar 2025 17:10:00 GMT",
        "title": "Choristers' Youth Work"
      },
      {
        "chaperone": 11,
        "details": null,
        "end": "Mon, 24 Mar 2025 18:00:00 GMT",
        "event_id": 33,
        "id": 455,
        "start": "Mon, 24 Mar 2025 17:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 22,
        "details": null,
        "end": "Mon, 24 Mar 2025 18:00:00 GMT",
        "event_id": 33,
        "id": 456,
        "start": "Mon, 24 Mar 2025 17:30:00 GMT",
        "title": "Juniors' Youth Work"
      },
      {
        "chaperone": 8,
        "details": null,
        "end": "Mon, 24 Mar 2025 18:00:00 GMT",
        "event_id": 33,
        "id": 457,
        "start": "Mon, 24 Mar 2025 17:30:00 GMT",
        "title": "Senior Choristers' Rehearsal"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Fri, 07 Mar 2025 17:45:00 GMT",
        "event_id": 34,
        "id": 465,
        "start": "Fri, 07 Mar 2025 16:30:00 GMT",
        "title": "Singing Lessons"
      },
      {
        "chaperone": 6,
        "details": null,
        "end": "Fri, 07 Mar 2025 17:30:00 GMT",
        "event_id": 34,
        "id": 466,
        "start": "Fri, 07 Mar 2025 16:30:00 GMT",
        "title": "Changing Voices' Rehearsal"
      },
      {
        "chaperone": null,
        "details": null,
        "end": "Fri, 07 Mar 2025 18:30:00 GMT",
        "event_id": 34,
        "id": 467,
        "start": "Fri, 07 Mar 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 4,
        "details": null,
        "end": "Fri, 07 Mar 2025 19:00:00 GMT",
        "event_id": 34,
        "id": 468,
        "start": "Fri, 07 Mar 2025 18:30:00 GMT",
        "title": "Senior Choristers with Clerks"
      },
      {
        "chaperone": 12,
        "details": null,
        "end": "Mon, 10 Mar 2025 18:00:00 GMT",
        "event_id": 31,
        "id": 473,
        "start": "Mon, 10 Mar 2025 16:30:00 GMT",
        "title": "Singing Lessons"
      },
      {
        "chaperone": 21,
        "details": null,
        "end": "Mon, 10 Mar 2025 17:10:00 GMT",
        "event_id": 31,
        "id": 474,
        "start": "Mon, 10 Mar 2025 16:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 5,
        "details": null,
        "end": "Mon, 10 Mar 2025 17:30:00 GMT",
        "event_id": 31,
        "id": 475,
        "start": "Mon, 10 Mar 2025 16:30:00 GMT",
        "title": "Juniors' Rehearsal"
      },
      {
        "chaperone": 21,
        "details": null,
        "end": "Mon, 10 Mar 2025 17:30:00 GMT",
        "event_id": 31,
        "id": 476,
        "start": "Mon, 10 Mar 2025 17:10:00 GMT",
        "title": "Choristers' Youth Work"
      },
      {
        "chaperone": 22,
        "details": null,
        "end": "Mon, 10 Mar 2025 18:00:00 GMT",
        "event_id": 31,
        "id": 477,
        "start": "Mon, 10 Mar 2025 17:30:00 GMT",
        "title": "Juniors' Youth Work"
      },
      {
        "chaperone": 21,
        "details": null,
        "end": "Mon, 10 Mar 2025 18:00:00 GMT",
        "event_id": 31,
        "id": 478,
        "start": "Mon, 10 Mar 2025 17:30:00 GMT",
        "title": "Choristers' Rehearsal"
      },
      {
        "chaperone": 8,
        "details": null,
        "end": "Mon, 10 Mar 2025 18:00:00 GMT",
        "event_id": 31,
        "id": 479,
        "start": "Mon, 10 Mar 2025 17:30:00 GMT",
        "title": "Senior Choristers' Rehearsal"
      },
      {
        "chaperone": 11,
        "details": "",
        "end": "Sat, 15 Mar 2025 19:45:00 GMT",
        "event_id": 97,
        "id": 480,
        "start": "Sat, 15 Mar 2025 14:00:00 GMT",
        "title": "Choristers"
      },
      {
        "chaperone": 18,
        "details": "",
        "end": "Sat, 15 Mar 2025 19:45:00 GMT",
        "event_id": 97,
        "id": 481,
        "start": "Sat, 15 Mar 2025 14:00:00 GMT",
        "title": "Choristers"
      }
    ]
    data.forEach((slot: any) => {
      slot.start = new Date(slot.start);
      slot.end = new Date(slot.end);
      slot.chaperoneName = computed(() => chaperones.value.filter((chaperone: any) => chaperone.id === slot.chaperone).map((c: any) => c.name)[0] ?? null);
    });
    chaperoneSlots.value = data;
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
    chaperoneNames,
    availability,
    templates,
    templateSlots,
    templateNames,
    allAvailability,
    eventsLoaded,
    chaperonesLoaded,
    chaperoneSlotsLoaded,
    availabilityLoaded,
    allAvailabilityLoaded,
    templatesLoaded,
    templateSlotsLoaded,
    loadEvents,
    loadChaperones,
    loadChaperoneSlots,
    loadAvailability,
    loadAllAvailability,
    loadTemplates,
    loadTemplateSlots,
    getEvent,
    getEventAvailability,
    getEventsByChaperone,
    deleteChaperone,
    addChaperone,
    nextEvent,
    previousEvent,
    isLastEvent,
    isFirstEvent,
    getChaperone,
    updateChaperoneSlot,

    // DEV
    loadDevEvents,
    loadDevAvailability,
    loadDevChaperones,
    loadDevChaperoneSlots,
  }
});
