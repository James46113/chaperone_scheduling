<template>
  <v-bottom-sheet
    v-model="showPrivacyNotice"
    persistent
    inset="50%"
  >
    <v-card>
      <v-card
        elevation="0"
        color="primary"
        rounded="0"
      >
        <v-card-title>Privacy and Cookies</v-card-title>
      </v-card>
      <v-card-text>
        <p class="mb-2">
          This web application uses <strong>essential cookies</strong> that are necessary for the site to function properly.
        </p>
        <p class="mb-2">
          <strong>Browser fingerprinting</strong> technology is also used for security purposes to help protect your account and the information held in the system, and detect unauthorized access attempts.
        </p>
        <p class="mb-2">
          No personal data about you or your browser is stored at any time other than your email and password.
        </p>
        <p class="mb-2">
          By continuing to use this site, you agree to the use of essential cookies and browser fingerprinting.
        </p>
        <p class="text-caption">
          For more information about how we handle your data, please contact enquiries@steelcitychoristers.org.uk.
        </p>
      </v-card-text>
      <v-card-actions v-if="!isMobile">
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          @click="agree"
        >
          I Agree
        </v-btn>
      </v-card-actions>
      <div
        v-else
        class="d-flex justify-center"
      >
        <v-btn
          width="80%"
          color="primary"
          class="mb-4"
          variant="flat"
          size="large"
          @click="agree"
        >
          I Agree
        </v-btn>
      </div>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup>
const showPrivacyNotice = ref(!Cookies.get('privacyAgreed'))

const agree = () => {
    showPrivacyNotice.value = false;
    Cookies.set('privacyAgreed', 'true', { expires: 365, secure: true, sameSite: 'strict' });
}

</script>