import { ActionItem } from "@shared/schema";
import mitt from "mitt";

type Event = {
  "meeting:init": { meetingId: string; percent: number; message?: string };
  "action:new-items": ActionItem[];
};

export const emitter = mitt<Event>();
