import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "../use-location";
import * as Location from "expo-location";

interface LocationsObject {
  timestamp: number;
  mocked?: boolean;
  coords: {
    altitude: number | null; // height from sea level in meters
    heading: number | null; // north = 0, east = 90, south = 180, west = 270
    altitudeAccuracy: number | null; // accuracy of altitude in meters
    latitude: number | null;
    speed: number | null; // m/s
    longitude: number | null;
    accuracy: number | null;
  };
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
};
const useMaps = () => {
  const [locationsObject, setLocationObject] =
    useState<LocationsObject>(INITIAL_LOCATION);
  const [libState, setLibState] = useState<LocationLibState>({
    isLoading: false,
    errorMessage: null,
  });
  // เก็บ subscription เพื่อ cleanup ตอน unmount
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const askPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  };
  const startWatching = async () => {
    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 0,
      },
      (location) => {
        console.log("Location:", location);
        setLocationObject({
          timestamp: location.timestamp,
          mocked: location.mocked,
          coords: { ...location.coords },
        });
      },
    );
  };

  const getLocations = useCallback(async () => {
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
  }, []); // ใส่ [] เพราะไม่มี dependency
  useEffect(() => {
    getLocations();

    // cleanup: หยุด watch ตอน component unmount
    return () => {
      subscriptionRef.current?.remove();
    };
  }, [getLocations]);

  useEffect(() => {
    console.log("update Location Object : ", locationsObject);
  }, [locationsObject]);
  return {
    locationsObject,
    libState,
  };
};

export { useMaps };
