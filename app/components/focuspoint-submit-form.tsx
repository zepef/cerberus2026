"use client";

import { useState, useRef } from "react";
import { Send, Plus, X, Upload, FileText, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FileEntry {
  name: string;
  type: string;
  base64: string;
  size: number;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FocusPointSubmitForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<string[]>([""]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [resultSlug, setResultSlug] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addLink() {
    if (links.length < 20) setLinks([...links, ""]);
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index));
  }

  function updateLink(index: number, value: string) {
    const updated = [...links];
    updated[index] = value;
    setLinks(updated);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected) return;

    Array.from(selected).forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorMessage(`File type not allowed: ${ext}`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`File too large: ${file.name} (max 10MB)`);
        return;
      }
      if (files.length >= 5) {
        setErrorMessage("Maximum 5 files allowed");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setFiles((prev) => [
          ...prev,
          { name: file.name, type: file.type, base64, size: file.size },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");

    const validLinks = links.filter((l) => l.trim().length > 0);

    try {
      const response = await fetch("/api/focuspoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          links: validLinks,
          files,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitState("error");
        setErrorMessage(data.error || "Submission failed");
        return;
      }

      setSubmitState("success");
      setResultSlug(data.slug);
    } catch {
      setSubmitState("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  if (submitState === "success") {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
        <h3 className="mt-4 text-xl font-bold text-white">Submission Received</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Your FocusPoint has been created. CERBERUS bots will begin investigating.
        </p>
        <p className="mt-1 text-xs font-mono text-zinc-500">
          Slug: {resultSlug}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/focuspoints">
            <Button variant="outline" className="border-white/10 text-zinc-300 hover:text-white">
              View All FocusPoints
            </Button>
          </Link>
          <Button
            onClick={() => {
              setTitle("");
              setDescription("");
              setLinks([""]);
              setFiles([]);
              setSubmitState("idle");
              setResultSlug("");
            }}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="glass-card rounded-xl p-6">
        <label htmlFor="fp-title" className="mb-2 block text-sm font-semibold text-zinc-300">
          Title *
        </label>
        <Input
          id="fp-title"
          placeholder="Brief title for the investigation lead..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={5}
          maxLength={200}
          className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
        />
        <p className="mt-1 text-xs text-zinc-500">{title.length}/200 characters</p>
      </div>

      {/* Description */}
      <div className="glass-card rounded-xl p-6">
        <label htmlFor="fp-desc" className="mb-2 block text-sm font-semibold text-zinc-300">
          Description *
        </label>
        <textarea
          id="fp-desc"
          placeholder="Describe what you want CERBERUS to investigate. Include names, organizations, suspicious activities, and any context you have..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={20}
          maxLength={10000}
          rows={6}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-orange-500/50"
        />
        <p className="mt-1 text-xs text-zinc-500">{description.length}/10000 characters</p>
      </div>

      {/* Links */}
      <div className="glass-card rounded-xl p-6">
        <label className="mb-2 block text-sm font-semibold text-zinc-300">
          Links & Sources
        </label>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <Input
                type="url"
                placeholder="https://..."
                value={link}
                onChange={(e) => updateLink(i, e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
              />
              {links.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLink(i)}
                  className="text-zinc-500 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {links.length < 20 && (
          <Button
            type="button"
            variant="ghost"
            onClick={addLink}
            className="mt-2 text-xs text-zinc-400 hover:text-white"
          >
            <Plus className="mr-1 h-3 w-3" /> Add link
          </Button>
        )}
      </div>

      {/* Files */}
      <div className="glass-card rounded-xl p-6">
        <label className="mb-2 block text-sm font-semibold text-zinc-300">
          Attachments
        </label>

        {files.length > 0 && (
          <div className="mb-3 space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-300">{file.name}</span>
                  <span className="text-xs text-zinc-500">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(i)}
                  className="h-6 w-6 text-zinc-500 hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {files.length < 5 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) {
                const input = fileInputRef.current;
                if (input) {
                  const dt = new DataTransfer();
                  Array.from(e.dataTransfer.files).forEach((f) => dt.items.add(f));
                  input.files = dt.files;
                  input.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }
            }}
            className="cursor-pointer rounded-lg border-2 border-dashed border-white/10 p-6 text-center transition-colors hover:border-orange-500/30"
          >
            <Upload className="mx-auto h-8 w-8 text-zinc-500" />
            <p className="mt-2 text-sm text-zinc-400">
              Drop files here or click to browse
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              PDF, DOCX, TXT, MD, PNG, JPEG — max 10MB each, 5 files total
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={submitState === "submitting" || title.length < 5 || description.length < 20}
        className="w-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {submitState === "submitting" ? (
          "Submitting..."
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Submit FocusPoint
          </>
        )}
      </Button>
    </form>
  );
}
