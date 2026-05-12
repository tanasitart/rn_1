import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface UseLocationReturn {
  location: LocationCoords | null;
  loading: boolean;
  error: string | null;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        // ขอ permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) {
            setError('Permission to access location was denied');
            setLoading(false);
          }
          return;
        }

        // Subscribe ไปที่ location changes (real-time)
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000, // update ทุก 1 วินาที
            distanceInterval: 1, // หรือ update ทุกครั้งที่เคลื่อนที่ 1 เมตร
          },
          (position) => {
            if (mounted) {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
              setError(null);
              setLoading(false);
            }
          }
        );
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to get location');
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { location, loading, error };
}
