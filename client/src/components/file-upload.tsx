import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Sparkles } from "lucide-react";
import { useApp } from "@/hooks/use-app";

const uploadSchema = z.object({
  title: z.string().min(1, "Meeting title is required"),
  date: z.string().min(1, "Meeting date is required"),
  participants: z.string().min(1, "Participants are required"),
  abTestGroup: z.string().default("default"),
});

type UploadForm = z.infer<typeof uploadSchema>;

export default function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const limitReachedDialogRef = useRef<LimitReachedDialogRef | null>(null);

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      date: "",
      participants: "",
      abTestGroup: "default",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      formData,
    }: {
      file: File;
      formData: UploadForm;
    }) => {
      const data = new FormData();
      data.append("audioFile", file);
      data.append("title", formData.title);
      data.append("date", formData.date);
      data.append("participants", formData.participants);
      data.append("abTestGroup", formData.abTestGroup);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch("/api/meetings/upload", {
        method: "POST",
        body: data,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description:
          "Your meeting is being transcribed. You'll see progress updates shortly.",
      });

      // Reset form and file
      form.reset();
      setSelectedFile(null);
      setUploadProgress(0);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });

      limitReachedDialogRef.current?.open();

      setUploadProgress(0);
    },
  });

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
      "audio/x-m4a",
      "video/mp4",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an MP3, MP4, WAV, or M4A file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 100MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const onSubmit = (data: UploadForm) => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an audio file to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file: selectedFile, formData: data });
  };

  return (
    <Card>
      <LimitReachedDialog ref={limitReachedDialogRef} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Upload Meeting Recording
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Supported formats:</span>
            <div className="flex space-x-1">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                MP3
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                MP4
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                WAV
              </span>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : selectedFile
                ? "border-green-300 bg-green-50"
                : "border-gray-300 hover:border-primary"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {selectedFile ? (
            <>
              <p className="text-lg font-medium text-green-700 mb-2">
                {selectedFile.name}
              </p>
              <p className="text-sm text-green-600">
                File selected successfully
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your meeting file here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse files
              </p>
              <Button type="button">Choose File</Button>
            </>
          )}
          <input
            id="fileInput"
            type="file"
            className="hidden"
            accept=".mp3,.mp4,.wav,.m4a"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>

        {/* Upload Progress */}
        {uploadMutation.isPending && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Uploading: {selectedFile?.name}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Meeting Details Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="e.g., Weekly Content Strategy Meeting"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...form.register("date")} />
              {form.formState.errors.date && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="participants">Participants</Label>
              <Input
                id="participants"
                placeholder="Sarah, Mike, Alex"
                {...form.register("participants")}
              />
              {form.formState.errors.participants && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.participants.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="abTestGroup">A/B Test Group</Label>
              <Select
                value={form.watch("abTestGroup")}
                onValueChange={(value) => form.setValue("abTestGroup", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select test group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Model</SelectItem>
                  <SelectItem value="enhanced">
                    Enhanced Accuracy Model
                  </SelectItem>
                  <SelectItem value="speed">Speed Optimized Model</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={uploadMutation.isPending || !selectedFile}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Start Transcription</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface LimitReachedDialogRef {
  open: () => void;
  close: () => void;
}

const LimitReachedDialog = forwardRef<LimitReachedDialogRef, any>((_, ref) => {
  const { products } = useApp();

  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }));
  console.log(products);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xs sm:max-w-md rounded-2xl shadow-2xl bg-gradient-to-br from-white via-zinc-50 to-zinc-100 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-900 border-none">
        <DialogHeader className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/70 bg-opacity-10">
            <Sparkles className="h-6 w-6 text-primary" />
          </span>
          <DialogTitle className="ml-2 text-lg font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Limit Reached
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-gray-600 dark:text-gray-300 py-2 text-center">
          You have reached the limit, please upgrade your tier to continue using
          transcription!
        </DialogDescription>
        <DialogFooter>
          <a
            href={products?.[0].short_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              className="w-full py-2 px-4 text-base font-semibold rounded-lg bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:scale-[1.03] transition-all"
              variant="default"
              size="lg"
            >
              Upgrade Now
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
