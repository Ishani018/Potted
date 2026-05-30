import { createContext, useContext } from 'react';

// Default before the real layout is measured (matches the web CSS shell).
export const SHELL_W = 854;
export const SHELL_H = 480;

// App.js measures the actual rendered container via onLayout and feeds it here.
// This is the true size of the box the background <Image> fills, on every
// platform — so projecting authored snap points against it lines them up with
// the visible background regardless of browser size / device.
export const LayoutContext = createContext({ width: SHELL_W, height: SHELL_H });

export function useLayout() {
  return useContext(LayoutContext);
}
