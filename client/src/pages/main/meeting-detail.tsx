import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { exportMeeting } from "@/lib/export";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  FileText,
  Download,
  CheckSquare,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Meeting, ActionItem } from "@shared/schema";

export default function MeetingDetail() {
  const [, params] = useRoute("/meetings/:id");
  const meetingId = params?.id;
  const [showDescriptions, setShowDescriptions] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: meeting, isLoading: loadingMeeting } = useQuery<Meeting>({
    queryKey: ["/api/meetings", meetingId],
    enabled: !!meetingId,
  });

  const { data: actionItems, isLoading: loadingActions } = useQuery<
    ActionItem[]
  >({
    queryKey: ["/api/action-items"],
  });

  const updateActionItemMutation = useMutation({
    mutationFn: async ({
      id,
      completed,
    }: {
      id: string;
      completed: boolean;
    }) => {
      return apiRequest("PATCH", `/api/action-items/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/action-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const generateDescriptionMutation = useMutation({
    mutationFn: async (actionItemId: string) => {
      return apiRequest(
        "POST",
        `/api/action-items/${actionItemId}/generate-description`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/action-items"] });
      toast({
        title: "Description has been generated!",
        description:
          "AI has generated a detailed description for this action item.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Unable to create description. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateBulkDescriptionsMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      return apiRequest(
        "POST",
        `/api/meetings/${meetingId}/generate-action-descriptions`,
      );
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/action-items"] });
      toast({
        title: "Bulk description creation successful!",
        description: `Created descriptions for ${data.count} action items.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not create description. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter action items for this meeting
  const meetingActionItems = actionItems?.filter(
    (item) => item.meetingId === meetingId,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateActionItemMutation.mutate({ id, completed: !completed });
  };

  if (loadingMeeting || loadingActions) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-60 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Meeting not found
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                The meeting you're looking for doesn't exist or has been
                removed.
              </p>
              <Link href="/">
                <Button>Back to All Meetings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/meetings" className="text-primary hover:text-primary/80">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Meetings
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {meeting.title}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Meeting details and action items
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await exportMeeting(meetingId!, "txt");
                    toast({
                      title: "Export successful",
                      description: "Meeting transcript exported as text file",
                    });
                  } catch (error) {
                    toast({
                      title: "Export failed",
                      description: "Failed to export meeting transcript",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await exportMeeting(meetingId!, "json");
                    toast({
                      title: "Export successful",
                      description: "Meeting data exported as JSON file",
                    });
                  } catch (error) {
                    toast({
                      title: "Export failed",
                      description: "Failed to export meeting data",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Meeting Information
              </CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Participants
                  </p>
                  <p className="text-sm text-gray-600">
                    {meeting.participants}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Date</p>
                  <p className="text-sm text-gray-600">
                    {new Date(meeting.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Duration</p>
                  <p className="text-sm text-gray-600">
                    {meeting.duration
                      ? `${Math.round(meeting.duration / 60)} minutes`
                      : "Processing..."}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                Audio File
              </p>
              <p className="text-sm text-gray-600">{meeting.fileName}</p>
            </div>
            {meeting.abTestGroup && (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  A/B Test Group
                </p>
                <Badge variant="outline">{meeting.abTestGroup}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Action Items ({meetingActionItems?.length || 0})
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDescriptions(!showDescriptions)}
                >
                  {showDescriptions ? (
                    <EyeOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  {showDescriptions ? "Hide Descriptions" : "Show Descriptions"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    generateBulkDescriptionsMutation.mutate(meetingId!)
                  }
                  disabled={
                    generateBulkDescriptionsMutation.isPending || !meetingId
                  }
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generateBulkDescriptionsMutation.isPending
                    ? "Generating..."
                    : "Generate All Descriptions"}
                </Button>

                {meetingActionItems && meetingActionItems.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {meetingActionItems.filter((item) => item.completed).length}{" "}
                    of {meetingActionItems.length} completed
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!meetingActionItems || meetingActionItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">
                  No action items found for this meeting
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Action items will appear here after the meeting is processed
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetingActionItems
                  .sort((a, b) => {
                    if (a.completed !== b.completed)
                      return a.completed ? 1 : -1;
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return (
                      priorityOrder[a.priority as keyof typeof priorityOrder] -
                      priorityOrder[b.priority as keyof typeof priorityOrder]
                    );
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`border-2 rounded-lg p-4 transition-all duration-200 ${
                        item.completed
                          ? "border-gray-200 bg-gray-50 opacity-75"
                          : item.priority === "high"
                            ? "border-red-200 bg-red-50"
                            : item.priority === "medium"
                              ? "border-orange-200 bg-orange-50"
                              : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center pt-1">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() =>
                              handleToggleComplete(item.id, item.completed)
                            }
                            className="h-5 w-5"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <p
                              className={`text-base font-medium ${item.completed ? "line-through text-gray-500" : "text-gray-900"}`}
                            >
                              {item.text}
                            </p>
                            <div className="flex items-center gap-2 ml-4">
                              {!item.description && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    generateDescriptionMutation.mutate(item.id)
                                  }
                                  disabled={
                                    generateDescriptionMutation.isPending
                                  }
                                  className="text-xs"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Generate AI Description
                                </Button>
                              )}
                              <Badge
                                className={getPriorityColor(item.priority)}
                              >
                                {item.priority === "high" && (
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                )}
                                {item.priority.toUpperCase()}
                              </Badge>
                              {!item.completed && item.priority === "high" && (
                                <span className="text-red-500 text-lg">🔥</span>
                              )}
                            </div>
                          </div>

                          {showDescriptions && item.description && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <p className="text-sm text-blue-800 font-medium mb-1">
                                AI Generated Description:
                              </p>
                              <p className="text-sm text-blue-700">
                                {item.description}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              {item.assignee && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{item.assignee}</span>
                                </div>
                              )}
                              {item.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    Due{" "}
                                    {new Date(
                                      item.dueDate,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              Created{" "}
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcription */}
        {meeting.transcriptionText && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Meeting Transcription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {meeting.transcriptionText}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {meeting.status === "processing" && (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Processing Meeting
              </h3>
              <p className="text-sm text-gray-600">
                This meeting is currently being transcribed and processed.
                Transcription and action items will appear here once complete.
              </p>
            </CardContent>
          </Card>
        )}

        {meeting.status === "failed" && (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Processing Failed
              </h3>
              <p className="text-sm text-gray-600">
                There was an error processing this meeting. Please try uploading
                the file again.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
