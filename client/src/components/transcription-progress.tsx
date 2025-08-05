import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Meeting } from "@shared/schema";

export default function TranscriptionProgress() {
  // Get meetings that are currently processing
  const { data: meetings } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
    refetchInterval: 2000, // Poll every 2 seconds for active transcriptions
  });

  const processingMeetings = meetings?.filter((meeting: any) => meeting.status === "processing") || [];

  if (processingMeetings.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Active Transcription</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              Processing
            </Badge>
          </div>
        </div>

        {processingMeetings.map((meeting) => (
          <div key={meeting.id} className="mb-6 last:mb-0">
            {/* Transcription Progress */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">{meeting.title}</span>
                <span className="text-sm text-gray-500">Processing...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500 animate-pulse" 
                  style={{ width: "45%" }}
                ></div>
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
