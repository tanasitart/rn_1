import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
export const LOCATION_TASK_NAME = "background-location-task";

// เก็บ state ไว้นอก task เพราะ React ไม่ได้รันตอนนี้
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

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background task error:", error);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  const location = locations[0];
  const newCoords = location.coords;
  const newTimestamp = location.timestamp || Date.now();

  // ครั้งแรกยังไม่มีข้อมูลเก่า — บันทึกเลย
  if (!lastSavedCoords) {
    lastSavedCoords = newCoords;
    lastSavedTimestamp = newTimestamp;
    return;
  }

  const distance = getDistanceInMeters(lastSavedCoords, newCoords);
  const timeSinceLastUpdateMs = newTimestamp - lastSavedTimestamp;
  const isOverDistance = distance >= DISTANCE_THRESHOLD_METERS;
  const isOverTime = timeSinceLastUpdateMs >= FIFTEEN_MINUTES_MS;

  if (!isOverDistance && !isOverTime) {
    return; // ยังไม่ถึงเงื่อนไขไหนเลย ไม่ทำอะไร
  }

  // update
  lastSavedCoords = newCoords;
  lastSavedTimestamp = newTimestamp;

  const reason = isOverDistance
    ? `ห่างจากจุดเดิม ${distance.toFixed(0)} เมตร`
    : `ผ่านมา 15 นาทีแล้ว`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "📍 Location Updated",
      body: `${reason}\nLat: ${newCoords.latitude?.toFixed(5)}, Lng: ${newCoords.longitude?.toFixed(5)}`,
    },
    trigger: null,
  });
});