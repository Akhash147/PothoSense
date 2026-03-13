// E:\Pothosense\pothosense-expo\app\_layout.js
// FINAL  pure Stack, no Tabs, no sub-_layout files needed
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../context/AppContext';

function RootStack() {
  const { darkMode } = useApp();
  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
}
export default function Layout() {
  return <AppProvider><RootStack /></AppProvider>;
}
