import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { emitter } from "@/eventbus";
import {
  Upload,
  FileText,
  CheckSquare,
  TrendingUp,
  Download,
  Settings,
} from "lucide-react";
import { useEffect } from "react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats?: {
    meetingsTranscribed: number;
    actionItems: number;
    hoursSaved: number;
  };
}

export default function Sidebar({
  activeTab,
  onTabChange,
  stats,
}: SidebarProps) {
  const menuItems = [
    { id: "upload", label: "Upload & Transcribe", icon: Upload },
    { id: "meetings", label: "Meeting Library", icon: FileText },
    { id: "action-items", label: "Action Items", icon: CheckSquare },
    { id: "ab-testing", label: "A/B Testing", icon: TrendingUp },
    { id: "exports", label: "Exports", icon: Download },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    emitter.on("sidebar:change-tab", (id) => onTabChange(id));

    return () => {
      emitter.off("sidebar:change-tab");
    };
  }, []);

  return (
    <aside className="space-y-6">
      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Quick Access Links */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Quick Access
            </p>
            <div className="space-y-1"></div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            This Month
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Meetings Transcribed
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {stats?.meetingsTranscribed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Action Items</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats?.actionItems || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Hours Saved</span>
              <span className="text-sm font-semibold text-success">
                {stats?.hoursSaved || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
