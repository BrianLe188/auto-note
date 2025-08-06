import ActionItems from "@/components/action-items";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { exportActionItems } from "@/lib/export";
import type { ActionItem } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckSquare,
  ChevronDown,
  Clock,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { useState } from "react";

export default function DashboardAction() {
  const { data: actionItems, isLoading: loadingActions } = useQuery<
    ActionItem[]
  >({
    queryKey: ["/api/action-items"],
  });
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Priority Action Items
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage tasks from your meetings
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search action items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select
              defaultValue="all"
              value={priorityFilter}
              onValueChange={setPriorityFilter}
            >
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <CheckSquare className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <CheckSquare className="h-4 w-4 mr-2" />
              Mark All Complete
            </Button>
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
                      await exportActionItems({
                        format: "csv",
                        priority: priorityFilter,
                        status: statusFilter,
                      });
                      toast({
                        title: "Export successful",
                        description: "Action items exported as CSV file",
                      });
                    } catch (error) {
                      toast({
                        title: "Export failed",
                        description: "Failed to export action items",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await exportActionItems({
                        format: "json",
                        priority: priorityFilter,
                        status: statusFilter,
                      });
                      toast({
                        title: "Export successful",
                        description: "Action items exported as JSON file",
                      });
                    } catch (error) {
                      toast({
                        title: "Export failed",
                        description: "Failed to export action items",
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
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Actions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {actionItems?.length || 0}
                </p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  High Priority
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {actionItems?.filter(
                    (item) => item.priority === "high" && !item.completed,
                  ).length || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {actionItems?.filter((item) => item.completed).length || 0}
                </p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {actionItems?.length
                    ? Math.round(
                        (actionItems.filter((item) => item.completed).length /
                          actionItems.length) *
                          100,
                      )
                    : 0}
                  %
                </p>
              </div>
              <Clock className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      <ActionItems searchQuery={searchQuery} />
    </>
  );
}
