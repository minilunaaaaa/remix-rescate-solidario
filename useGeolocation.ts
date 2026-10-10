import { useCallback, useEffect, useRef, useState } from 'react';

export type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error' | 'unsupported';

export interface UseGeolocationOptions {
  enabled?: boolean;
}

export const useGeolocation = (options?: UseGeolocationOptions) => {
  const enabled = options?.enabled ?? true;
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const watchRef = useRef<number | null>(null);

  const stopWatching = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unsupported');
      setCoords(null);
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
      },
      (err) => {
        setCoords(null);
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopWatching();
      setCoords(null);
      setStatus('idle');
      return;
    }
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    setStatus('loading');
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
      },
      (err) => {
        setCoords(null);
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
    watchRef.current = id;
    return () => {
      navigator.geolocation.clearWatch(id);
      watchRef.current = null;
    };
  }, [enabled, stopWatching]);

  return { coords, status, refresh };
};