import { StyleSheet, View, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMaps } from "@/hooks/maps/use-maps";

import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
const formatTime = (timestamp: number) => {
  if (!timestamp) return "--:--:--";
  return new Date(timestamp).toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const InfoChip = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.chip}>
    <ThemedText style={styles.chipLabel}>{label}</ThemedText>
    <ThemedText style={styles.chipValue}>{value}</ThemedText>
  </View>
);

const Map2 = () => {
  const { locationsObject, libState } = useMaps();
  const colorScheme = useColorScheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        My Location
      </ThemedText>

      {libState.isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? "light"].tint}
          />
          <ThemedText style={styles.loadingText}>
            Getting location...
          </ThemedText>
        </View>
      ) : (
        <>
          {/* Info Bar */}
          <View style={styles.infoBar}>
            <InfoChip
              label="Lat"
              value={locationsObject.coords.latitude?.toFixed(6) ?? "—"}
            />
            <InfoChip
              label="Lng"
              value={locationsObject.coords.longitude?.toFixed(6) ?? "—"}
            />
            <InfoChip
              label="Accuracy"
              value={
                locationsObject.coords.accuracy
                  ? `${locationsObject.coords.accuracy.toFixed(0)}m`
                  : "—"
              }
            />
            <InfoChip
              label="Heading"
              value={
                locationsObject.coords.heading
                  ? `${locationsObject.coords.heading.toFixed(0)}°`
                  : "—"
              }
            />
            <InfoChip
              label="Last Updated"
              value={formatTime(locationsObject.timestamp)}
            />
          </View>
          {/* Map placeholder — ใส่ MapView ตรงนี้ 
                    <View style={styles.mapPlaceholder}>
                      <ThemedText style={styles.mapPlaceholderText}>
                        🗺️ Google Maps{"\n"}(ต้องการ react-native-maps + API Key)
                      </ThemedText>
                    </View>
                    */}

          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={
              locationsObject.coords.latitude &&
              locationsObject.coords.longitude
                ? {
                    latitude: locationsObject.coords.latitude,
                    longitude: locationsObject.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }
                : {
                    latitude: 13.736717,
                    longitude: 100.523186,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }
            }
          >
            {locationsObject.coords.latitude &&
            locationsObject.coords.longitude ? (
              <Marker
                coordinate={{
                  latitude: locationsObject.coords.latitude,
                  longitude: locationsObject.coords.longitude,
                }}
                title="ตำแหน่งของคุณ"
                description={`Lat ${locationsObject.coords.latitude.toFixed(6)}, Lng ${locationsObject.coords.longitude.toFixed(6)}`}
              />
            ) : null}
          </MapView>
        </>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { marginBottom: 12 },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { marginTop: 12 },
  infoBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: "#1565c0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  },
  map: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#e8f0fe",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    textAlign: "center",
    color: "#5c6bc0",
    fontSize: 16,
  },
});

export default Map2;
