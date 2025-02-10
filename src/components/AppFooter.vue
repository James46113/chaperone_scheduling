<template>
  <v-footer border app absolute>
    <v-row>
      <v-col>
        <a href="https://github.com/James46113" class="d-inline-block mx-2 social-link" title="James46113 - Github"
          rel="noopener noreferrer" target="_blank">
          <v-icon icon="mdi-github" size="16" />
        </a>
      </v-col>
      <v-col class="text-center text-caption text-disabled">
        <a class="text-disabled" href="https://steelcitychoristers.org.uk">Steel City Choristers</a> - Registered
        Charity Number 1195909
      </v-col>
      <v-col class="text-right">
        <div class="text-caption text-disabled">
          {{ "James Caroe - " + new Date().getFullYear() }}
        </div>
      </v-col>
    </v-row>
  </v-footer>
</template>