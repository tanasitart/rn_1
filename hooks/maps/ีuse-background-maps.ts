import { useEffect, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { LOCATION_TASK_NAME } from "@/tasks/location-task";

const useBackgroundMaps = () => {
  const [isTracking, setIsTracking] = useState(false);

  const requestPermissions = async (): Promise<boolean> => {
    const { status: fgStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      return false;
    }

    const { status: bgStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      return false;
    }

    await Notifications.requestPermissionsAsync();
    return true;
  };

  const startTracking = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 45000,
      distanceInterval: 0,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "📍 Tracking Location",
        notificationBody: "Running in background...",
      },
    });

    setIsTracking(true);
  };

  const stopTracking = async () => {
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    setIsTracking(false);
  };

  useEffect(() => {
    const checkIsTracking = async () => {
      const isRegistered =
        await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      setIsTracking(isRegistered);
    };
    checkIsTracking();
  }, []);

  return { isTracking, startTracking, stopTracking };
};

export { useBackgroundMaps };