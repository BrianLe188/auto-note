import { Meeting } from "@shared/schema";
import mitt from "mitt";

type Event = {
  "meeting:add:progress": {};
  "meeting:done": Meeting;
  "sidebar:change-tab": string;
};

export const emitter = mitt<Event>();
