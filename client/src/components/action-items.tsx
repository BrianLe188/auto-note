import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter, ArrowUpDown, CheckSquare, Users, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ActionItem } from "@shared/schema";
import { useSocket } from "@/hooks/use-socket";
import { useEffect, useState } from "react";
import { emitter } from "@/eventbus";

interface ActionItemsProps {
  limit?: number;
  searchQuery?: string;
}

export default function ActionItems({ limit, searchQuery }: ActionItemsProps) {
  const { socket } = useSocket();

  const queryClient = useQueryClient();

  const { data: actionItems, isLoading } = useQuery<ActionItem[]>({
    queryKey: ["/api/action-items"],
  });

  const [localActionItems, setLocalActionItems] = useState<ActionItem[]>([]);

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

  useEffect(() => {
    if (actionItems) {
      setLocalActionItems(actionItems);
    }
  }, [actionItems]);

  useEffect(() => {
    if (!socket) return;

    socket.on("action:new-items", (data: ActionItem[]) => {
      setLocalActionItems((state) => [...data, ...state]);
    });

    return () => {
      socket.off("action:new-items");
    };
  }, [socket]);

  const handleChangeTab = () => {
    emitter.emit("sidebar:change-tab", "action-items");
  };

  // Filter action items based on search query and prioritize by priority and completion status
  const filteredItems = localActionItems?.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.text.toLowerCase().includes(query) ||
      (item.assignee && item.assignee.toLowerCase().includes(query)) ||
      item.priority.toLowerCase().includes(query)
    );
  });

  // Sort by priority (high first) and completion status (incomplete first)
  const sortedItems = filteredItems?.sort((a, b) => {
    // First sort by completion status
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Then sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (
      priorityOrder[a.priority as keyof typeof priorityOrder] -
      priorityOrder[b.priority as keyof typeof priorityOrder]
    );
  });

  const displayItems = limit ? sortedItems?.slice(0, limit) : sortedItems;

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-orange-100 text-orange-700";
      case "low":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateActionItemMutation.mutate({ id, completed: !completed });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-4 h-4 bg-gray-200 rounded mt-1"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
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
            Priority Action Items
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!displayItems || displayItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No action items found</p>
            <p className="text-sm">
              Action items will appear here after meeting transcription
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white border-2 rounded-lg p-4 transition-all duration-200 ${
                  item.completed
                    ? "border-gray-200 bg-gray-50 opacity-75"
                    : item.priority === "high"
                      ? "border-red-200 bg-red-50 hover:shadow-md"
                      : item.priority === "medium"
                        ? "border-orange-200 bg-orange-50 hover:shadow-md"
                        : "border-blue-200 bg-blue-50 hover:shadow-md"
                }`}
              >
                <div className="flex items-start space-x-4">
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
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge className={getPriorityBadgeColor(item.priority)}>
                          {item.priority.toUpperCase()}
                        </Badge>
                        {!item.completed && item.priority === "high" && (
                          <span className="text-red-500 text-lg">🔥</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        {item.assignee && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{item.assignee}</span>
                          </div>
                        )}
                        {item.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              Due {new Date(item.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {limit && displayItems && displayItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full text-primary hover:text-blue-700 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              onClick={handleChangeTab}
            >
              View All Action Items ({localActionItems?.length || 0})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
