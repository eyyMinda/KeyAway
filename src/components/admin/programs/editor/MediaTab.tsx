"use client";

import { Card, MarkdownField } from "./fields";
import ImagePicker from "./ImagePicker";
import type { ImageTabProps } from "./types";

export default function MediaTab({ form, update, openLibrary }: ImageTabProps) {
  return (
    <div className="space-y-5">
      <Card title="Program image" description="Card and header image across the site.">
        <ImagePicker label="Image" value={form.image} onChange={image => update({ image })} onOpenLibrary={openLibrary} />
      </Card>

      <Card title="Featured section" description="Used when this program is featured on the homepage. Empty copy falls back to the description.">
        <MarkdownField
          label="Featured copy"
          rows={4}
          value={form.featuredCopy}
          placeholder="Optional homepage copy"
          onChange={featuredCopy => update({ featuredCopy })}
        />
        <ImagePicker
          label="Showcase GIF"
          value={form.showcaseGif}
          onChange={showcaseGif => update({ showcaseGif })}
          onOpenLibrary={openLibrary}
          hint="Short GIF demonstrating the program."
        />
      </Card>
    </div>
  );
}
