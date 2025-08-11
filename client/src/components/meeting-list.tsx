import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Clock, Users } from "lucide-react";
import { Link } from "wouter";
import type { Meeting } from "@shared/schema";
import { useEffect, useState } from "react";
import { emitter } from "@/eventbus";

interface MeetingListProps {
  limit?: number;
  searchQuery?: string;
}

export default function MeetingList({ limit, searchQuery }: MeetingListProps) {
  const [localMeetings, setLocalMeetings] = useState<Meeting[]>([]);

  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  useEffect(() => {
    if (meetings) {
      setLocalMeetings(meetings);
    }
  }, [meetings]);

  useEffect(() => {
    emitter.on("meeting:done", (data) => {
      setLocalMeetings((state) => {
        const doneMeetings = state.filter(
          (meeting) => meeting.status !== "processing",
        );
        return [data, ...doneMeetings];
      });
    });

    return () => {
      emitter.off("meeting:done");
    };
  }, []);

  const handleChangeTab = () => {
    emitter.emit("sidebar:change-tab", "meetings");
  };

  // Filter meetings based on search query
  const filteredMeetings = localMeetings?.filter((meeting) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      meeting.title.toLowerCase().includes(query) ||
      meeting.participants.toLowerCase().includes(query) ||
      meeting.fileName.toLowerCase().includes(query) ||
      (meeting.transcriptionText &&
        meeting.transcriptionText.toLowerCase().includes(query))
    );
  });

  const displayMeetings = limit
    ? filteredMeetings?.slice(0, limit)
    : filteredMeetings;

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
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Meetings
          </h2>
          {limit && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-blue-700 flex items-center space-x-1"
              onClick={handleChangeTab}
            >
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
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-12 h-12 ${getStatusBgColor(meeting.status)} rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    {getStatusIcon(meeting.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {meeting.title}
                      </h3>
                      <Badge className={getStatusColor(meeting.status)}>
                        {meeting.status === "completed"
                          ? "Completed"
                          : meeting.status === "processing"
                            ? "Processing"
                            : meeting.status === "failed"
                              ? "Failed"
                              : "Pending"}
                      </Badge>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="truncate">{meeting.participants}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        <span>
                          {new Date(meeting.date).toLocaleDateString()}
                        </span>
                        {meeting.duration && (
                          <span>{Math.round(meeting.duration / 60)} min</span>
                        )}
                        <span className="truncate max-w-32">
                          {meeting.fileName}
                        </span>
                      </div>
                      <Link href={`/meetings/${meeting.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary"
                        >
                          View Details <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>

                    {meeting.transcriptionText && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {meeting.transcriptionText.substring(0, 120)}...
                        </p>
                      </div>
                    )}
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
