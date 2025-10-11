export interface ContactMessage {
  _id: string;
  _createdAt: string;
  title: string;
  message: string;
  name?: string;
  email?: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
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
