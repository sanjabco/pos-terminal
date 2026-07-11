import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useInternet } from '../providers/InternetProvider';
import NoInternet from '../screens/NoInternet';
import { SplashScreen } from './SplashScreen';

const SPLASH_DURATION_MS = 2000;

interface AppBootstrapProps {
  children: React.ReactNode;
}

export function AppBootstrap({ children }: AppBootstrapProps): React.JSX.Element {
  const { isLoading: isAuthLoading } = useAuth();
  const { isConnected, isChecking, checkConnection } = useInternet();
  const [isSplashDone, setIsSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashDone(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isSplashDone || isChecking || isAuthLoading) {
    return <SplashScreen />;
  }

  if (isConnected === false) {
    return <NoInternet onRetry={checkConnection} />;
  }

  return <>{children}</>;
}
