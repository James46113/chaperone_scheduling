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
  const upcomingEvents = computed(() => events.value.filter((event: any) => event.end > new Date()));
  const chaperones = ref<any[]>([]);
  const chaperoneNames = computed(() => chaperones.value.map((chaperone: any) => chaperone.name).sort());
  const chaperoneSlots = ref<any[]>([]);
  const availability = ref<any[]>([]); // individual availability
  const allAvailability = ref<any[]>([]);
  const templates = ref<any[]>([]);
  const templateSlots = ref<any[]>([]);
  const templateNames = computed(() => templates.value.map((template: any) => ({ template_name: template.template_name, id: template.id })));

  const eventsLoaded = computed(() => events.value.length > 1);
  const chaperonesLoaded = computed(() => chaperones.value.length > 0);
  const chaperoneSlotsLoaded = computed(() => chaperoneSlots.value.length > 0);
  const availabilityLoaded = computed(() => availability.value.length > 0);
  const allAvailabilityLoaded = computed(() => allAvailability.value.length > 0);
  const templatesLoaded = computed(() => templates.value.length > 0);
  const templateSlotsLoaded = computed(() => templateSlots.value.length > 0);

  const eventsLocked = ref(false);

  const lockEvents = () => {
    eventsLocked.value = true;
  }

  const unlockEvents = () => {
    eventsLocked.value = false;
  }

  const loadEvents = async () => {
    const eventsLastUpdated = localStorage.getItem('eventsLastUpdated');
    let data: any[] = [];

    if (!offline.value) {
      console.log("fetched events")
      const response = await fetchAPI('events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': eventsLastUpdated ?? '',
        },
      });
      data = await response.json();
    }

    if (eventsLastUpdated) {
      const storedEvents = localStorage.getItem('events');
      if (storedEvents) {
        const parsedStoredEvents = JSON.parse(storedEvents!);
        parsedStoredEvents.forEach((storedEvent: any, index: number) => {
          const incomingModifiedEvent = data.find((event: any) => event.id == storedEvent.id);
          if (incomingModifiedEvent) {
            parsedStoredEvents[index] = { ...incomingModifiedEvent };
          }
        });
        data = parsedStoredEvents;
        console.log("loaded from stored events");
      }
    }

    if (eventsLocked.value) return;
    localStorage.setItem('events', JSON.stringify(data));
    localStorage.setItem('eventsLastUpdated', Math.floor(new Date().getTime() / 1000).toString());
    const formattedEvents = formatEvents(data);
    events.value = formattedEvents;
  };

  const loadEvent = async (id: number) => {
    const response = await fetchAPI(`events/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const event = formatEvents([data])[0];
    if (eventsLocked.value) return;

    const index = events.value.findIndex((e: any) => e.id === event.id);

    if (index === -1) {
      console.log("not found")
      events.value.push(event);
    }
    else events.value[index] = event;

  }

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

      event.rawAvailability = computed(() => allAvailability.value.filter((avail: any) => avail.event_id === event.id));

      event.availableChaperones = computed(() => {
        const avail = event.rawAvailability.value.filter((avail: any) => avail.available === true);
        return avail.map((avail: any) => chaperones.value.filter((chaperone: any) => chaperone.id === avail.chaperone_id).map((c: any) => c.name)[0] ?? null).sort();
      })

      event.unavailableChaperones = computed(() => {
        const avail = event.rawAvailability.value.filter((avail: any) => avail.available === false);
        return avail.map((avail: any) => chaperones.value.filter((chaperone: any) => chaperone.id === avail.chaperone_id).map((c: any) => c.name)[0] ?? null).sort();
      })

      event.unansweredChaperones = computed(() => {
        const avail = event.rawAvailability.value.filter((avail: any) => avail.available === null);
        return avail.map((avail: any) => chaperones.value.filter((chaperone: any) => chaperone.id === avail.chaperone_id).map((c: any) => c.name)[0] ?? null).sort();
      })

      event.availability = computed(() => {
        const available = event.rawAvailability.value.filter((avail: any) => avail.available === true).sort((a: any, b: any) => a.chaperoneName.localeCompare(b.chaperoneName));
        const unavailable = event.rawAvailability.value.filter((avail: any) => avail.available === false).sort((a: any, b: any) => a.chaperoneName.localeCompare(b.chaperoneName));
        const unanswered = event.rawAvailability.value.filter((avail: any) => avail.available === null).sort((a: any, b: any) => a.chaperoneName.localeCompare(b.chaperoneName));
        return [...available, ...unavailable, ...unanswered];
      })
    });

    return data.sort((a: any, b: any) => a.start - b.start);
  }

  const loadChaperones = async () => {
    const chaperonesLastUpdated = localStorage.getItem('chaperonesLastUpdated');
    let data: any[] = [];

    if (!offline.value) {
      const response = await fetchAPI('chaperones', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': chaperonesLastUpdated ?? '',
        },
      });
      data = await response.json();
    }

    if (chaperonesLastUpdated) {
      const storedChaperones = localStorage.getItem('chaperones');
      if (storedChaperones) {
        const parsedStoredChaperones = JSON.parse(storedChaperones!);
        parsedStoredChaperones.forEach((storedChaperone: any, index: number) => {
          const incomingModifiedChaperone = data.find((chaperone: any) => chaperone.id == storedChaperone.id);
          if (incomingModifiedChaperone) {
            parsedStoredChaperones[index] = { ...incomingModifiedChaperone };
          }
        });
        data = parsedStoredChaperones;
        console.log("loaded from stored chaperones");
      }
    }

    localStorage.setItem('chaperones', JSON.stringify(data));
    localStorage.setItem('chaperonesLastUpdated', Math.floor(new Date().getTime() / 1000).toString());

    data.forEach((chaperone: any) => {
      chaperone.numEvents = computed(() => {
        const uniqueEventIDs = [...new Set(chaperoneSlots.value.filter((slot: any) => slot.chaperone === chaperone.id).map((slot: any) => slot.event_id))];
        return uniqueEventIDs.filter((eventID: any) => getEvent(eventID).start > new Date()).length;
      });
    });

    chaperones.value = data.sort((a: any, b: any) => a.name.localeCompare(b.name)).filter((chaperone: any) => chaperone.name !== 'Choir Phone');
  }

  const loadChaperoneSlots = async () => {
    const lastUpdated = localStorage.getItem('chaperoneSlotsLastUpdated');
    let data: any[] = [];

    if (!offline.value) {
      const response = await fetchAPI('chaperone_slots', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': lastUpdated ?? '',
        },
      });

      data = await response.json();
    }

    if (lastUpdated) {
      const storedSlots = localStorage.getItem('chaperoneSlots');
      if (storedSlots) {
        const parsedStoredSlots = JSON.parse(storedSlots);
        parsedStoredSlots.forEach((storedSlot: any, index: number) => {
          const incomingModifiedSlot = data.find((slot: any) => slot.id == storedSlot.id);
          if (incomingModifiedSlot) {
            parsedStoredSlots[index] = { ...incomingModifiedSlot };
          }
        });
        data = parsedStoredSlots;
        console.log("loaded from stored slots");
      }
    }
    if (eventsLocked.value) return;

    localStorage.setItem('chaperoneSlots', JSON.stringify(data));
    localStorage.setItem('chaperoneSlotsLastUpdated', Math.floor(new Date().getTime() / 1000).toString());

    data.forEach((slot: any) => {
      slot.start = new Date(slot.start);
      slot.end = new Date(slot.end);
      slot.chaperoneName = computed(() => chaperones.value.filter((chaperone: any) => chaperone.id === slot.chaperone).map((c: any) => c.name)[0] ?? null);
      slot.setChaperone = (id: number) => slot.chaperone = id;
    });
    chaperoneSlots.value = data;
  }

  const loadEventChaperoneSlots = async (eventID: number) => {
    const response = await fetchAPI(`chaperone_slots/${eventID}`, {
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
    if (eventsLocked.value) return;

    data.forEach((slot: any) => {
      const index = chaperoneSlots.value.findIndex((s: any) => s.id === slot.id);
      if (index === -1) chaperoneSlots.value.push(slot);
      else chaperoneSlots.value[index] = slot;
    })
  }

  const loadAvailability = async () => {
    const lastUpdated = localStorage.getItem('availabilityLastUpdated');

    let data: any[] = [];

    if (!offline.value) {

      const response = await fetchAPI(`chaperones/availability/${userID.value}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': lastUpdated ?? '',
        },
      });

      data = await response.json();
    }

    if (lastUpdated) {
      const storedAvailability = localStorage.getItem('availability');
      if (storedAvailability) {
        const parsedStoredAvailability = JSON.parse(storedAvailability);
        parsedStoredAvailability.forEach((storedAvail: any, index: number) => {
          const incomingModifiedAvail = data.find((avail: any) => avail.id == storedAvail.id);
          if (incomingModifiedAvail) {
            parsedStoredAvailability[index] = { ...incomingModifiedAvail };
          }
        });
        data = parsedStoredAvailability;
        console.log("loaded from stored availability");
      }
    }

    localStorage.setItem('availability', JSON.stringify(data));
    localStorage.setItem('availabilityLastUpdated', Math.floor(new Date().getTime() / 1000).toString());

    availability.value = data.filter((avail: any) => avail.chaperone_id !== 0);
  }

  const loadAllAvailability = async () => {
    const lastUpdated = localStorage.getItem('allAvailabilityLastUpdated');

    let data: any[] = [];

    if (!offline.value) {

      const response = await fetchAPI(`chaperones/availability`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': lastUpdated ?? '',
        },
      });

      data = await response.json();
    }

    if (lastUpdated) {
      const storedAvailability = localStorage.getItem('allAvailability');
      if (storedAvailability) {
        const parsedStoredAvailability = JSON.parse(storedAvailability);
        parsedStoredAvailability.forEach((storedAvail: any, index: number) => {
          const incomingModifiedAvail = data.find((avail: any) => avail.id == storedAvail.id);
          if (incomingModifiedAvail) {
            parsedStoredAvailability[index] = { ...incomingModifiedAvail };
          }
        });
        data = parsedStoredAvailability;
        console.log("loaded from stored availability");
      }
    }

    localStorage.setItem('allAvailability', JSON.stringify(data));
    localStorage.setItem('allAvailabilityLastUpdated', Math.floor(new Date().getTime() / 1000).toString());

    data.forEach((avail: any) => {
      avail.chaperoneName = computed(() => chaperones.value.filter((chaperone: any) => chaperone.id === avail.chaperone_id).map((c: any) => c.name
      )[0] ?? null);
    });
    allAvailability.value = data.filter((avail: any) => avail.chaperone_id != 0);
  }

  const loadTemplates = async () => {
    const templatesLastUpdated = localStorage.getItem('templatesLastUpdated');

    let data: any[] = [];
    if (!offline.value) {

      const response = await fetchAPI('templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': templatesLastUpdated ?? '',
        },
      });
      data = await response.json();
    }

    if (templatesLastUpdated) {
      const storedTemplates = localStorage.getItem('templates');
      if (storedTemplates) {
        const parsedStoredTemplates = JSON.parse(storedTemplates);
        parsedStoredTemplates.forEach((storedTemplate: any, index: number) => {
          const incomingModifiedTemplate = data.find((template: any) => template.id == storedTemplate.id);
          if (incomingModifiedTemplate) {
            parsedStoredTemplates[index] = { ...incomingModifiedTemplate };
          }
        });
        data = parsedStoredTemplates;
        console.log("loaded from stored templates");
      }
    }

    localStorage.setItem('templates', JSON.stringify(data));
    localStorage.setItem('templatesLastUpdated', Math.floor(new Date().getTime() / 1000).toString());

    data.forEach((template: any) => {
      template.start = new Date(template.start);
      template.end = new Date(template.end);
      template.slots = computed(() => templateSlots.value.filter((slot: any) => slot.template_id === template.id));
    });
    templates.value = data;
  }

  const loadTemplateSlots = async () => {
    const lastUpdated = localStorage.getItem('templateSlotsLastUpdated');

    let data: any[] = [];
    if (!offline.value) {
      const response = await fetchAPI('template_chaperone_slots', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': lastUpdated ?? '',
        },
      });
      data = await response.json();
    }

    if (lastUpdated) {
      const storedSlots = localStorage.getItem('templateSlots');
      if (storedSlots) {
        const parsedStoredSlots = JSON.parse(storedSlots);
        parsedStoredSlots.forEach((storedSlot: any, index: number) => {
          const incomingModifiedSlot = data.find((slot: any) => slot.id == storedSlot.id);
          if (incomingModifiedSlot) {
            parsedStoredSlots[index] = { ...incomingModifiedSlot };
          }
        });
        data = parsedStoredSlots;
        console.log("loaded from stored slots");
      }
    }

    localStorage.setItem('templateSlots', JSON.stringify(data));
    localStorage.setItem('templateSlotsLastUpdated', Math.floor(new Date().getTime() / 1000).toString());

    data.forEach((slot: any) => {
      slot.start = new Date(slot.start);
      slot.end = new Date(slot.end);
    });
    templateSlots.value = data;
  }

  const getTemplate = (id: number) => {
    return templates.value.find((template: any) => template.id == id);
  }

  const newChaperoneSlot = async (slot: any) => {
    slot.chaperoneName = computed(() => chaperones.value.filter((chaperone: any) => chaperone.id === slot.chaperone).map((c: any) => c.name)[0] ?? null);
    slot.randomID = Math.floor(Math.random() * 1000000);
    chaperoneSlots.value.push(slot);
  }

  const newTemplateSlot = async (slot: any) => {
    slot.randomID = Math.floor(Math.random() * 1000000);
    templateSlots.value.push(slot);
  }

  const removeTemplateSlot = async (slotToRemove: any) => {
    templateSlots.value = templateSlots.value.filter((slot: any) => slot !== slotToRemove);
    const template = getTemplate(slotToRemove.template_id);
    if (slotToRemove.id) {
      if (template.slotsToDelete) {
        template.slotsToDelete.push(slotToRemove.id);
      } else {
        template.slotsToDelete = [slotToRemove.id];
      }
    }
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

  const deleteEvent = async (id: number) => {
    const response = await fetchAPI(`events/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      showAlert("Error", "Failed to delete event")
      return;
    }
    showAlert("Success", "Event deleted successfully")
    events.value = events.value.filter((event: any) => event.id !== id)
  }

  const deleteTemplate = async (id: number) => {
    const response = await fetchAPI(`templates/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      showAlert("Error", "Failed to delete template")
      return;
    }
    showAlert("Success", "Template deleted successfully")
    templates.value = templates.value.filter((template: any) => template.id !== id)
  }

  const getEventAvailability = (id: number) => {
    return availability.value.find((avail: any) => avail.event_id == id);
  }

  const getEventsByChaperone = (chaperoneID: number) => {
    const slots = chaperoneSlots.value.filter((slot: any) => slot.chaperone == chaperoneID);
    const uniqueEvents = [... new Set(slots.map((slot: any) => getEvent(slot.event_id)))].sort((a: any, b: any) => a.start - b.start).filter((event: any) => event.start > new Date());
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

  const getChaperoneIDByName = (name: string) => {
    return chaperones.value.find((chaperone: any) => chaperone.name === name)?.id
  }

  const removeChaperoneSlot = (slotToRemove: any) => {
    const event = getEvent(slotToRemove.event_id);
    chaperoneSlots.value = chaperoneSlots.value.filter((slot: any) => slot !== slotToRemove);
    if (slotToRemove.id) {
      if (event.slotsToDelete) {
        event.slotsToDelete.push(slotToRemove.id);
      } else {
        event.slotsToDelete = [slotToRemove.id];
      }
    }
  }

  const saveEvent = async (eventID: number) => {
    const event = getEvent(eventID);
    const response = await fetchAPI(`events/${eventID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (!response.ok) {
      showAlert('Error', 'Failed to save event');
      return false;
    }
    if (event.slotsToDelete) {
      const results = await Promise.all([...event.slotsToDelete?.map((slotID: number) => deleteChaperoneSlot(slotID)),
      ...event.slots.map((slot: any) => saveChaperoneSlot(slot))]);
      if (results.includes(false)) return false;
    } else {
      const results = await Promise.all(event.slots.map((slot: any) => saveChaperoneSlot(slot)));
      if (results.includes(false)) return false;
    }
    event.slotsToDelete = [];
    loadEvents();
    loadChaperoneSlots();
    // await Promise.all(event.slots.map((slot: any) => saveChaperoneSlot(slot)));
    return true;
  }

  const deleteChaperoneSlot = async (slotID: number) => {
    const response = await fetchAPI(`chaperone_slots/${slotID}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      showAlert('Error', 'Failed to delete chaperone slot');
      return false
    }
    return true;
  }

  const saveTemplate = async (templateID: number) => {
    const template = getTemplate(templateID);
    const response = await fetchAPI(`templates/${templateID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });
    if (!response.ok) {
      showAlert('Error', 'Failed to save template');
      return;
    }
    if (template.slotsToDelete) {
      await Promise.all([...template.slotsToDelete?.map((slotID: number) => fetchAPI(`template_chaperone_slots/${slotID}`, { method: 'DELETE' })),
      ...template.slots.map((slot: any) => saveTemplateSlot(slot))]);
    } else {
      await Promise.all(template.slots.map((slot: any) => saveTemplateSlot(slot)));
    }
    template.slotsToDelete = [];
    loadTemplates();
  }

  const saveTemplateSlot = async (slot: any) => {
    if (slot.id) {
      const response = await fetchAPI(`template_chaperone_slots/${slot.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slot),
      });
      if (!response.ok) {
        showAlert('Error', 'Failed to save template slot');
      }
    } else {
      const response = await fetchAPI('template_chaperone_slots', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slot),
      });
      if (!response.ok) {
        showAlert('Error', 'Failed to save template slot');
      }
    }
  }

  const saveChaperoneSlot = async (slot: any) => {
    if (slot.id) {
      slot.chaperone = slot.selectedChaperoneID ?? null;
      const response = await fetchAPI(`chaperone_slots/${slot.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slot),
      });
      if (!response.ok) {
        showAlert('Error', 'Failed to save chaperone slot');
        return false;
      }
    } else {
      slot.chaperone = getChaperoneIDByName(slot.selectedChaperoneName);
      const response = await fetchAPI('chaperone_slots', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slot),
      });
      if (!response.ok) {
        showAlert('Error', 'Failed to save chaperone slot');
        return false;
      }
    }
    return true;
  }

  const createNewEvent = async (event: any) => {
    const response = await fetchAPI('events', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (!response.ok) {
      showAlert('Error', 'Failed to create event');
      return false;
    }
    const data = await response.json();
    event.id = data.id;

    event.slots.forEach((slot: any) => {
      slot.event_id = event.id;
      chaperoneSlots.value.push(slot);
    });

    const results = await Promise.all(event.slots.map((slot: any) => saveChaperoneSlot(slot)));

    if (results.includes(false)) return false;

    events.value.push(formatEvents([event])[0]);
    loadEvents();
    loadChaperoneSlots();
    return true;
  }

  const createNewTemplate = async (template: any) => {
    const response = await fetchAPI('templates', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });
    if (!response.ok) {
      showAlert('Error', 'Failed to create template');
      return false;
    }
    const data = await response.json();
    template.id = data.id;

    template.slots.forEach((slot: any) => {
      slot.template_id = template.id;
      templateSlots.value.push(slot);
    });

    const results = await Promise.all(template.slots.map((slot: any) => saveTemplateSlot(slot)));

    if (results.includes(false)) return false;

    templates.value.push(template);
    loadTemplates();
    loadTemplateSlots();
    return true;
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
    loadEvent,
    loadEventChaperoneSlots,
    loadChaperones,
    loadChaperoneSlots,
    loadAvailability,
    loadAllAvailability,
    loadTemplates,
    loadTemplateSlots,
    getEvent,
    deleteEvent,
    getEventAvailability,
    getEventsByChaperone,
    getTemplate,
    deleteChaperone,
    deleteTemplate,
    addChaperone,
    nextEvent,
    previousEvent,
    isLastEvent,
    isFirstEvent,
    getChaperone,
    getChaperoneIDByName,
    updateChaperoneSlot,
    newChaperoneSlot,
    removeChaperoneSlot,
    newTemplateSlot,
    removeTemplateSlot,
    saveEvent,
    saveTemplate,
    lockEvents,
    unlockEvents,
    createNewEvent,
    createNewTemplate,
  }
});
