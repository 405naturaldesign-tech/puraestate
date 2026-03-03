'use client';

import { useCallback, useState } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  isLoading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    isLoading: false,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null,
          isLoading: false,
        });
      },
      (error) => {
        let message = 'Unable to retrieve your location';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location access was denied';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out';
        }
        setState({ lat: null, lng: null, error: message, isLoading: false });
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, getLocation };
}
