<template>
  <v-dialog
    v-model="showPWAinstall"
    :width="isMobile ? '100vw' : '40vw'"
  >
    <v-card class="pa-3">
      <v-img
        src="/Steel-City-Choristers.png"
        max-width="200"
      />
      <v-card-title class="ml-2">
        Install App
      </v-card-title>
      <v-card-text>
        Install this app on your device for quick and easy access.
        This is strongly recommended for the best experience.
      </v-card-text>
      <v-card-text v-if="isIOS">
        Steps to install:
        <ol class="ml-8 mt-3">
          <li>
            Make sure you are using Safari browser
          </li>
          <li>
            Press the "share" icon:
            <img
              src="/ios-share.svg"
              width="20px"
            >
          </li>
          <li>
            Scroll down until you see "Add to Home Screen"
          </li>
          <li>
            Press "Add to Home Screen"
          </li>
        </ol>
      </v-card-text>
      <v-checkbox
        v-model="dontShowAgain"
        class="ml-7"
        label="Don't show this again"
      />
      <v-card-actions v-if="!isIOS">
        <v-btn
          text
          class="text-disabled"
          @click="close"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          text
          @click="install"
        >
          Install
        </v-btn>
      </v-card-actions>
      <v-card-actions v-else>
        <v-btn
          text
          @click="close"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const isIOS = computed(() => navigator.userAgent.match(/iPhone|iPad|iPod/i))
const showPWAinstall = ref(!isPWA.value && !(Cookies.get('dontShowPWA') == 'true'))
const dontShowAgain = ref(false)
let installPrompt = null;

window.addEventListener("beforeinstallprompt", async (event) => {
  event.preventDefault();
  installPrompt = event;
});

const install = async () => {
  if (installPrompt) {
    installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      Cookies.set('dontShowPWA', 'true', { expires: 365, secure: true, sameSite: 'strict' });
    } else {
      if (dontShowAgain.value) {
        Cookies.set('dontShowPWA', 'true', { expires: 365, secure: true, sameSite: 'strict' });
      }
    }
    installPrompt = null;
  }
  showPWAinstall.value = false;
}

const close = () => {
  if (dontShowAgain.value) {
    Cookies.set('dontShowPWA', 'true', { expires: 365, secure: true, sameSite: 'strict' });
  }
  showPWAinstall.value = false;
}
</script>
