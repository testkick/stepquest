/**
 * MapLib - Native Map Implementation
 * This file is loaded on iOS/Android for development builds
 * Uses standard require for react-native-maps with robust error handling
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ViewStyle } from 'react-native';

// Type definitions for react-native-maps
type MapViewType = React.ComponentType<Record<string, unknown>>;
type MarkerType = React.ComponentType<Record<string, unknown>>;
type PolylineType = React.ComponentType<Record<string, unknown>>;

// Maps module interface
interface MapsModule {
  default: MapViewType;
  Marker: MarkerType;
  Polyline: PolylineType;
  PROVIDER_GOOGLE: string | undefined;
}

// Load the maps module with error handling
let mapsModule: MapsModule | null = null;
let loadError: Error | null = null;

try {
  // Standard require - bundler can see this dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require('react-native-maps');
  mapsModule = {
    default: maps.default,
    Marker: maps.Marker,
    Polyline: maps.Polyline,
    PROVIDER_GOOGLE: maps.PROVIDER_GOOGLE,
  };
} catch (error) {
  loadError = error instanceof Error ? error : new Error('Failed to load react-native-maps');
  console.warn('react-native-maps not available:', loadError.message);
}

// Fallback component when map isn't available
const MapFallback: React.FC<{ style?: ViewStyle; error?: string }> = ({ style, error }) => (
  <View style={[styles.fallbackContainer, style]}>
    <Text style={styles.fallbackText}>Map requires a development build</Text>
    <Text style={styles.fallbackSubtext}>
      Run `npx expo run:ios` or `npx expo run:android` to use maps
    </Text>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Placeholder Marker that renders children
const PlaceholderMarker: React.FC<{ children?: React.ReactNode; [key: string]: unknown }> = ({ children }) => <>{children}</>;

// Placeholder Polyline that renders nothing
const PlaceholderPolyline: React.FC<Record<string, unknown>> = () => null;

// MapView component with proper native maps integration
const MapView = React.forwardRef<View, Record<string, unknown>>((props, ref) => {
  const { style, children, onMapReady, ...rest } = props;
  const [isReady, setIsReady] = useState(false);
  const internalRef = useRef<View>(null);

  const viewStyle = style as ViewStyle | undefined;

  // Check if maps are available
  const RNMapView = mapsModule?.default;

  useEffect(() => {
    setIsReady(true);

    // If maps not available, call onMapReady for fallback
    if (!RNMapView && onMapReady && typeof onMapReady === 'function') {
      setTimeout(() => (onMapReady as () => void)(), 100);
    }
  }, [RNMapView, onMapReady]);

  // Forward ref
  useEffect(() => {
    if (ref && internalRef.current) {
      if (typeof ref === 'function') {
        ref(internalRef.current);
      } else {
        (ref as React.MutableRefObject<View | null>).current = internalRef.current;
      }
    }
  }, [ref]);

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

  // Fallback when maps not available
  if (!RNMapView) {
    return <MapFallback style={viewStyle} error={loadError?.message} />;
  }

  // Render actual MapView
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

// Marker wrapper that uses actual Marker if available
const Marker: React.FC<MarkerProps> = (props) => {
  const { children, ...rest } = props;
  const ActualMarker = useMemo(() => {
    return mapsModule?.Marker || PlaceholderMarker;
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

// Polyline wrapper that uses actual Polyline if available
const Polyline: React.FC<PolylineProps> = (props) => {
  const ActualPolyline = useMemo(() => {
    return mapsModule?.Polyline || PlaceholderPolyline;
  }, []);

  return <ActualPolyline {...props} />;
};

// PROVIDER_GOOGLE - only defined for Android when maps are available
const PROVIDER_GOOGLE = Platform.OS === 'android' ? mapsModule?.PROVIDER_GOOGLE : undefined;

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
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 8,
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
