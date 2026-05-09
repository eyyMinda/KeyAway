import ProgramComments from "@/src/components/program/comments/programComments";

export default function CommentsSection() {
  return (
    <section className="border-t border-[#2a475e] bg-[#16202d] py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="section-label mb-3">Discussion</div>
          <h2 className="section-title mb-2 sm:mb-3">
            Comments <span className="text-gradient-pro">via GitHub</span>
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[#8f98a0] sm:text-base">
            Share feedback or ask questions—sign in with GitHub to post. Helps us improve listings for everyone.
          </p>
        </div>

        <div className="card-base overflow-hidden rounded-sm p-4 sm:p-5 lg:p-6">
          <ProgramComments />
        </div>
      </div>
    </section>
  );
}
