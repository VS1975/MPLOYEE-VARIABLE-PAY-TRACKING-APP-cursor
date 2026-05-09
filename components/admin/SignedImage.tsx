"use client";

import { useEffect, useState } from "react";

export function SignedImage({
  path,
  alt,
}: {
  path: string;
  alt: string;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const res = await fetch(`/api/admin/images/signed-url?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error("Failed to get signed URL");
        const data = await res.json();
        setSignedUrl(data.signedUrl);
      } catch {
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    }
    fetchSignedUrl();
  }, [path]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg bg-slate-100">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg bg-slate-100 text-xs text-red-700">
        Preview unavailable
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={signedUrl}
      alt={alt}
      className="h-40 w-full rounded-lg object-cover"
      loading="lazy"
    />
  );
}
