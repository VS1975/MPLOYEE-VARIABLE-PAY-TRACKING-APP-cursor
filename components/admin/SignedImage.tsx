import { STORAGE_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export async function SignedImage({
  path,
  alt,
}: {
  path: string;
  alt: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 60 * 20);

  if (error || !data?.signedUrl) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg bg-slate-100 text-xs text-red-700">
        Preview unavailable
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={data.signedUrl}
      alt={alt}
      className="h-40 w-full rounded-lg object-cover"
      loading="lazy"
    />
  );
}
