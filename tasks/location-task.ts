import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
export const LOCATION_TASK_NAME = "background-location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ error }) => {
  if (error) {
    console.error("Background task error:", error);
    return;
  }

  const now = new Date();

  const dateString = now.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const timeString = now.toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  //const Notifications = await import("expo-notifications");
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔔Auto โนติ หลังปิดแอพ",
      body: `ขณะนี้เวลา ${dateString} เวลา ${timeString} น.`,
    },
    trigger: null,
  });
});