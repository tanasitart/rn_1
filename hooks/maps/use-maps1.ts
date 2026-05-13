import { useEffect, useState, useRef, useCallback } from "react";
import * as Location from "expo-location";

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
  diffMeters : number
}

interface LocationLibState {
  isLoading: boolean;
  errorMessage: string | null;
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
  diffMeters : 0,
};

const useMaps1 = () => {
  // const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
  const FIFTEEN_MINUTES_MS = 5 * 60 * 1000;
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

  const updateDataDisplay = useCallback(
    (location: Location.LocationObject, force = false) => {
      //console.log("Location : ", location);
      const newCoords = { ...location.coords };
      const newTimestamp = location.timestamp || Date.now();

      if (!latestLocation.current || force === true) {
        latestLocation.current = newCoords;
        latestTimestamp.current = newTimestamp;
        setLocationObject((prev) => ({
          ...prev,
          timestamp: newTimestamp,
          mocked: location.mocked,
          coords: newCoords,
        }));
        return;
      }
      const distance = getDistanceInMeters(latestLocation.current, newCoords);
      setLocationObject((prev) => ({
        ...prev,
        diffMeters: distance,
      }));
      console.log("distancec = ", distance, "meters");
      if (distance >= 5) {
        console.log(" distance over 5 meters");
        latestLocation.current = newCoords;
        latestTimestamp.current = newTimestamp;
        setLocationObject((prev) => ({
          ...prev,
          timestamp: newTimestamp,
          mocked: location.mocked,
          coords: newCoords,
        }));
      }
    },
    [],
  );
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
        timeInterval: 20000,
        distanceInterval: 0,
      },
      (location) => {
        console.log("Location already got 20 seconds");
        updateDataDisplay(location);
      },
    );
  }, [updateDataDisplay]);
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

  // --- useEffect: เริ่ม watch GPS ---
  useEffect(() => {
    askPermissionThenGetLocation();
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
        console.log(
          "timeSinLastUpdateMs = ",
          timeSinceLastUpdateMs,
          "\n",
          "FITEEN_MINUTES_MS = ",
          FIFTEEN_MINUTES_MS,
        );
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
        updateDataDisplay(location, true);
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
  }, [updateTimeSinceLastUpdate, updateDataDisplay]);
  /*
  // --- useEffect: อัปเดต timer ทุก 1 วินาที ---
  useEffect(() => {
    updateTimeSinceLastUpdate();
    const timerInterval = setInterval(updateTimeSinceLastUpdate, 1000);
    return () => {
      clearInterval(timerInterval);
    };
  }, [updateTimeSinceLastUpdate]);
*/

  /*
  // --- useEffect: force อัปเดต GPS ทุก 15 นาที ---
  useEffect(() => {
    const forceUpdateLocation = async () => {
      if (!latestTimestamp.current) {
        return;
      }
      const timeSinceLastUpdateMs = Date.now() - latestTimestamp.current;
      console.log("Time since last update (ms):", timeSinceLastUpdateMs);
      console.log("FIFTEEN_MINUTES_MS:", FIFTEEN_MINUTES_MS); // เพิ่มตรงนี้
      if (timeSinceLastUpdateMs < FIFTEEN_MINUTES_MS) {
        return;
      }
      try {
        const granted = await askPermission();
        if (!granted) {
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        updateDataDisplay(location, true);
      } catch (error) {
        console.error("Force update error:", error);
      }
    };
    const forceUpdateInterval = setInterval(
      forceUpdateLocation,
      FIFTEEN_MINUTES_MS,
    );
    return () => {
      clearInterval(forceUpdateInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestTimestamp.current, updateDataDisplay]);
  */
  return {
    locationsObject,
    libState,
  };
};

export { useMaps1 };
