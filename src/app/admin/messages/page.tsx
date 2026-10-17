"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import MessagesTable from "@/src/components/admin/messages/MessagesTable";
import ReplyEmailTemplatePreview from "@/src/components/admin/messages/ReplyEmailTemplatePreview";
import { AdminFilterBar, AdminSearch, AdminSelect, usePagedList } from "@/src/components/admin/list/AdminListKit";
import { filterMessagesByView, messageViewOptions, type MessageView } from "@/src/lib/admin/contactMessages";
import { ContactMessage } from "@/src/types/contact";
import { client } from "@/src/sanity/lib/client";

const MESSAGES_QUERY = `*[_type == "contactMessage"] | order(createdAt desc) {
  _id,
  _createdAt,
  title,
  message,
  name,
  email,
  ipHash,
  status,
  createdAt,
  lastRepliedAt,
  replies[]{
    _key,
    body,
    subject,
    sentTo,
    sentBy,
    sentAt,
    resendId
  }
}`;

type SortKey = "newest" | "oldest" | "last_reply";

async function loadMessages(): Promise<ContactMessage[] | null> {
  try {
    return await client.fetch<ContactMessage[]>(MESSAGES_QUERY);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return null;
  }
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<MessageView>("open");
  const [sort, setSort] = useState<SortKey>("newest");

  const fetchMessages = () =>
    loadMessages().then(result => {
      if (result) setMessages(result);
      setLoading(false);
    });

  useEffect(() => {
    let cancelled = false;
    loadMessages().then(result => {
      if (cancelled) return;
      if (result) setMessages(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = filterMessagesByView(messages, view).filter(msg => {
      if (!q) return true;
      return (
        [msg.title, msg.message, msg.name, msg.email].some(v => v?.toLowerCase().includes(q)) ||
        Boolean(
          msg.replies?.some(r => [r.body, r.sentBy, r.subject].some(v => v?.toLowerCase().includes(q)))
        )
      );
    });
    const time = (iso?: string) => (iso ? new Date(iso).getTime() : 0);
    return list.sort((a, b) => {
      if (sort === "last_reply") return time(b.lastRepliedAt) - time(a.lastRepliedAt);
      const diff = time(a.createdAt) - time(b.createdAt);
      return sort === "oldest" ? diff : -diff;
    });
  }, [messages, search, view, sort]);

  const paged = usePagedList(filtered, `${search}|${view}|${sort}`);

  return (
    <ProtectedAdminLayout title="Messages" subtitle="Contact form messages and your replies">
      <AdminFilterBar>
        <AdminSearch
          value={search}
          onChange={setSearch}
          placeholder="Search title, message, sender or replies…"
          className="sm:flex-1 sm:min-w-64"
        />
        <AdminSelect
          label="View"
          value={view}
          onChange={v => setView(v as MessageView)}
          options={messageViewOptions(messages)}
        />
        <AdminSelect
          label="Sort"
          value={sort}
          onChange={v => setSort(v as SortKey)}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "last_reply", label: "Recently replied" }
          ]}
        />
      </AdminFilterBar>

      <MessagesTable
        messages={paged.pageItems}
        all={messages}
        total={filtered.length}
        loading={loading}
        paging={paged}
        onUpdate={fetchMessages}
      />

      <ReplyEmailTemplatePreview />
    </ProtectedAdminLayout>
  );
}
