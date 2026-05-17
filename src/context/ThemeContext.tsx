import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

const lightTheme = {
  dark: false,
  bg: '#FFFFFF',
  bg2: '#F5F5F5',
  bg3: '#EEEEEE',
  border: '#E0E0E0',
  border2: '#CCCCCC',
  text: '#0A0A0A',
  text2: '#555555',
  text3: '#999999',
  green: '#1D9E75',
  greenBg: '#E1F5EE',
  greenBorder: '#5DCAA5',
  greenText: '#0F6E56',
  amber: '#BA7517',
  amberBg: '#FAEEDA',
  amberBorder: '#FAC775',
  amberText: '#633806',
  red: '#E24B4A',
  redBg: '#FCEBEB',
  redBorder: '#F09595',
  redText: '#A32D2D',
  blue: '#378ADD',
  blueBg: '#E6F1FB',
  blueBorder: '#85B7EB',
  blueText: '#185FA5',
};

const darkTheme = {
  dark: true,
  bg: '#0A0C10',
  bg2: '#0F1218',
  bg3: '#161B24',
  border: '#1E2530',
  border2: '#252D3A',
  text: '#F0F2F8',
  text2: '#8892AA',
  text3: '#4A5268',
  green: '#00D68F',
  greenBg: '#021A11',
  greenBorder: '#013D27',
  greenText: '#00D68F',
  amber: '#FFB547',
  amberBg: '#1A1000',
  amberBorder: '#3D2600',
  amberText: '#FFB547',
  red: '#FF4D4D',
  redBg: '#1A0000',
  redBorder: '#3D0000',
  redText: '#FF4D4D',
  blue: '#4D9FFF',
  blueBg: '#00091A',
  blueBorder: '#1A3A5C',
  blueText: '#4D9FFF',
};

type Theme = typeof lightTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  const toggleTheme = () => setIsDark(prev => !prev);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);