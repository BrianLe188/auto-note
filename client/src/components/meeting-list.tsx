import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Clock, Users } from "lucide-react";
import type { Meeting } from "@shared/schema";

interface MeetingListProps {
  limit?: number;
}

export default function MeetingList({ limit }: MeetingListProps) {
  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const displayMeetings = limit ? meetings?.slice(0, limit) : meetings;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "processing":
        return "bg-orange-100 text-orange-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-white" />;
      case "processing":
        return <Clock className="h-4 w-4 text-white" />;
      default:
        return <Users className="h-4 w-4 text-white" />;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "processing":
        return "bg-orange-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-primary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Meetings</h2>
          {limit && (
            <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700 flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {!displayMeetings || displayMeetings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No meetings found</p>
            <p className="text-sm">Upload your first meeting to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayMeetings.map((meeting) => (
              <div 
                key={meeting.id} 
                className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className={`w-10 h-10 ${getStatusBgColor(meeting.status)} rounded-lg flex items-center justify-center`}>
                  {getStatusIcon(meeting.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{meeting.title}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(meeting.date).toLocaleDateString()} • {meeting.participants}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className={getStatusColor(meeting.status)}>
                      {meeting.status === "completed" ? "Completed" : 
                       meeting.status === "processing" ? "In Progress" : 
                       meeting.status === "failed" ? "Failed" : "Pending"}
                    </Badge>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {meeting.duration ? `${Math.round(meeting.duration / 60)} min` : "Processing..."}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
