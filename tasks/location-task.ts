import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

export const LOCATION_TASK_NAME = "background-location-task";

let lastSavedCoords: Location.LocationObjectCoords | null = null;
let lastSavedTimestamp: number = 0;
const DISTANCE_THRESHOLD_METERS = 200;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const getDistanceInMeters = (
  from: Location.LocationObjectCoords,
  to: Location.LocationObjectCoords,
): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getCurrentTime = (): string => {
  return new Date().toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const sendNotification = async (title: string, body: string) => {
  const Notifications = await import("expo-notifications");
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background task error:", error);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  const location = locations[0];
  const newCoords = location.coords;
  const newTimestamp = location.timestamp || Date.now();
  const time = getCurrentTime();
  const coordsText = `Lat: ${newCoords.latitude?.toFixed(5)}, Lng: ${newCoords.longitude?.toFixed(5)}`;

  // ครั้งแรก — บันทึกเลย
  if (!lastSavedCoords) {
    lastSavedCoords = newCoords;
    lastSavedTimestamp = newTimestamp;
    await sendNotification(
      "📍 เริ่มต้น Tracking",
      `${time}\n${coordsText}`,
    );
    return;
  }

  const distance = getDistanceInMeters(lastSavedCoords, newCoords);
  const timeSinceLastUpdateMs = newTimestamp - lastSavedTimestamp;
  const isOverDistance = distance >= DISTANCE_THRESHOLD_METERS;
  const isOverTime = timeSinceLastUpdateMs >= FIFTEEN_MINUTES_MS;

  if (isOverDistance) {
    // เงื่อนไข 1 — ห่างเกิน 200 เมตร
    lastSavedCoords = newCoords;
    lastSavedTimestamp = newTimestamp;
    await sendNotification(
      "✅ Update Location",
      `ห่างจากของเดิม ${distance.toFixed(0)} เมตร\n${time}\n${coordsText}`,
    );
  } else if (isOverTime) {
    // เงื่อนไข 2 — ผ่านมา 15 นาที ยังไม่ update
    lastSavedCoords = newCoords;
    lastSavedTimestamp = newTimestamp;
    await sendNotification(
      "⚡ Force Update Location",
      `ระยะทางไม่เกิน 200 เมตรจากจุดเดิม (${distance.toFixed(0)} เมตร)\n${time}\n${coordsText}`,
    );
  } else {
    // ไม่ถึงเงื่อนไขไหน
    await sendNotification(
      "📌 ไม่ Update Location",
      `ห่างจากของเดิม ${distance.toFixed(0)} เมตร\n${time}\n${coordsText}`,
    );
  }
});