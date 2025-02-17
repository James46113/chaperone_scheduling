<template>
  <v-dialog v-model="showPWAinstall" :width="isMobile ? '100vw' : '40vw'">
    <v-card class="pa-3">
      <v-img src="/Steel-City-Choristers.png" max-width="200" />
      <v-card-title class="ml-2">
        Install App
      </v-card-title>
      <v-card-text>
        Install this app on your device for quick and easy access when you're on the go.
        This is strongly reccomended for the best experience.
      </v-card-text>
      <v-checkbox class="ml-7" v-model="dontShowAgain" label="Don't show this again" />
      <v-card-actions>
        <v-btn text @click="close">
          Cancel
        </v-btn>
        <v-btn color="primary" text @click="install">
          Install
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const showPWAinstall = ref(!isPWA.value && !(Cookies.get('dontShowPWA') == 'true'))
const isAndroid = computed(() => navigator.userAgent.match(/Android/i))
const isIOS = computed(() => navigator.userAgent.match(/iPhone|iPad|iPod/i))
const dontShowAgain = ref(false)
let installPrompt = null;
console.log(showPWAinstall.value)

window.addEventListener("beforeinstallprompt", async (event) => {
  event.preventDefault();
  installPrompt = event;
  console.log("sldkfj")
});

const install = async () => {
  if (installPrompt) {
    installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      Cookies.set('dontShowPWA', 'true');
    } else {
      if (dontShowAgain.value) {
        Cookies.set('dontShowPWA', 'true');
      }
    }
    installPrompt = null;
  }
  showPWAinstall.value = false;
}

const close = () => {
  if (dontShowAgain.value) {
    Cookies.set('dontShowPWA', 'true');
  }
  showPWAinstall.value = false;
}
</script>