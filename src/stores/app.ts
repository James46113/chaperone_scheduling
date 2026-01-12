// Utilities
import { defineStore } from 'pinia'


interface ChaperoneSlot {
  id: number;
  event_id: number;
  chaperone: number;
  start: Date;
  end: Date;
}

interface Event {
  id: number;
  start: Date;
  end: Date;
  date: Date;
  lead_chaperone: number;
}

interface Chaperone {
  id: number;
  name: string;
  is_singing_chaperone?: boolean;
}

interface Availability {
  id: number;
  event_id: number;
  chaperone_id: number;
  available: boolean | null;
  chaperoneName?: string | (() => string | null);
}

interface Template {
  id: number;
  template_name: string;
  start: Date;
  end: Date;
  slots: TemplateSlot[] | (() => TemplateSlot[]);
  slotsToDelete?: number[];
}

interface TemplateSlot {
  id: number;
  template_id: number;
  start: Date;
  end: Date;
  randomID?: number;
}

export const useAppStore = defineStore('app', () => {
  const showAlertDialog = ref(false);
  const alertTitle = ref('');
  const alertMessage = ref('');
  const userEmail = ref('');
  const isAdmin = ref(false);
  const userID = ref();
  const tabView = ref(isMobile.value ? 'schedule' : 'calendar');
  const showCreateTermDialog = ref(false);
  const calendarDate = ref(new Date())

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
    let loadedEvents: any[] = [];
    let ids: number[] = [];

    if (!offline.value) {
      console.log("fetched events")
      const response = await fetchAPI('events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': eventsLastUpdated ?? '',
        },
      });
      const data = await response.json();
      loadedEvents = data.events;
      ids = data.event_ids;
    }

    if (eventsLastUpdated) {
      const storedEvents = localStorage.getItem('events');
      if (storedEvents) {
        const parsedStoredEvents = JSON.parse(storedEvents!);
        parsedStoredEvents.forEach((storedEvent: any, index: number) => {
          const incomingModifiedEvent = loadedEvents.find((event: any) => event.id == storedEvent.id);
          if (incomingModifiedEvent) {
            parsedStoredEvents[index] = { ...incomingModifiedEvent };
          }
        });
        loadedEvents.forEach((event: any) => {
          if (!parsedStoredEvents.map((e: any) => e.id).includes(event.id)) {
            parsedStoredEvents.push(event);
          }
        });
        loadedEvents = parsedStoredEvents;
        console.log("loaded from stored events");
      }
    }

    // console.log(ids)
    // console.log(loadedEvents.map((event: any) => event.id))
    if (ids.length !== 0)
      loadedEvents = loadedEvents.filter((event: any) => ids.includes(event.id));
    // console.log(ids)
    // console.log(loadedEvents.map((event: any) => event.id))

    if (eventsLocked.value) return;
    localStorage.setItem('events', JSON.stringify(loadedEvents));
    localStorage.setItem('eventsLastUpdated', Math.floor(new Date().getTime() / 1000 - 60 * 24).toString());
    const formattedEvents = formatEvents(loadedEvents);
    events.value = formattedEvents;
  };

  const formatEvents = (data: any) => {
    data.forEach((event: any) => {
      event.start = new Date(event.start);
      event.end = new Date(event.end);
      event.date = new Date(event.start);
      event.dateString = event.date.toLocaleDateString('en-UK', {
        weekday: 'short', day: 'numeric',
        month: 'short'
      });

      event.isPastEvent = computed(() => event.start < new Date());
      event.isEditableEvent = computed(() => event.start > new Date().setDate(new Date().getDate() - 2))
      event.slots = computed(() =>
        chaperoneSlots.value
          .filter((slot: any) => slot.event_id === event.id)
          .sort((a: any, b: any) => {
            const aTitle = (a.title ?? '').toString();
            const bTitle = (b.title ?? '').toString();
            return aTitle.localeCompare(bTitle);
          }) ?? []
      );
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
        const available = event.rawAvailability.value.filter((avail: any) => avail.available === true).sort((a: any, b: any) => a.chaperoneName?.localeCompare(b.chaperoneName));
        const unavailable = event.rawAvailability.value.filter((avail: any) => avail.available === false).sort((a: any, b: any) => a.chaperoneName?.localeCompare(b.chaperoneName));
        const unanswered = event.rawAvailability.value.filter((avail: any) => avail.available === null).sort((a: any, b: any) => a.chaperoneName?.localeCompare(b.chaperoneName));
        return [...available, ...unavailable, ...unanswered];
      })
    });

    return data.sort((a: any, b: any) => a.start - b.start);
  }

  const formatLastLogin = (last_login: Date) => {
    if (!last_login) {
      return "Never"
    }
    last_login = new Date(last_login)
    const now = new Date();
    const diffInMs = now.getTime() - last_login.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays == 0) {
      return 'Today';
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 30) {
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
    } else {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    }

  }

  const loadChaperones = async () => {
    const chaperonesLastUpdated = localStorage.getItem('chaperonesLastUpdated');
    let loadedChaperones: any[] = [];
    let ids: number[] = [];

    if (!offline.value) {
      const response = await fetchAPI('chaperones', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': chaperonesLastUpdated ?? '',
        },
      });
      const data = await response.json();
      loadedChaperones = data.chaperones;
      ids = data.chaperone_ids;
    }

    if (chaperonesLastUpdated) {
      const storedChaperones = localStorage.getItem('chaperones');
      if (storedChaperones) {
        const parsedStoredChaperones = JSON.parse(storedChaperones!);
        parsedStoredChaperones.forEach((storedChaperone: any, index: number) => {
          const incomingModifiedChaperone = loadedChaperones.find((chaperone: any) => chaperone.id == storedChaperone.id);
          if (incomingModifiedChaperone) {
            parsedStoredChaperones[index] = { ...incomingModifiedChaperone };
          }
        });
        loadedChaperones.forEach((event: any) => {
          if (!parsedStoredChaperones.map((e: any) => e.id).includes(event.id)) {
            parsedStoredChaperones.push(event);
          }
        });
        loadedChaperones = parsedStoredChaperones;
        console.log("loaded from stored chaperones");
      }
    }

    if (ids.length !== 0)
      loadedChaperones = loadedChaperones.filter((chaperone: any) => ids.includes(chaperone.id));

    localStorage.setItem('chaperones', JSON.stringify(loadedChaperones));
    localStorage.setItem('chaperonesLastUpdated', Math.floor(new Date().getTime() / 1000 - 60 * 24).toString());

    loadedChaperones.forEach((chaperone: any) => {
      chaperone.numEvents = computed(() => {
        const uniqueEventIDs = [...new Set(chaperoneSlots.value.filter((slot: any) => slot.chaperone === chaperone.id).map((slot: any) => slot.event_id))];
        return uniqueEventIDs.filter((eventID: any) => getEvent(eventID).start > new Date()).length;
      });
    });

    chaperones.value = loadedChaperones.sort((a: any, b: any) => a.name.localeCompare(b.name)).filter((chaperone: any) => chaperone.name !== 'Choir Phone' && chaperone.name !== "Eleanor")
      .map((chaperone: any) => {
        return { ...chaperone, last_login_string: formatLastLogin(chaperone.last_login), last_login: new Date().getTime() - new Date(chaperone.last_login).getTime() }
      });
  }

  const loadChaperoneSlots = async () => {
    const lastUpdated = localStorage.getItem('chaperoneSlotsLastUpdated');
    let loadedSlots: any[] = [];
    let ids: number[] = [];

    if (!offline.value) {
      const response = await fetchAPI('chaperone_slots', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': lastUpdated ?? '',
        },
      });

      const data = await response.json();
      loadedSlots = data.slots;
      ids = data.slot_ids;
    }

    if (lastUpdated) {
      const storedSlots = localStorage.getItem('chaperoneSlots');
      if (storedSlots) {
        const parsedStoredSlots = JSON.parse(storedSlots);
        parsedStoredSlots.forEach((storedSlot: any, index: number) => {
          const incomingModifiedSlot = loadedSlots.find((slot: any) => slot.id == storedSlot.id);
          if (incomingModifiedSlot) {
            parsedStoredSlots[index] = { ...incomingModifiedSlot };
          }
        });
        loadedSlots.forEach((slot: any) => {
          if (!parsedStoredSlots.map((e: any) => e.id).includes(slot.id)) {
            parsedStoredSlots.push(slot);
          }
        });
        loadedSlots = parsedStoredSlots;
        console.log("loaded from stored slots");
      }
    }
    if (eventsLocked.value) return;

    if (ids.length !== 0)
      loadedSlots = loadedSlots.filter((slot: any) => ids.includes(slot.id));

    localStorage.setItem('chaperoneSlots', JSON.stringify(loadedSlots));
    localStorage.setItem('chaperoneSlotsLastUpdated', Math.floor(new Date().getTime() / 1000 - 60 * 24).toString()); // 24 hours ago

    loadedSlots.forEach((slot: any) => {
      slot.start = new Date(slot.start);
      slot.end = new Date(slot.end);
      slot.chaperoneName = computed(() => chaperones.value.filter((chaperone: any) => chaperone.id === slot.chaperone).map((c: any) => c.name)[0] ?? null);
      slot.setChaperone = (id: number) => slot.chaperone = id;
    });
    chaperoneSlots.value = loadedSlots;
  }

  const loadAvailability = async () => {
    let data: any[] = [];

    if (!offline.value) {

      const response = await fetchAPI(`chaperones/availability/${userID.value}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      data = await response.json();
    }
    else {
      const storedAvailability = localStorage.getItem('availability');
      if (storedAvailability) {
        data = JSON.parse(storedAvailability);
      }
    }

    localStorage.setItem('availability', JSON.stringify(data));
    availability.value = data.filter((avail: any) => avail.chaperone_id !== 0);
  }

  const loadAllAvailability = async () => {
    let data: any[] = [];

    if (!offline.value) {

      const response = await fetchAPI(`chaperones/availability`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      data = await response.json();
    } else {
      const storedAvailability = localStorage.getItem('allAvailability');
      if (storedAvailability) {
        data = JSON.parse(storedAvailability);
      }
    }

    localStorage.setItem('allAvailability', JSON.stringify(data));

    data.forEach((avail: any) => {
      avail.chaperoneName = computed(() => chaperones.value.filter((chaperone: any) => chaperone.id === avail.chaperone_id).map((c: any) => c.name
      )[0] ?? null);
    });
    allAvailability.value = data.filter((avail: any) => avail.chaperone_id != 0);
  }

  const loadTemplates = async () => {
    const templatesLastUpdated = localStorage.getItem('templatesLastUpdated');

    let loadedTemplates: any[] = [];
    let ids: number[] = [];

    if (!offline.value) {

      const response = await fetchAPI('templates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': templatesLastUpdated ?? '',
        },
      });
      const data = await response.json();
      loadedTemplates = data.templates;
      ids = data.template_ids;
    }

    if (templatesLastUpdated) {
      const storedTemplates = localStorage.getItem('templates');
      if (storedTemplates) {
        const parsedStoredTemplates = JSON.parse(storedTemplates);
        parsedStoredTemplates.forEach((storedTemplate: any, index: number) => {
          const incomingModifiedTemplate = loadedTemplates.find((template: any) => template.id == storedTemplate.id);
          if (incomingModifiedTemplate) {
            parsedStoredTemplates[index] = { ...incomingModifiedTemplate };
          }
        });
        loadedTemplates.forEach((template: any) => {
          if (!parsedStoredTemplates.map((e: any) => e.id).includes(template.id)) {
            parsedStoredTemplates.push(template);
          }
        });
        loadedTemplates = parsedStoredTemplates;
        console.log("loaded from stored templates");
      }
    }

    if (ids.length !== 0)
      loadedTemplates = loadedTemplates.filter((template: any) => ids.includes(template.id));

    localStorage.setItem('templates', JSON.stringify(loadedTemplates));
    localStorage.setItem('templatesLastUpdated', Math.floor(new Date().getTime() / 1000 - 60 * 24).toString());

    loadedTemplates.forEach((template: any) => {
      template.start = new Date(template.start);
      template.end = new Date(template.end);
      template.slots = computed(() => templateSlots.value.filter((slot: any) => slot.template_id === template.id));
    });
    templates.value = loadedTemplates;
  }

  const loadTemplateSlots = async () => {
    const lastUpdated = localStorage.getItem('templateSlotsLastUpdated');

    let loadedTemplateSlots: any[] = [];
    let ids: number[] = [];

    if (!offline.value) {
      const response = await fetchAPI('template_chaperone_slots', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'last-updated': lastUpdated ?? '',
        },
      });
      const data = await response.json();
      loadedTemplateSlots = data.template_slots;
      ids = data.template_slot_ids;
    }

    if (lastUpdated) {
      const storedSlots = localStorage.getItem('templateSlots');
      if (storedSlots) {
        const parsedStoredSlots = JSON.parse(storedSlots);
        parsedStoredSlots.forEach((storedSlot: any, index: number) => {
          const incomingModifiedSlot = loadedTemplateSlots.find((slot: any) => slot.id == storedSlot.id);
          if (incomingModifiedSlot) {
            parsedStoredSlots[index] = { ...incomingModifiedSlot };
          }
        });
        loadedTemplateSlots.forEach((slot: any) => {
          if (!parsedStoredSlots.map((e: any) => e.id).includes(slot.id)) {
            parsedStoredSlots.push(slot);
          }
        });
        loadedTemplateSlots = parsedStoredSlots;
        console.log("loaded from stored slots");
      }
    }

    if (ids.length !== 0)
      loadedTemplateSlots = loadedTemplateSlots.filter((slot: any) => ids.includes(slot.id));

    localStorage.setItem('templateSlots', JSON.stringify(loadedTemplateSlots));
    localStorage.setItem('templateSlotsLastUpdated', Math.floor(new Date().getTime() / 1000 - 60 * 24).toString());

    loadedTemplateSlots.forEach((slot: any) => {
      slot.start = new Date(slot.start);
      slot.end = new Date(slot.end);
    });
    templateSlots.value = loadedTemplateSlots;
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

  const updateEvent = async (id: number) => {
    const event = events.value.find((e: any) => e.id === id)
    fetchAPI(`events/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    })
      .catch(() => showAlert("An Error Occurred", "The event could not be updated, please try again later."))
    setTimeout(loadEvents, 2000)
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
    console.log(availability.value.find((avail: any) => avail.event_id == id))
    return availability.value.find((avail: any) => avail.event_id == id);
  }

  const getEventsByChaperone = (chaperoneID: number) => {
    const slots = chaperoneSlots.value.filter((slot: any) => slot.chaperone == chaperoneID);
    const uniqueEvents = [... new Set(slots.map((slot: any) => getEvent(slot.event_id)))].sort((a: any, b: any) => a.start - b.start).filter((event: any) => event.end > new Date());
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

  const getChaperoneByName = (name: string) => {
    return chaperones.value.find((chaperone: any) => chaperone.name === name);
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

  const isSingingChaperoneFromName = (name: string) => {
    return chaperones.value.find(chaperone => chaperone.name === name)?.is_singing_chaperone
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
    calendarDate,

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
    updateEvent,
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
    getChaperoneByName,
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
    isSingingChaperoneFromName,
  }
});
