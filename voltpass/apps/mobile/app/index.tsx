import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { getToken } from '../src/services/api';

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(token => {
      setDestination(token ? '/(tabs)/wallet' : '/(onboarding)/welcome');
    });
  }, []);

  if (!destination) return null;
  return <Redirect href={destination as any} />;
}
