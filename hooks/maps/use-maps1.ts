import * as Battery from "expo-battery";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SQLite from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { activateKeepAwakeAsync } from "expo-keep-awake";
//import * as sensors from "react-native-sensors";
//import DeviceInfo from "react-native-device-info";
interface LocationsObject {
  timestamp: number;
  mocked?: boolean;
  coords: {
    altitude: number | null;
    heading: number | null;
    altitudeAccuracy: number | null;
    latitude: number | null;
    speed: number | null;
    longitude: number | null;
    accuracy: number | null;
  };
  countMins: string;
  countSecs: string;
  diffMeters: number;
  batteryPercent: number | null;
  isBatteryCharging: number | null;
}
interface LocationLibState {
  isLoading: boolean;
  errorMessage: string | null;
}
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

const INITIAL_LOCATION: LocationsObject = {
  timestamp: 0,
  mocked: false,
  coords: {
    altitude: 0,
    heading: 0,
    altitudeAccuracy: 0,
    latitude: 0,
    speed: 0,
    longitude: 0,
    accuracy: 0,
  },
  countMins: "0",
  countSecs: "0",
  diffMeters: 0,
  batteryPercent: null,
  isBatteryCharging: null,
};
const useMaps1 = () => {
  const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
  const [locationsObject, setLocationObject] =
    useState<LocationsObject>(INITIAL_LOCATION);
  const [libState, setLibState] = useState<LocationLibState>({
    isLoading: false,
    errorMessage: null,
  });
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const latestLocation = useRef<Location.LocationObjectCoords | null>(null);
  const latestTimestamp = useRef<number>(0);

  const askPermission = async (): Promise<boolean> => {
    const permissionResponse =
      await Location.requestForegroundPermissionsAsync();
    await Notifications.requestPermissionsAsync();
    if (permissionResponse.status === "granted") {
      return true;
    } else {
      return false;
    }
  };
  const getDistanceInMeters = (
    from: Location.LocationObjectCoords,
    to: Location.LocationObjectCoords,
  ) => {
    if (
      from.latitude == null ||
      from.longitude == null ||
      to.latitude == null ||
      to.longitude == null
    ) {
      return Infinity;
    }
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

      console.log(
        "check value before insert \n",
        "serviceName: ",
        serviceName,
        "\n",
        "isUpdateLocation: ",
        isUpdateLocation,
        "\n",
        "reason: ",
        reason,
        "\n",
        "timeStamp: ",
        timeStamp,
        "\n",
        "latitude: ",
        latitude,
        "\n",
        "longitude: ",
        longitude,
        "\n",
        "accuracy: ",
        accuracy,
        "\n",
        "diffLocation: ",
        diffLocation,
        "\n",
        "countDownTime: ",
        countDownTime,
        "\n",
        "batteryPercent: ",
        batteryPercent,
        "\n",
        "isBatteryCharging: ",
        isBatteryCharging,
        "\n",
      );
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "บันทึก Foreground ลงฐานข้อมูลแล้ว ",
          body: `ID ที่ได้คือ: ${result.lastInsertRowId}`,
        },
        trigger: null,
      });
      console.log(
        "✅ บันทึกข้อมูลลง SQLite สำเร็จ! ID ที่ได้คือ:",
        result.lastInsertRowId,
      );
    } catch (error) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "เกิดข้อผิดพลาดในการ Insert ข้อมูล: ",
          body: `${error}`,
        },
        trigger: null,
      });
      console.log("❌ เกิดข้อผิดพลาดในการ Insert ข้อมูล:", error);
    } finally {
      // ปิด database connection เมื่อเสร็จ
      if (db) {
        await db.closeAsync();
      }
    }
  };

  const updateDataDisplayAndUpdateLog = useCallback(
    async (location: Location.LocationObject, force = false) => {
      //console.log("Location : ", location);
      const newCoords = { ...location.coords };
      const newTimestamp = location.timestamp || Date.now();
      //const batteryPercent = await Battery.getBatteryLevelAsync();
      const batteryPercentRounded = Math.round(
        (await Battery.getBatteryLevelAsync()) * 100,
      );
      const isBatteryCharge = await Battery.getBatteryStateAsync();
      const distanceFromLastLocation = latestLocation.current
        ? getDistanceInMeters(latestLocation.current, newCoords)
        : 0;
      if (!latestLocation.current || force === true) {
        console.log("force update location because 15 minutes ");
        latestLocation.current = newCoords;
        latestTimestamp.current = newTimestamp;
        setLocationObject((prev) => ({
          ...prev,
          timestamp: newTimestamp,
          mocked: location.mocked,
          coords: newCoords,
          batteryPercent: batteryPercentRounded,
          isBatteryCharging: isBatteryCharge,
        }));
        insertDatabase({
          serviceName: "Foreground_GPS_Service",
          isUpdateLocation: 1,
          reason: "Force update due to 15 minutes no location change",
          timeStamp: location.timestamp,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          diffLocation: distanceFromLastLocation,
          countDownTime:
            locationsObject.countMins.toString() +
            "m " +
            locationsObject.countSecs.toString() +
            "s",
          batteryPercent: batteryPercentRounded,
          isBatteryCharging: isBatteryCharge,
        });
        return;
      }
      const distance = getDistanceInMeters(latestLocation.current, newCoords);
      setLocationObject((prev) => ({
        ...prev,
        diffMeters: distance,
      }));
      console.log("distancec = ", distance, "meters");
      if (distance > 200) {
        // ถ้าเคลื่อนที่เกิน 200 เมตร ถึงจะ update location ใหม่
        console.log("distance over 200 meters");
        latestLocation.current = newCoords;
        latestTimestamp.current = newTimestamp;
        setLocationObject((prev) => ({
          ...prev,
          timestamp: newTimestamp,
          mocked: location.mocked,
          coords: newCoords,
          batteryPercent: batteryPercentRounded,
          isBatteryCharging: isBatteryCharge,
        }));
        insertDatabase({
          serviceName: "Foreground_GPS_Service",
          isUpdateLocation: 1,
          reason: "Update due to distance change over 200 meters",
          timeStamp: location.timestamp,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          diffLocation: distanceFromLastLocation,
          countDownTime:
            locationsObject.countMins.toString() +
            "m " +
            locationsObject.countSecs.toString() +
            "s",
          batteryPercent: batteryPercentRounded,
          isBatteryCharging: isBatteryCharge,
        });
      } else {
        // function insert status isUpdate No  reason distance under 200
        insertDatabase({
          serviceName: "Foreground_GPS_Service",
          isUpdateLocation: 0,
          reason: "Not Update due to distance change under 200 meters",
          timeStamp: location.timestamp,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          diffLocation: distanceFromLastLocation,
          countDownTime:
            locationsObject.countMins.toString() +
            "m " +
            locationsObject.countSecs.toString() +
            "s",
          batteryPercent: batteryPercentRounded,
          isBatteryCharging: isBatteryCharge,
        });
        console.log(" distance under 200 meters, not update location");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const generateBatteryStatusDescription = (status: number | null) => {
    if (status === 1) {
      return "no charge";
    } else if (status === 2) {
      return "charging";
    } else if (status === 3) {
      return "full";
    } else {
      return "unknown";
    }
  };
  const formatTimeSinceLastUpdate = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      minutes: String(minutes),
      seconds: String(seconds).padStart(2, "0"),
    };
  };
  const updateTimeSinceLastUpdate = useCallback(() => {
    const timeSinceLastUpdateMs = Date.now() - latestTimestamp.current;
    const { minutes, seconds } = formatTimeSinceLastUpdate(
      timeSinceLastUpdateMs,
    );
    setLocationObject((prev) => ({
      ...prev,
      countMins: minutes,
      countSecs: seconds,
    }));
  }, []);
  const startGetCurrentLocation = useCallback(async () => {
    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 45000,
        distanceInterval: 0,
      },
      (location) => {
        console.log("45seconds passed subsribe new location ", location);
        updateDataDisplayAndUpdateLog(location);
      },
    );
  }, [updateDataDisplayAndUpdateLog]);
  const askPermissionThenGetLocation = useCallback(async () => {
    setLibState({ isLoading: true, errorMessage: null });
    try {
      const granted = await askPermission();
      if (!granted) {
        setLibState({
          isLoading: false,
          errorMessage: "Permission to access location was denied",
        });
        return;
      }
      await startGetCurrentLocation();
      setLibState({ isLoading: false, errorMessage: null });
    } catch (error: any) {
      console.error("Error:", error);
      setLibState({
        isLoading: false,
        errorMessage: error?.message ?? "Unknown error",
      });
    }
  }, [startGetCurrentLocation]);
  const keepAwakeActivate = async () => {
    try {
      await activateKeepAwakeAsync();
      console.log("useKeepAwake: บังคับเปิดหน้าจอค้างสำเร็จ ");
    } catch (e) {
      console.log("❌ useKeepAwake Error:", e);
    }
  };
  // --- useEffect: เริ่ม watch GPS ---
  useEffect(() => {
    askPermissionThenGetLocation();
    keepAwakeActivate();
    return () => {
      subscriptionRef.current?.remove();
    };
  }, [askPermissionThenGetLocation]);
  // --- useEffect: อัปเดต timer ทุก 1 วินาที + เช็ค force update ---
  useEffect(() => {
    const tickEverySecond = async () => {
      // 1. อัปเดต display นับเวลา
      updateTimeSinceLastUpdate();
      // 2. เช็คว่าถึงเวลา force update ไหม
      if (!latestTimestamp.current) {
        return;
      }
      const timeSinceLastUpdateMs = Date.now() - latestTimestamp.current;
      if (timeSinceLastUpdateMs < FIFTEEN_MINUTES_MS) {
        /*console.log(
          "timeSinLastUpdateMs = ",
          timeSinceLastUpdateMs,
          "\n",
          "FITEEN_MINUTES_MS = ",
          FIFTEEN_MINUTES_MS,
        );*/
        return;
      }
      // 3. ถ้าเกิน 15 นาที force get GPS เลย
      try {
        const granted = await askPermission();
        if (!granted) {
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        updateDataDisplayAndUpdateLog(location, true);
      } catch (error) {
        console.error("Force update error:", error);
      }
    };

    updateTimeSinceLastUpdate();
    const timerInterval = setInterval(tickEverySecond, 1000);

    return () => {
      clearInterval(timerInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTimeSinceLastUpdate, updateDataDisplayAndUpdateLog]);

  return {
    locationsObject,
    libState,
    generateBatteryStatusDescription,
  };
};

export { useMaps1 };
