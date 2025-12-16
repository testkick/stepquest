/**
 * MapLib - Native Implementation with Safe Loading
 * Attempts to load react-native-maps safely, falls back gracefully
 * Does NOT import react-native-maps at module load time to avoid TurboModule crashes
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, NativeModules } from 'react-native';

// Check if the native module is available BEFORE trying to import
const isMapModuleAvailable = (): boolean => {
  try {
    // Check if the native module exists in the NativeModules registry
    return !!(
      NativeModules.AIRMapManager ||
      NativeModules.AIRGoogleMapManager
    );
  } catch {
    return false;
  }
};

// Fallback component when map isn't available
const MapFallback: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[styles.fallbackContainer, style]}>
    <Text style={styles.fallbackText}>Map requires a development build</Text>
    <Text style={styles.fallbackSubtext}>
      Run `npx expo run:ios` or `npx expo run:android` to use maps
    </Text>
  </View>
);

// Placeholder Marker that renders children
const PlaceholderMarker: React.FC<any> = ({ children }) => <>{children}</>;

// Cache for loaded maps module
let cachedMaps: typeof import('react-native-maps') | null = null;
let loadAttempted = false;

// Load maps only when actually needed
const getMaps = (): typeof import('react-native-maps') | null => {
  if (loadAttempted) return cachedMaps;
  loadAttempted = true;

  if (!isMapModuleAvailable()) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedMaps = require('react-native-maps');
    return cachedMaps;
  } catch (error) {
    console.warn('Failed to load react-native-maps:', error);
    return null;
  }
};

// MapView component with lazy loading
const MapView = React.forwardRef<any, any>((props, ref) => {
  const { style, children, onMapReady, ...rest } = props;
  const [RNMapView, setRNMapView] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const internalRef = useRef<any>(null);

  // Load the map component
  useEffect(() => {
    const maps = getMaps();
    if (maps?.default) {
      setRNMapView(() => maps.default);
    }
    setIsReady(true);
  }, []);

  // Forward ref
  useEffect(() => {
    if (ref && internalRef.current) {
      if (typeof ref === 'function') {
        ref(internalRef.current);
      } else {
        (ref as React.MutableRefObject<any>).current = internalRef.current;
      }
    }
  }, [ref, RNMapView]);

  const handleMapReady = useCallback(() => {
    onMapReady?.();
  }, [onMapReady]);

  // Loading state
  if (!isReady) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Fallback when maps not available
  if (!RNMapView) {
    return <MapFallback style={style} />;
  }

  return (
    <RNMapView
      ref={internalRef}
      style={style}
      onMapReady={handleMapReady}
      {...rest}
    >
      {children}
    </RNMapView>
  );
});

MapView.displayName = 'MapView';

// Marker wrapper that loads the actual Marker lazily
const Marker: React.FC<any> = (props) => {
  const { children, ...rest } = props;
  const ActualMarker = useMemo(() => {
    const maps = getMaps();
    return maps?.Marker || PlaceholderMarker;
  }, []);

  return <ActualMarker {...rest}>{children}</ActualMarker>;
};

// PROVIDER_GOOGLE - exported as undefined since we load maps lazily
// For development builds, the actual value will be used when getMaps() is called
const PROVIDER_GOOGLE = undefined as any;

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
