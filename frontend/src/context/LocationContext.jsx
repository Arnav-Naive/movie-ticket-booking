import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    api.get('/cities/')
      .then(res => {
        setCities(res.data);
        if (res.data.length > 0) setSelectedCity(res.data[0]);
      })
      .catch(() => {});
  }, []);

  return (
    <LocationContext.Provider value={{ cities, selectedCity, setSelectedCity }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationCtx() {
  return useContext(LocationContext);
}