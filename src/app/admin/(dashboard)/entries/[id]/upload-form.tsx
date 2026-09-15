"use client";

import { useActionState, useRef } from "react";
import { uploadImage } from "../image-actions";

export function UploadForm({ entryId }: { entryId: number }) {
  const boundUpload = uploadImage.bind(null, entryId);
  const [state, formAction, isPending] = useActionState(boundUpload, { error: null });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 max-w-md"
    >
      <label className="text-sm font-medium">
        Image file
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          className="mt-1 block w-full text-sm"
        />
      </label>
      <label className="text-sm font-medium">
        Caption (required)
        <input
          name="caption"
          required
          minLength={1}
          className="mt-1 w-full rounded-md border border-black/15 dark:border-white/15 bg-transparent px-3 py-2"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
