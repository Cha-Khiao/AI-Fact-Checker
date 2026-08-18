"use client";

import { useState, useEffect } from "react";

export function useHealthCheck(apiBase: string) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkHealth() {
      try {
        const res = await fetch(`${apiBase}/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (mounted) {
          setIsHealthy(res.ok);
        }
      } catch {
        if (mounted) {
          setIsHealthy(false);
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [apiBase]);

  return isHealthy;
}
