import { LOCATION_TASK_NAME } from "@/tasks/location-task";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { useEffect, useState } from "react";

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

    const { status: notiStatus } =
      await Notifications.requestPermissionsAsync();
    if (notiStatus !== "granted") {
      return false;
    }

    return true;
  };

  const startTracking = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000,
      distanceInterval: 0,
      foregroundService: {
        notificationTitle: "📍 Tracking Location",
        notificationBody: "กำลัง tracking GPS อยู่เบื้องหลัง",
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

