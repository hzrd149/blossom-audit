export type BlobDescriptor = {
  sha256: string;
  type?: string;
  size: number;
  uploaded: number;
  nip94?: Record<string, string>;
};
