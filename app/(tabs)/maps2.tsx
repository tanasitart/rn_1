import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LOCATION_TASK_NAME } from "@/tasks/location-task";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Button, StyleSheet } from "react-native";
//import * as FileSystem from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
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
  // 📥 ฟังก์ชันแชร์ไฟล์ DB เวอร์ชันแก้ไขไร้เงา Alert
  const exportDatabase_foreground = async () => {
    const dbName = "rn_1_foreground.db";
    try {
      const dbFilePath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

      // 1. เช็คไฟล์ ถ้าไม่เจอ -> ยิง Noti ด้านบนจอ
      const fileInfo = await FileSystem.getInfoAsync(dbFilePath);
      if (!fileInfo.exists) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "❌ ไม่พบไฟล์ฐานข้อมูล",
            body: `ยังไม่มีไฟล์ ${dbName} ถูกสร้างขึ้นในเครื่องนี้`,
          },
          trigger: null,
        });
        return;
      }
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(dbFilePath, {
          mimeType: "application/x-sqlite3",
          dialogTitle: `ส่งออกไฟล์ฐานข้อมูล ${dbName}`,
        });
      } else {
        // ถ้าแชร์ไม่ได้ -> ยิง Noti บอกแทน
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "⚠️ ล้มเหลว",
            body: "เครื่องนี้ไม่รองรับระบบการแชร์ไฟล์",
          },
          trigger: null,
        });
      }
    } catch (error: any) {
      console.error("Export DB Error:", error);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "❌ เกิดข้อผิดพลาด",
          body: error?.message ?? "ดึงไฟล์ฐานข้อมูลไม่ได้",
        },
        trigger: null,
      });
    }
  };
  const exportDatabase_background = async () => {
    const dbName = "rn_1_background.db";
    try {
      const dbFilePath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

      // 1. เช็คไฟล์ ถ้าไม่เจอ -> ยิง Noti ด้านบนจอ
      const fileInfo = await FileSystem.getInfoAsync(dbFilePath);
      if (!fileInfo.exists) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "❌ ไม่พบไฟล์ฐานข้อมูล",
            body: `ยังไม่มีไฟล์ ${dbName} ถูกสร้างขึ้นในเครื่องนี้`,
          },
          trigger: null,
        });
        return;
      }
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(dbFilePath, {
          mimeType: "application/x-sqlite3",
          dialogTitle: `ส่งออกไฟล์ฐานข้อมูล ${dbName}`,
        });
      } else {
        // ถ้าแชร์ไม่ได้ -> ยิง Noti บอกแทน
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "⚠️ ล้มเหลว",
            body: "เครื่องนี้ไม่รองรับระบบการแชร์ไฟล์",
          },
          trigger: null,
        });
      }
    } catch (error: any) {
      console.error("Export DB Error:", error);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "❌ เกิดข้อผิดพลาด",
          body: error?.message ?? "ดึงไฟล์ฐานข้อมูลไม่ได้",
        },
        trigger: null,
      });
    }
  };
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">ทดสอบ Notification</ThemedText>
      <Button title="กดทดสอบ Noti" onPress={testNotification} />
      <Button title="เริ่ม Tracking" onPress={startTracking} />
      <Button title="เช็ค Task" onPress={checkTask} />
      <Button
        title="แชร์ rn_1_foreground Database"
        onPress={() => exportDatabase_foreground()}
        color="#4CAF50"
      />
      <Button
        title="แชร์ rn_1_background Database"
        onPress={() => exportDatabase_background()}
        color="#4CAF50"
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 16, gap: 16 },
});

export default Maps2;
