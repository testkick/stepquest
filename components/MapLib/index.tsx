/**
 * MapLib - Safe Map Loading for Expo
 * Detects Expo Go and renders fallback, only loads react-native-maps in dev builds
 * Uses lazy loading to completely avoid TurboModule crashes in Expo Go
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ViewStyle } from 'react-native';

// Safely check if we're in Expo Go
let isExpoGo = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Constants = require('expo-constants').default;
  isExpoGo = Constants?.appOwnership === 'expo';
} catch {
  // If expo-constants fails, assume we might be in Expo Go
  isExpoGo = true;
}

// Fallback component when map isn't available
const MapFallback: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.fallbackContainer, style]}>
    <Text style={styles.fallbackText}>Map requires a development build</Text>
    <Text style={styles.fallbackSubtext}>
      Run `npx expo run:ios` or `npx expo run:android` to use maps
    </Text>
  </View>
);

// Placeholder Marker that renders children
const PlaceholderMarker: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

// Cache for lazy-loaded maps module
let cachedMaps: Record<string, unknown> | null = null;
let loadAttempted = false;

// Load maps only when actually needed and only in dev builds
const getMaps = (): Record<string, unknown> | null => {
  // Never try to load in Expo Go
  if (isExpoGo) {
    return null;
  }

  if (loadAttempted) return cachedMaps;
  loadAttempted = true;

  try {
    // Dynamic require - only executed in dev builds
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedMaps = require('react-native-maps') as Record<string, unknown>;
    return cachedMaps;
  } catch (error) {
    console.warn('Failed to load react-native-maps:', error);
    return null;
  }
};

// MapView component with lazy loading
const MapView = React.forwardRef<View, Record<string, unknown>>((props, ref) => {
  const { style, children, onMapReady, ...rest } = props;
  const [RNMapView, setRNMapView] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const internalRef = useRef<View>(null);

  // Cast style to ViewStyle for type safety
  const viewStyle = style as ViewStyle | undefined;

  // Load the map component
  useEffect(() => {
    // Skip loading in Expo Go
    if (isExpoGo) {
      setIsReady(true);
      return;
    }

    const maps = getMaps();
    if (maps?.default) {
      setRNMapView(() => maps.default as React.ComponentType<Record<string, unknown>>);
    }
    setIsReady(true);
  }, []);

  // Forward ref
  useEffect(() => {
    if (ref && internalRef.current) {
      if (typeof ref === 'function') {
        ref(internalRef.current);
      } else {
        (ref as React.MutableRefObject<View | null>).current = internalRef.current;
      }
    }
  }, [ref, RNMapView]);

  const handleMapReady = useCallback(() => {
    if (onMapReady && typeof onMapReady === 'function') {
      (onMapReady as () => void)();
    }
  }, [onMapReady]);

  // Loading state
  if (!isReady) {
    return (
      <View style={[styles.fallbackContainer, viewStyle]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Fallback when maps not available (Expo Go or error)
  if (!RNMapView) {
    return <MapFallback style={viewStyle} />;
  }

  const ActualMapView = RNMapView;

  return (
    <ActualMapView
      ref={internalRef}
      style={style}
      onMapReady={handleMapReady}
      {...rest}
    >
      {children}
    </ActualMapView>
  );
});

MapView.displayName = 'MapView';

// Define prop types for Marker
interface MarkerProps {
  children?: React.ReactNode;
  coordinate?: {
    latitude: number;
    longitude: number;
  };
  anchor?: { x: number; y: number };
  flat?: boolean;
  [key: string]: unknown;
}

// Marker wrapper that loads the actual Marker lazily
const Marker: React.FC<MarkerProps> = (props) => {
  const { children, ...rest } = props;
  const ActualMarker = useMemo(() => {
    if (isExpoGo) return PlaceholderMarker;
    const maps = getMaps();
    if (maps?.Marker) {
      return maps.Marker as React.ComponentType<Record<string, unknown>>;
    }
    return PlaceholderMarker;
  }, []);

  return <ActualMarker {...rest}>{children}</ActualMarker>;
};

// PROVIDER_GOOGLE - exported as undefined for compatibility
// In dev builds, the actual value will be used when getMaps() is called
const PROVIDER_GOOGLE = Platform.OS === 'android' && !isExpoGo ? 'google' : undefined;

export { Marker, PROVIDER_GOOGLE };
export default MapView;

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5dc',
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#263238',
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#263238',
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#263238',
    opacity: 0.6,
  },
});
