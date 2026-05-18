import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LOCATION_TASK_NAME } from "@/tasks/location-task";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Button, StyleSheet } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

const Maps2 = () => {
  const checkTask = async () => {
    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 checktask",
        body: `registered: ${isRegistered}`,
      },
      trigger: null,
    });
    console.log("Task registered:", isRegistered);
  };

  const testNotification = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission denied");
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔Manual โนติ",
        body: `ขณะนี้เวลา ${new Date().toLocaleTimeString("th-TH", {
          timeZone: "Asia/Bangkok",
          hour12: false,
        })} น.`,
      },
      trigger: null,
    });
    console.log("Notification sent!");
  };

  const startTracking = async () => {
    // ขอ permission
    const { status: fgStatus } =
      await Location.requestForegroundPermissionsAsync();
    console.log("Foreground permission:", fgStatus);
    if (fgStatus !== "granted") {
      return;
    }
    const { status: bgStatus } =
      await Location.requestBackgroundPermissionsAsync();
    console.log("Background permission:", bgStatus);
    if (bgStatus !== "granted") {
      return;
    }
        await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 เริ่ม tacking",
        body: `Foreground permission: ${fgStatus} \nBackground permission: ${bgStatus}`,
      },
      trigger: null,
    });
    /*
    // ยิง noti ทันทีเพื่อทดสอบ
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🟢 เริ่ม Tracking แล้ว",
        body: `เวลา ${new Date().toLocaleTimeString("th-TH", {
          timeZone: "Asia/Bangkok",
          hour12: false,
        })} น.`,
      },
      trigger: null,
    });*/

    // เริ่ม background task
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Low,
        timeInterval: 10000,
        distanceInterval: 0,
        foregroundService: {
          notificationTitle: "📍 Tracking Location",
          notificationBody: "Running in background...",
        },
      });
      console.log("startLocationUpdatesAsync success");
    } catch (error) {
      console.error("startLocationUpdatesAsync error:", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">ทดสอบ Notification</ThemedText>
      <Button title="กดทดสอบ Noti" onPress={testNotification} />
      <Button title="เริ่ม Tracking" onPress={startTracking} />
      <Button title="เช็ค Task" onPress={checkTask} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 16, gap: 16 },
});

export default Maps2;
