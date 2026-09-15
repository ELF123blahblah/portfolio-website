"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type ImageRow = {
  id: number;
  url: string;
  caption: string;
  entryTitle: string;
  entrySlug: string;
  entryDate: string;
  projectId: number | null;
  projectTitle: string | null;
};

export function ExportClient({
  images,
  projects,
}: {
  images: ImageRow[];
  projects: { id: number; title: string }[];
}) {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return images.filter((img) => {
      if (projectFilter !== "all") {
        if (projectFilter === "none" && img.projectId !== null) return false;
        if (projectFilter !== "none" && String(img.projectId) !== projectFilter) return false;
      }
      if (dateFrom && img.entryDate < dateFrom) return false;
      if (dateTo && img.entryDate > dateTo) return false;
      return true;
    });
  }, [images, projectFilter, dateFrom, dateTo]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected(new Set(filtered.map((f) => f.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function downloadZip() {
    if (selected.size === 0) return;
    setIsDownloading(true);
    try {
      const res = await fetch("/api/admin/export-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }

  async function copyCaptions() {
    const selectedImages = images.filter((img) => selected.has(img.id));
    const text = selectedImages
      .map((img) => `${img.entryTitle} (${img.entryDate}): ${img.caption}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Copied.");
    } catch {
      setCopyMessage("Could not copy — clipboard unavailable.");
    }
    setTimeout(() => setCopyMessage(null), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          Project
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1"
          >
            <option value="all">All</option>
            <option value="none">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-black/15 dark:border-white/15 bg-transparent px-2 py-1"
          />
        </label>
        <button onClick={selectAllFiltered} className="rounded-md border border-black/15 dark:border-white/15 px-3 py-1">
          Select all filtered ({filtered.length})
        </button>
        <button onClick={clearSelection} className="rounded-md border border-black/15 dark:border-white/15 px-3 py-1">
          Clear selection
        </button>
        <span className="text-black/60 dark:text-white/60">{selected.size} selected</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={downloadZip}
          disabled={selected.size === 0 || isDownloading}
          className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isDownloading ? "Preparing zip…" : `Download ${selected.size} as zip`}
        </button>
        <button
          onClick={copyCaptions}
          disabled={selected.size === 0}
          className="rounded-md border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Copy captions
        </button>
        {copyMessage && <span className="self-center text-sm text-black/60 dark:text-white/60">{copyMessage}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((img) => (
          <label
            key={img.id}
            className="flex cursor-pointer flex-col gap-1 rounded-md border border-black/10 dark:border-white/10 p-2"
          >
            <div className="flex items-start justify-between gap-1">
              <input
                type="checkbox"
                checked={selected.has(img.id)}
                onChange={() => toggle(img.id)}
              />
              <span className="text-[10px] text-black/40 dark:text-white/40">{img.entryDate}</span>
            </div>
            <Image
              src={img.url}
              alt={img.caption}
              width={200}
              height={150}
              loading="lazy"
              className="aspect-[4/3] w-full rounded object-cover"
            />
            <p className="text-xs leading-snug">{img.caption}</p>
            <p className="truncate text-[10px] text-black/40 dark:text-white/40">
              {img.entryTitle}
              {img.projectTitle ? ` · ${img.projectTitle}` : ""}
            </p>
          </label>
        ))}
      </div>
    </div>
  );
}
