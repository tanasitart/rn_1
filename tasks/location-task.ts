import * as Location from "expo-location";
import * as SQLite from "expo-sqlite";
import * as TaskManager from "expo-task-manager";
import * as Battery from "expo-battery";

export const LOCATION_TASK_NAME = "background-location-task";
interface InsertDatabaseParams {
  serviceName: string;
  isUpdateLocation: number;
  reason: string;
  timeStamp: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  diffLocation: number;
  countDownTime: string;
  batteryPercent: number;
  isBatteryCharging: number;
}

let lastSavedCoords: Location.LocationObjectCoords | null = null;
let lastSavedTimestamp: number = 0;
const DISTANCE_THRESHOLD_METERS = 200;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const insertDatabase = async ({
  serviceName,
  isUpdateLocation,
  reason,
  timeStamp,
  latitude,
  longitude,
  accuracy,
  diffLocation,
  countDownTime,
  batteryPercent,
  isBatteryCharging,
}: InsertDatabaseParams) => {
  let db: SQLite.SQLiteDatabase | null = null;
  try {
    // 1. เปิดการเชื่อมต่อด้วยการระบุชื่อไฟล์ (ถ้ายังไม่มี ไฟล์จะถูกสร้างให้อัตโนมัติ)
    db = await SQLite.openDatabaseAsync("rn_1_foreground.db");
    // 2. สร้าง Table สำหรับเก็บ Log
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS rn_1foreground (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          serviceName TEXT,
          isUpdateLocation INTEGER,  
          reason TEXT,
          timestamp INTEGER,         
          latitude REAL,            
          longitude REAL,            
          accuracy REAL,             
          diffLocation REAL,
          countDownTime TEXT,
          batteryPercent REAL,
          isBatteryCharging INTEGER
        );
      `);
    /*console.log("check value before insert \n",
        "serviceName: ", serviceName, "\n",
        "isUpdateLocation: ", isUpdateLocation, "\n",
        "reason: ", reason, "\n",
        "timeStamp: ", timeStamp, "\n",
        "latitude: ", latitude, "\n",
        "longitude: ", longitude, "\n",
        "accuracy: ", accuracy, "\n",
        "diffLocation: ", diffLocation, "\n",
        "countDownTime: ", countDownTime, "\n",
        "batteryPercent: ", batteryPercent, "\n",
        "isBatteryCharging: ", isBatteryCharging, "\n",
      )*/
    //3. Insert
    const result = await db.runAsync(
      `INSERT INTO rn_1foreground (
        serviceName,
        isUpdateLocation,
        reason,
        timestamp, 
        latitude,
        longitude,
        accuracy,
        diffLocation, 
        countDownTime,
        batteryPercent,
        isBatteryCharging
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        serviceName,
        isUpdateLocation,
        reason,
        timeStamp,
        latitude,
        longitude,
        accuracy,
        diffLocation,
        countDownTime,
        batteryPercent,
        isBatteryCharging,
      ],
    );
    await sendNotification(
      "บันทึกลงฐานข้อมูล ID : " + result.lastInsertRowId,
      `${reason} ${getCurrentTime()}`,
    );
  } catch (error) {
    await sendNotification(
      "บันทึกลงฐานข้อมูลไม่สำเร็จ ",
      `${reason} ${getCurrentTime()} \nError: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    // ปิด database connection เมื่อเสร็จ
    if (db) {
      await db.closeAsync();
    }
  }
};

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
    await sendNotification("📍 เริ่มต้น Tracking", `${time}\n${coordsText}`);
    return;
  }
  const distance = getDistanceInMeters(lastSavedCoords, newCoords);
  const timeSinceLastUpdateMs = newTimestamp - lastSavedTimestamp;
  const isOverDistance = distance >= DISTANCE_THRESHOLD_METERS;
  const isOverTime = timeSinceLastUpdateMs >= FIFTEEN_MINUTES_MS;
  const batteryPercentRounded = Math.round(
    (await Battery.getBatteryLevelAsync()) * 100,
  );
  const isBatteryCharge = await Battery.getBatteryStateAsync();
  if (isOverDistance) {
    // เงื่อนไข 1 — ห่างเกิน 200 เมตร
    lastSavedCoords = newCoords;
    lastSavedTimestamp = newTimestamp;
    insertDatabase({
      serviceName: "Background_GPS_Service",
      isUpdateLocation: 1,
      reason: "distance over 200 meters",
      timeStamp: newTimestamp,
      latitude: newCoords.latitude,
      longitude: newCoords.longitude,
      accuracy: location.coords.accuracy,
      diffLocation: distance,
      countDownTime: "N/A",
      batteryPercent: batteryPercentRounded,
      isBatteryCharging: isBatteryCharge,
    });
    await sendNotification(
      "✅ Update Location",
      `ห่างจากของเดิม ${distance.toFixed(0)} เมตร\n${time}\n${coordsText}`,
    );
  } else if (isOverTime) {
    // เงื่อนไข 2 — ผ่านมา 15 นาที ยังไม่ update
    lastSavedCoords = newCoords;
    lastSavedTimestamp = newTimestamp;
    insertDatabase({
      serviceName: "Background_GPS_Service",
      isUpdateLocation: 1,
      reason: "time over 15 minutes",
      timeStamp: newTimestamp,
      latitude: newCoords.latitude,
      longitude: newCoords.longitude,
      accuracy: location.coords.accuracy,
      diffLocation: distance,
      countDownTime: "N/A",
      batteryPercent: batteryPercentRounded,
      isBatteryCharging: isBatteryCharge,
    });
    await sendNotification(
      "⚡ Force Update Location",
      `ระยะทางไม่เกิน 200 เมตรจากจุดเดิม (${distance.toFixed(0)} เมตร)\n${time}\n${coordsText}`,
    );
  } else {
    // ไม่ถึงเงื่อนไขไหน
    insertDatabase({
      serviceName: "Background_GPS_Service",
      isUpdateLocation: 0,
      reason: "no update location",
      timeStamp: newTimestamp,
      latitude: newCoords.latitude,
      longitude: newCoords.longitude,
      accuracy: location.coords.accuracy,
      diffLocation: distance,
      countDownTime: "N/A",
      batteryPercent: batteryPercentRounded,
      isBatteryCharging: isBatteryCharge,
    });
    await sendNotification(
      "📌 ไม่ Update Location",
      `ห่างจากของเดิม ${distance.toFixed(0)} เมตร\n${time}\n${coordsText}`,
    );
  }
});
