/**
 * MapLib - Web Implementation (Mock)
 * Provides mock components for web platform where react-native-maps is not supported
 */

import React from 'react';
import { View } from 'react-native';

// Mock MapView component for web
const MapView = React.forwardRef<View, React.ComponentProps<typeof View>>(
  (props, ref) => {
    return <View ref={ref} {...props} />;
  }
);

MapView.displayName = 'MapView';

// Mock Marker component for web
export const Marker: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Mock PROVIDER_GOOGLE constant
export const PROVIDER_GOOGLE = undefined;

export default MapView;
