import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import { useRendering, RenderItem } from "@/hooks/maps/use-rendering";

const Rendering = () => {
  const { components, addComponent } = useRendering();

  const InfoChip = ({ item }: { item: RenderItem }) => (
    <View style={styles.chip}>
      <ThemedText style={styles.chipLabel}>{item.label}</ThemedText>
      <ThemedText style={styles.chipValue}>{item.value}</ThemedText>
    </View>
  );

  return (
    // ☀️ กลับมาใช้ ThemedView คลุมรอบนอกสุดเพื่อดึงสีธีมสว่างของระบบ
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
      >
        <ThemedText type="title" style={styles.title}>
          Rendering Test
        </ThemedText>

        {/* แถวปุ่มกดแยกหน้าที่ */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={() => addComponent(1)}>
            <ThemedText style={styles.buttonText}>+1 comp</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => addComponent(2)}>
            <ThemedText style={styles.buttonText}>+2 comp</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => addComponent(5)}>
            <ThemedText style={styles.buttonText}>+5 comp</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => addComponent(10)}>
            <ThemedText style={styles.buttonText}>+10 comp</ThemedText>
          </TouchableOpacity>
        </View>

        {/* หน้าจอวาดกล่องข้อมูลตามอาเรย์ */}
        {components.map((item) => (
          <View key={item.id} style={styles.infoBar}>
            <InfoChip item={item} />
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  // เอาสีดำออกหมดแล้วครับ กลับมาสว่างคลีนตามใจพี่สั่ง
  container: { 
    flex: 1, 
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: { marginBottom: 12 },

  // แถวปุ่มกว้างเต็มหน้าจอแบ่งสัดส่วนเท่ากัน
  buttonRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
    width: "100%",
  },
  button: {
    flex: 1,
    backgroundColor: "#0d47a1",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },

  // กล่องข้อมูลความกว้างเต็ม 100%
  infoBar: {
    width: "100%",
    marginBottom: 12,
  },
  chip: {
    backgroundColor: "#1565c0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "100%",
  },
  chipLabel: {
    fontSize: 10,
    color: "#90caf9",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  chipValue: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "bold",
    fontFamily: "Courier New",
    marginTop: 2,
  },
});

export default Rendering;