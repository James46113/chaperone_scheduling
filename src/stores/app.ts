// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const showAlertDialog = ref(false);
  const alertTitle = ref('');
  const alertMessage = ref('');
  const userEmail = ref('');
  const isAdmin = ref(false);
  const userID = ref(null);
  const tabView = ref(isMobile.value ? 'list' : 'calendar');

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
  }
})
