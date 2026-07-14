export interface ContactMessageReply {
  _key?: string;
  body: string;
  subject: string;
  sentTo: string;
  sentBy: string;
  sentAt: string;
  resendId?: string;
}

export interface ContactMessage {
  _id: string;
  _createdAt: string;
  title: string;
  message: string;
  name?: string;
  email?: string;
  ipHash?: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
  lastRepliedAt?: string;
  replies?: ContactMessageReply[];
}

export interface ContactFormData {
  title: string;
  message: string;
  name?: string;
  email?: string;
}

export interface KeySuggestion {
  _id: string;
  _createdAt: string;
  cdKey: string;
  programName: string;
  programVersion: string;
  programLink: string;
  name?: string;
  email?: string;
  message?: string;
  ipHash?: string;
  status: "new" | "reviewing" | "added" | "rejected";
  createdAt: string;
}

export interface KeySuggestionFormData {
  cdKey: string;
  programName: string;
  programVersion: string;
  programLink: string;
  name?: string;
  email?: string;
  message?: string;
}
