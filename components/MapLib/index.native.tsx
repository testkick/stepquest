/**
 * MapLib - Native Map Implementation (Production-Ready)
 * Direct import of react-native-maps for iOS/Android development builds
 * No dynamic loading - ensures reliable behavior in production
 */

import React from 'react';
import MapViewBase, {
  Marker as MapMarker,
  Polyline as MapPolyline,
  PROVIDER_GOOGLE as RN_PROVIDER_GOOGLE,
  MapViewProps,
  MapMarkerProps,
  MapPolylineProps,
} from 'react-native-maps';
import { Platform } from 'react-native';

// Re-export MapView with proper typing
const MapView = React.forwardRef<MapViewBase, MapViewProps>((props, ref) => {
  return <MapViewBase ref={ref} {...props} />;
});

MapView.displayName = 'MapView';

// Re-export Marker with proper typing
interface MarkerProps extends Omit<MapMarkerProps, 'coordinate'> {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  children?: React.ReactNode;
}

const Marker: React.FC<MarkerProps> = (props) => {
  return <MapMarker {...props} />;
};

// Re-export Polyline with proper typing
interface PolylineProps extends Omit<MapPolylineProps, 'coordinates'> {
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
}

const Polyline: React.FC<PolylineProps> = (props) => {
  return <MapPolyline {...props} />;
};

// PROVIDER_GOOGLE - only use on Android
const PROVIDER_GOOGLE = Platform.OS === 'android' ? RN_PROVIDER_GOOGLE : undefined;

export { Marker, Polyline, PROVIDER_GOOGLE };
export default MapView;
