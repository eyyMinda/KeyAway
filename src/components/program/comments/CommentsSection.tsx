import ProgramComments from "@/src/components/program/comments/programComments";

export default function CommentsSection() {
  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="bg-neutral-800 rounded-2xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-700">
          <h2 className="text-2xl font-bold text-white">Comments</h2>
          <p className="text-neutral-300 mt-1">Share your thoughts about this program</p>
        </div>
        <div className="p-6">
          <ProgramComments />
        </div>
      </div>
    </div>
  );
}
