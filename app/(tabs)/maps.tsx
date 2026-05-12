import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useLocation } from '@/hooks/use-location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useMaps } from '@/hooks/maps/use-maps';
export default function MapsScreen() {
  const { location, loading, error } = useLocation();
  const colorScheme = useColorScheme();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">My Location</ThemedText>
      </View>

      {loading && (
        <View style={styles.centerContent}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? 'light'].tint}
          />
          <ThemedText style={styles.loadingText}>Getting location...</ThemedText>
        </View>
      )}

      {error && (
        <View style={styles.centerContent}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      {location && !loading && (
        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <ThemedText type="subtitle">Latitude</ThemedText>
            <ThemedText type="default" style={styles.coordValue}>
              {location.latitude.toFixed(6)}
            </ThemedText>
          </View>

          <View style={styles.infoBox}>
            <ThemedText type="subtitle">Longitude</ThemedText>
            <ThemedText type="default" style={styles.coordValue}>
              {location.longitude.toFixed(6)}
            </ThemedText>
          </View>

          {location.accuracy && (
            <View style={styles.infoBox}>
              <ThemedText type="subtitle">Accuracy</ThemedText>
              <ThemedText type="default" style={styles.coordValue}>
                {location.accuracy.toFixed(2)} meters
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    fontSize: 16,
  },
  infoContainer: {
    flex: 1,
    paddingVertical: 24,
    gap: 16,
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  coordValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    fontFamily: 'Courier New',
  },
});
