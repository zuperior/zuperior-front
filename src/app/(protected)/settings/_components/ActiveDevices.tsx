"use client";

import { useState, useEffect } from "react";
import { Monitor, Smartphone, Tablet, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { userService } from "@/services/api.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActiveSession {
  id: string;
  device: string | null;
  browser: string | null;
  createdAt: string;
}

interface ActiveSessionsResponse {
  success: boolean;
  data: {
    sessions: ActiveSession[];
    count: number;
  };
}

const getDeviceIcon = (device: string | null) => {
  if (!device) return <Monitor className="h-4 w-4" />;
  
  const deviceLower = device.toLowerCase();
  if (deviceLower === 'mobile') {
    return <Smartphone className="h-4 w-4" />;
  } else if (deviceLower === 'tablet') {
    return <Tablet className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
};

export default function ActiveDevices() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = (await userService.getActiveSessions()) as ActiveSessionsResponse;
      
      if (response.success && response.data) {
        setSessions(response.data.sessions || []);
      } else {
        setError("Failed to load active sessions");
      }
    } catch (err: any) {
      console.error("Error fetching active sessions:", err);
      setError("Failed to load active sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
        No active sessions found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => (
        <Card
          key={session.id}
          className="border dark:border-[#1D1825] dark:bg-gradient-to-r from-[#1A1420] to-[#1E1429]"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-r from-[#6242a5]/20 to-[#9f8bcf]/20 p-2 flex-shrink-0">
                  {getDeviceIcon(session.device)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium dark:text-white/75 text-gray-900">
                      {session.device || "Desktop"}
                    </span>
                    {index === 0 && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-600/20 text-green-400 border-green-600/30"
                      >
                        Current Device
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {session.browser || "Unknown Browser"}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {format(new Date(session.createdAt), "MMM dd, yyyy HH:mm")}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


