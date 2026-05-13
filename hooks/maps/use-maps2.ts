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

const formatTimeSinceLastUpdate = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    minutes: String(minutes),
    seconds: String(seconds).padStart(2, "0"),
  };
};

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
//const FIFTEEN_MINUTES_MS = 1 * 60 * 1000;
const useMaps2 = () => {
  const [locationsObject, setLocationObject] =
    useState<LocationsObject>(INITIAL_LOCATION);
  const [libState, setLibState] = useState<LocationLibState>({
    isLoading: false,
    errorMessage: null,
  });

  // refs
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastCoordsRef = useRef<Location.LocationObjectCoords | null>(null);
  const lastTimestampRef = useRef<number>(0);

  // --- helper functions ---
  const askPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  };

  const updateTimeSinceLastUpdate = useCallback(() => {
    const timeSinceLastUpdateMs = Date.now() - lastTimestampRef.current;
    const { minutes, seconds } = formatTimeSinceLastUpdate(
      timeSinceLastUpdateMs,
    );
    setLocationObject((prev) => ({
      ...prev,
      countMins: minutes,
      countSecs: seconds,
    }));
  }, []);

  const saveLocation = useCallback(
    (location: Location.LocationObject, force = false) => {
      const newCoords = { ...location.coords };
      const newTimestamp = location.timestamp || Date.now();

      if (!lastCoordsRef.current || force) {
        lastCoordsRef.current = newCoords;
        lastTimestampRef.current = newTimestamp;
        setLocationObject((prev) => ({
          ...prev,
          timestamp: newTimestamp,
          mocked: location.mocked,
          coords: newCoords,
        }));
        return;
      }

      const distance = getDistanceInMeters(lastCoordsRef.current, newCoords);
      if (distance >= 200) {
        lastCoordsRef.current = newCoords;
        lastTimestampRef.current = newTimestamp;
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

  // --- useEffect: เริ่ม watch GPS ---
  useEffect(() => {
    const startWatching = async () => {
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 45000,
          distanceInterval: 0,
        },
        (location) => {
          saveLocation(location);
        },
      );
    };

    const getLocations = async () => {
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
        await startWatching();
        setLibState({ isLoading: false, errorMessage: null });
      } catch (error: any) {
        console.error("Error:", error);
        setLibState({
          isLoading: false,
          errorMessage: error?.message ?? "Unknown error",
        });
      }
    };

    getLocations();

    return () => {
      subscriptionRef.current?.remove();
    };
  }, [saveLocation]);

  // --- useEffect: อัปเดต timer ทุก 1 วินาที ---
  useEffect(() => {
    updateTimeSinceLastUpdate();
    const timerInterval = setInterval(updateTimeSinceLastUpdate, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [updateTimeSinceLastUpdate]);

  // --- useEffect: force อัปเดต GPS ทุก 15 นาที ---
  useEffect(() => {
    const forceUpdateLocation = async () => {
      if (!lastTimestampRef.current) {
        return;
      }

      const timeSinceLastUpdateMs = Date.now() - lastTimestampRef.current;
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
        saveLocation(location, true);
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
  }, [saveLocation]);

  return {
    locationsObject,
    libState,
  };
};

export { useMaps2 };
