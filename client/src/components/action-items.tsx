import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter, ArrowUpDown, CheckSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ActionItem } from "@shared/schema";

interface ActionItemsProps {
  limit?: number;
}

export default function ActionItems({ limit }: ActionItemsProps) {
  const queryClient = useQueryClient();
  
  const { data: actionItems, isLoading } = useQuery<ActionItem[]>({
    queryKey: ["/api/action-items"],
  });

  const updateActionItemMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return apiRequest("PATCH", `/api/action-items/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/action-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const displayItems = limit ? actionItems?.slice(0, limit) : actionItems;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50";
      case "medium":
        return "border-orange-200 bg-orange-50";
      case "low":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

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
          <h2 className="text-lg font-semibold text-gray-900">Priority Action Items</h2>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!displayItems || displayItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No action items found</p>
            <p className="text-sm">Action items will appear here after meeting transcription</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-start space-x-3 p-3 border rounded-lg ${
                  item.completed ? "border-gray-200 bg-gray-50 opacity-75" : getPriorityColor(item.priority)
                }`}
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleToggleComplete(item.id, item.completed)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className={`text-sm ${item.completed ? "text-gray-700 line-through" : "text-gray-900"}`}>
                    {item.text}
                  </p>
                  <div className="flex items-center space-x-3 mt-2">
                    <Badge 
                      variant="outline" 
                      className={item.completed ? "bg-green-100 text-green-700" : getPriorityBadgeColor(item.priority)}
                    >
                      {item.completed ? "Completed" : `${item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority`}
                    </Badge>
                    {item.dueDate && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      </>
                    )}
                    {item.assignee && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">Assigned: {item.assignee}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {limit && displayItems && displayItems.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button variant="ghost" className="w-full text-primary hover:text-blue-700 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              View All Action Items ({actionItems?.length || 0})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
