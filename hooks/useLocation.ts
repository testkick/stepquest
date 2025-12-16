import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
}

interface UseLocationResult {
  location: LocationState | null;
  errorMsg: string | null;
  isLoading: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

const DEFAULT_LOCATION: LocationState = {
  latitude: 37.78825,
  longitude: -122.4324,
  accuracy: null,
  heading: null,
};

export const useLocation = (): UseLocationResult => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Please enable it in settings.');
        setHasPermission(false);
        setIsLoading(false);
        return false;
      }

      setHasPermission(true);
      return true;
    } catch (error) {
      setErrorMsg('Failed to request location permission');
      setHasPermission(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      const granted = await requestPermission();

      if (!granted) {
        // Use default location for preview
        setLocation(DEFAULT_LOCATION);
        setIsLoading(false);
        return;
      }

      try {
        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
          heading: currentLocation.coords.heading,
        });

        // Subscribe to location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or when moved 10 meters
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              accuracy: newLocation.coords.accuracy,
              heading: newLocation.coords.heading,
            });
          }
        );
      } catch (error) {
        setErrorMsg('Failed to get location');
        setLocation(DEFAULT_LOCATION);
      } finally {
        setIsLoading(false);
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [requestPermission]);

  return {
    location,
    errorMsg,
    isLoading,
    hasPermission,
    requestPermission,
  };
};

export default useLocation;
