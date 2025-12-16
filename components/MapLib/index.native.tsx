/**
 * MapLib - Native Map Implementation
 * This file is only loaded on iOS/Android with development builds
 * Uses lazy loading to avoid TurboModule crashes in Expo Go
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ViewStyle } from 'react-native';
import Constants from 'expo-constants';

// Check if we're in Expo Go
const isExpoGo = Constants?.appOwnership === 'expo';

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

// Placeholder Polyline that renders nothing
const PlaceholderPolyline: React.FC<Record<string, unknown>> = () => null;

// Cache for lazy-loaded maps module - only attempt once
let cachedMaps: typeof import('react-native-maps') | null = null;
let loadAttempted = false;
let loadSuccessful = false;

// Load maps only in dev builds (not Expo Go)
const getMaps = (): typeof import('react-native-maps') | null => {
  // Never try to load in Expo Go
  if (isExpoGo) {
    return null;
  }

  if (loadAttempted) {
    return loadSuccessful ? cachedMaps : null;
  }

  loadAttempted = true;

  try {
    // Dynamic require - only executed in dev builds
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedMaps = require('react-native-maps');
    loadSuccessful = true;
    return cachedMaps;
  } catch (error) {
    console.warn('Failed to load react-native-maps:', error);
    loadSuccessful = false;
    return null;
  }
};

// MapView component with lazy loading
const MapView = React.forwardRef<View, Record<string, unknown>>((props, ref) => {
  const { style, children, onMapReady, ...rest } = props;
  const [RNMapView, setRNMapView] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const internalRef = useRef<View>(null);

  const viewStyle = style as ViewStyle | undefined;

  // Load the map component
  useEffect(() => {
    // In Expo Go, immediately show fallback
    if (isExpoGo) {
      setIsReady(true);
      // Call onMapReady for Expo Go fallback
      if (onMapReady && typeof onMapReady === 'function') {
        setTimeout(() => (onMapReady as () => void)(), 100);
      }
      return;
    }

    const maps = getMaps();
    if (maps?.default) {
      setRNMapView(() => maps.default as unknown as React.ComponentType<Record<string, unknown>>);
    }
    setIsReady(true);
  }, [onMapReady]);

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
      return maps.Marker as unknown as React.ComponentType<Record<string, unknown>>;
    }
    return PlaceholderMarker;
  }, []);

  return <ActualMarker {...rest}>{children}</ActualMarker>;
};

// Define prop types for Polyline
interface PolylineProps {
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
  strokeColor?: string;
  strokeWidth?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  lineDashPattern?: number[];
  geodesic?: boolean;
  [key: string]: unknown;
}

// Polyline wrapper that loads the actual Polyline lazily
const Polyline: React.FC<PolylineProps> = (props) => {
  const ActualPolyline = useMemo(() => {
    if (isExpoGo) return PlaceholderPolyline;
    const maps = getMaps();
    if (maps?.Polyline) {
      return maps.Polyline as unknown as React.ComponentType<Record<string, unknown>>;
    }
    return PlaceholderPolyline;
  }, []);

  return <ActualPolyline {...props} />;
};

// PROVIDER_GOOGLE - only defined for Android dev builds
const PROVIDER_GOOGLE = Platform.OS === 'android' && !isExpoGo ? 'google' : undefined;

export { Marker, Polyline, PROVIDER_GOOGLE };
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
