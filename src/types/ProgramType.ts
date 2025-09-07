export type CDKey = {
  key: string;
  status: string;
  version: string;
  validFrom: string;
  validUntil: string;
};

export type Program = {
  title: string;
  slug: { current: string };
  description: string;
  image?: { asset: { url: string } };
  downloadLink?: string;
  cdKeys: CDKey[];
};
