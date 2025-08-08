import { ActionItem } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  AlertTriangle,
  Calendar,
  Eye,
  EyeOff,
  Sparkles,
  Users,
} from "lucide-react";
import Markdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  item: ActionItem;
  isShowDescriptionActionButton?: boolean;
}

export default function Action({
  item,
  isShowDescriptionActionButton = true,
}: Props) {
  const [localItem, setLocalItem] = useState(item);

  const { toast } = useToast();

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
    onSuccess: async (data) => {
      const action = await data.json();

      setLocalItem(action);

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
    onSuccess: async (data) => {
      const action = await data.json();

      setLocalItem(action);

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

  const [showDescription, setShowDescription] = useState(false);

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateActionItemMutation.mutate({ id, completed: !completed });
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

  const isGeneratingDescription = generateDescriptionMutation.isPending;

  return (
    <div
      className={`border-2 rounded-lg p-4 transition-all duration-200 ${
        localItem.completed
          ? "border-gray-200 bg-gray-50 opacity-75"
          : localItem.priority === "high"
            ? "border-red-200 bg-red-50"
            : localItem.priority === "medium"
              ? "border-orange-200 bg-orange-50"
              : "border-blue-200 bg-blue-50"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center pt-1">
          <Checkbox
            checked={localItem.completed}
            onCheckedChange={() =>
              handleToggleComplete(localItem.id, localItem.completed)
            }
            className="h-5 w-5"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <p
              className={`text-base font-medium ${localItem.completed ? "line-through text-gray-500" : "text-gray-900"}`}
            >
              {localItem.text}
            </p>
            <div className="flex items-center gap-2 ml-4">
              {isShowDescriptionActionButton && (
                <>
                  {!localItem.description && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        generateDescriptionMutation.mutate(localItem.id)
                      }
                      disabled={isGeneratingDescription}
                      className="text-xs"
                    >
                      <Sparkles
                        className={cn(
                          "h-3 w-3 mr-1",
                          isGeneratingDescription &&
                            "animate-spin duration-500",
                        )}
                      />
                      {isGeneratingDescription
                        ? "Generating..."
                        : "Generate AI Description"}
                    </Button>
                  )}
                  {localItem.description && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDescription((state) => !state)}
                    >
                      {showDescription ? (
                        <EyeOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      {showDescription
                        ? "Hide Descriptions"
                        : "Show Descriptions"}
                    </Button>
                  )}
                </>
              )}
              <Badge className={getPriorityColor(localItem.priority)}>
                {localItem.priority === "high" && (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {localItem.priority.toUpperCase()}
              </Badge>
              {!localItem.completed && localItem.priority === "high" && (
                <span className="text-red-500 text-lg">🔥</span>
              )}
            </div>
          </div>

          {showDescription && localItem.description && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-1">
                AI Generated Description:
              </p>
              <div className="text-sm text-blue-700">
                <Markdown>{localItem.description}</Markdown>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              {localItem.assignee && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{localItem.assignee}</span>
                </div>
              )}
              {localItem.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Due {new Date(localItem.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">
              Created {new Date(localItem.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
