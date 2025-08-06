import ABTesting from "@/components/ab-testing";
import Header from "@/components/header";
import DashboardAction from "@/components/pages/dashboard/actions";
import DashboardMeeting from "@/components/pages/dashboard/meetings";
import DashboardUpload from "@/components/pages/dashboard/upload";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("upload");

  const { data: stats } = useQuery<{
    meetingsTranscribed: number;
    actionItems: number;
    hoursSaved: number;
  }>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              stats={stats}
            />
          </div>
          <main className="lg:col-span-3 space-y-8">
            {activeTab === "upload" && <DashboardUpload />}
            {activeTab === "meetings" && <DashboardMeeting />}
            {activeTab === "action-items" && <DashboardAction />}
            {activeTab === "ab-testing" && <ABTesting />}
          </main>
        </div>
      </div>
    </div>
  );
}
