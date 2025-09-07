"use client";

import { useEffect, useState } from "react";
import { CDKey } from "@/src/types/ProgramType";
import { processCdKeys } from "@/src/lib/cdKeyUtils";

interface KeyStatusUpdaterProps {
  initialKeys: CDKey[];
  onKeysUpdate: (updatedKeys: CDKey[]) => void;
}

export default function KeyStatusUpdater({ initialKeys, onKeysUpdate }: KeyStatusUpdaterProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute to check for expired keys
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Process keys whenever time updates
    const updatedKeys = processCdKeys(initialKeys);
    onKeysUpdate(updatedKeys);
  }, [currentTime, initialKeys, onKeysUpdate]);

  return null; // This component doesn't render anything
}
