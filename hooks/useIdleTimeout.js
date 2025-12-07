import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';

const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds
const WARNING_BEFORE_TIMEOUT = 30 * 1000; // Show warning 30 seconds before timeout

export const useIdleTimeout = (onTimeout, isAuthenticated) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(WARNING_BEFORE_TIMEOUT);
  const lastActivityRef = useRef(Date.now());
  const timeoutRef = useRef(null);
  const warningIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningIntervalRef.current) {
      clearInterval(warningIntervalRef.current);
      warningIntervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!isAuthenticated) return;

    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setRemainingTime(WARNING_BEFORE_TIMEOUT / 1000);
    clearTimers();

    // Set timeout for warning (5 min - 30 sec = 4.5 min)
    timeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(WARNING_BEFORE_TIMEOUT / 1000);

      // Start countdown interval
      warningIntervalRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearTimers();
            setShowWarning(false);
            onTimeout?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT - WARNING_BEFORE_TIMEOUT);
  }, [isAuthenticated, onTimeout, clearTimers]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isAuthenticated
      ) {
        // App came to foreground - check if session should have timed out
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= IDLE_TIMEOUT) {
          onTimeout?.();
        } else if (timeSinceLastActivity >= IDLE_TIMEOUT - WARNING_BEFORE_TIMEOUT) {
          // Show warning with remaining time
          const remaining = Math.ceil((IDLE_TIMEOUT - timeSinceLastActivity) / 1000);
          setRemainingTime(remaining);
          setShowWarning(true);

          warningIntervalRef.current = setInterval(() => {
            setRemainingTime((prev) => {
              if (prev <= 1) {
                clearTimers();
                setShowWarning(false);
                onTimeout?.();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          // Reset timer with adjusted time
          resetTimer();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, onTimeout, resetTimer, clearTimers]);

  // Initialize timer when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      resetTimer();
    } else {
      clearTimers();
      setShowWarning(false);
    }

    return () => clearTimers();
  }, [isAuthenticated, resetTimer, clearTimers]);

  return {
    resetTimer,
    showWarning,
    remainingTime,
    extendSession,
  };
};
