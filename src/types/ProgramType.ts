export type CDKey = {
  key: string;
  status: string;
  version: string;
  validFrom: string;
  validUntil: string;
  notes: string;
};

export type Program = {
  title: string;
  slug: { current: string };
  description: string;
  image: { asset: { url: string } };
  cdKeys: CDKey[];
};
