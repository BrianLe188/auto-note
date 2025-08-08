import ABTesting from "@/components/ab-testing";
import ActionItems from "@/components/action-items";
import FileUpload from "@/components/file-upload";
import MeetingList from "@/components/meeting-list";
import TranscriptionProgress from "@/components/transcription-progress";

export default function DashboardUpload() {
  return (
    <>
      <FileUpload />
      <TranscriptionProgress />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MeetingList limit={3} />
        <ActionItems limit={4} isShowDescriptionActionButton={false} />
      </div>
      <ABTesting />
    </>
  );
}
