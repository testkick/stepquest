/**
 * MapLib - Safe Map Loading for Expo
 * Base implementation (Web/Fallback)
 * Native platforms will use index.native.tsx instead
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

// Fallback component when map isn't available
const MapFallback: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.fallbackContainer, style]}>
    <Text style={styles.fallbackText}>Map requires a development build</Text>
    <Text style={styles.fallbackSubtext}>
      Run `npx expo run:ios` or `npx expo run:android` to use maps
    </Text>
  </View>
);

// MapView fallback - renders the fallback component
const MapView = React.forwardRef<View, Record<string, unknown>>((props, _ref) => {
  const { style, onMapReady } = props;
  const viewStyle = style as ViewStyle | undefined;

  // Call onMapReady immediately for web fallback
  React.useEffect(() => {
    if (onMapReady && typeof onMapReady === 'function') {
      (onMapReady as () => void)();
    }
  }, [onMapReady]);

  return <MapFallback style={viewStyle} />;
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

// Placeholder Marker that renders children
const Marker: React.FC<MarkerProps> = ({ children }) => <>{children}</>;

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

// Placeholder Polyline that renders nothing
const Polyline: React.FC<PolylineProps> = () => null;

// PROVIDER_GOOGLE - undefined for non-native platforms
const PROVIDER_GOOGLE = undefined;

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
});
