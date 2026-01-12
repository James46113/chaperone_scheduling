<template>
    <app-header />
    <div class="pa-4 d-flex justify-center">
        <div>
            <v-card v-for="event in store.upcomingEvents" class="my-3 mx-1" elevation="3" max-width="90vw">
                <v-row class="flex-nowrap">
                    <v-col cols="auto" max-width="200" class="mr-n4">
                        <v-card class="pa-2 date" max-width="100px" min-width="60px" elevation="0"
                            style="border-radius: 0;" height="100%">
                            <p class="dow" height="100%">
                                {{ event.start.toLocaleString('en-GB', { weekday: 'short' }) }}
                            </p>
                            <p class="day">
                                {{ event.start.getDate() }}
                            </p>
                            <p class="month">
                                {{ event.start.toLocaleString('en-GB', { month: 'short' }) }}
                            </p>
                        </v-card>
                    </v-col>
                    <v-col class="pa-3">
                        <v-card-text class="ml-n3" style="font-size: large;">
                            <b>{{ event.title }}:</b>
                        </v-card-text>
                        <v-row class="pl-4 mb-2">
                            <div v-for="slot in event.slots"
                                :class="{ filled: !!slot.chaperone, empty: !slot.chaperone, slot }">
                                <v-menu activator="parent" :open-on-hover="!isMobile" :open-on-click="isMobile"
                                    open-delay="0.3" close-delay="0.3" transition="fade-transition">
                                    <v-card>
                                        <v-card-text class="mt-n1 ml-n1"><b>{{ slot.title }}</b></v-card-text>
                                        <v-card-subtitle class="mt-n4 ml-n1">{{ slot.start.toLocaleTimeString([], {
                                            hour: '2-digit', minute: '2-digit'
                                        }) }} – {{
                                                slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            }}</v-card-subtitle>
                                        <v-card-text class="mt-n3 ml-n1">
                                            <i v-if="!slot.chaperone">No Chaperone</i>
                                            <span v-else>
                                                {{ slot.chaperoneName }}
                                            </span>
                                        </v-card-text>
                                    </v-card>
                                </v-menu>
                            </div>
                            <span v-if="event.slots.length === 0">
                                <i>No Chaperone Slots</i>
                            </span>
                        </v-row>
                    </v-col>
                </v-row>
            </v-card>
        </div>
        <!-- <table>
            <tr>
                <th>Dates</th>
                <th colspan="100%">Chaperone Slots</th>
            </tr>
            <tr v-for="event in store.upcomingEvents">
                <td>
                    <v-card
                    class="pa-1 ma-1 date"
                        max-width="100px"
                        min-width="60px"
                        elevation="0"
                        style="border-radius: 0;"
                        height="100%"
                        >
                        <p
                            class="dow"
                            height="100%"
                        >
                            {{ event.start.toLocaleString('en-GB', { weekday: 'short' }) }}
                        </p>
                        <p class="day">
                            {{ event.start.getDate() }}
                        </p>
                        <p class="month">
                            {{ event.start.toLocaleString('en-GB', { month: 'short' }) }}
                        </p>
                    </v-card>
                </td>
                <td v-for="slot in event.slots" class="slots-td">
                    <div :class="{filled: !!slot.chaperone, empty: !slot.chaperone, slot}">
                        <v-menu activator="parent" :open-on-hover="!isMobile" :open-on-click="isMobile" open-delay="0.3" close-delay="0.3" transition="fade-transition">
                            <v-card>
                                <v-card-text class="mt-n1 ml-n1"><b>{{ slot.title }}</b></v-card-text>
                                <v-card-subtitle class="mt-n4 ml-n1">{{ slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} – {{ slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</v-card-subtitle>
                                <v-card-text class="mt-n3 ml-n1">
                                    <i v-if="!slot.chaperone">No Chaperone</i>
                                    <span v-else>
                                        {{ slot.chaperoneName }}
                                    </span>
                                </v-card-text>
                            </v-card>
                        </v-menu>
                    </div>
                </td>

                <td class="slots-td pl-1" colspan="100%" v-if="event.slots.length === 0">
                    <i>No Chaperone Slots</i>
                </td>
            </tr>
        </table> -->
    </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const store = useAppStore();

onMounted(async () => {
    if (!store.allAvailabilityLoaded || !store.eventsLoaded || !store.chaperonesLoaded) {
        await Promise.all([
            store.loadChaperones(),
            store.loadEvents(),
            store.loadAllAvailability(),
            store.loadChaperoneSlots()
        ])
    } else {
        store.loadChaperones()
        store.loadEvents()
        store.loadAllAvailability()
        store.loadChaperoneSlots()
    }
})

</script>


<style scoped>
table,
th,
td {
    border: 1px solid black;
    border-collapse: collapse;
}

th,
td {
    text-align: left;
}

.vertical-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    text-align: start;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

th,
.dates {
    padding: 4px;
}

.gig-location {
    font-size: small;
}

.divider {
    background-color: gray;
    border: 0px;
}

.filled {
    background-color: #198754;
}

.empty {
    background-color: rgb(var(--v-theme-primary));
}

.slot {
    width: 30px;
    height: 30px;
    margin: 4px;
    border-radius: 4px;
}

.slots-td {
    border: 0px;
}

tr {
    border: 1px solid black;
}

.eventcard {
    border: 1px solid rgb(var(--v-theme-primary));
}

.routerlink {
    display: contents !important;
    text-decoration: none !important;
    color: inherit !important;

    &:hover,
    &:visited,
    &:active {
        text-decoration: none !important;
        color: inherit !important;
    }
}

.month,
.dow {
    text-transform: uppercase;
    text-align: center;
}

.day {
    padding-top: 0;
    margin-top: -10px;
    margin-bottom: -10px;
    font-size: x-large;
    font-weight: bold;
    text-align: center;
}

.date {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 1px solid rgb(var(--v-theme-primary));
    color: white;
    background-color: rgb(var(--v-theme-primary));
}
</style>