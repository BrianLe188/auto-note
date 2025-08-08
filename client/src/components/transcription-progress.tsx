import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Meeting } from "@shared/schema";
import { useSocket } from "@/hooks/use-socket";
import { useEffect, useState } from "react";
import { Progress } from "./ui/progress";
import { emitter } from "@/eventbus";
import { queryClient } from "@/lib/queryClient";

type MeetingProgress = Meeting & { percent?: number };

export default function TranscriptionProgress() {
  const { socket } = useSocket();

  const [localMeetings, setLocalMeetings] = useState<MeetingProgress[]>([]);

  const { data: meetings } = useQuery<MeetingProgress[]>({
    queryKey: ["/api/meetings"],
  });

  useEffect(() => {
    if (meetings) {
      setLocalMeetings(meetings);
    }
  }, [meetings]);

  useEffect(() => {
    if (!socket) return;

    socket.on(
      "meeting:init",
      (data: { meetingId: string; percent: number }) => {
        setLocalMeetings((state) => {
          let doneMeeting: Meeting | null = null;

          const updated = state.map((meeting) => {
            if (meeting.id === data.meetingId) {
              const updated = { ...meeting, percent: data.percent };
              if (data.percent >= 100) {
                updated.status = "completed";
                doneMeeting = updated;
              }
              return updated;
            }
            return meeting;
          });

          setTimeout(() => {
            if (doneMeeting) {
              emitter.emit("meeting:done", doneMeeting);

              queryClient.invalidateQueries({
                queryKey: ["/api/action-items"],
              });
              queryClient.invalidateQueries({
                queryKey: ["/api/meetings"],
              });
              queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            }
          }, 0);

          return updated;
        });
      },
    );

    return () => {
      socket.off("meeting:init");
    };
  }, [socket]);

  const processingMeetings =
    localMeetings?.filter((meeting: any) => meeting.status === "processing") ||
    [];

  if (processingMeetings.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Active Transcription
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <Badge
              variant="outline"
              className="text-green-600 border-green-200"
            >
              Processing
            </Badge>
          </div>
        </div>

        {processingMeetings.map((meeting) => (
          <div key={meeting.id} className="mb-6 last:mb-0">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  {meeting.title}
                </span>
                <span className="text-sm text-gray-500">Processing...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <Progress value={meeting?.percent || 20} className="h-2" />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Processing audio...</span>
                <span>Please wait</span>
              </div>
            </div>

            {/* Real-time Transcript Preview */}
            <div className="border border-gray-200 rounded-lg p-4 h-48 overflow-y-auto bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm">Transcription in progress...</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Using {meeting.abTestGroup} model
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
