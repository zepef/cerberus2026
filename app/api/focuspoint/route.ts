import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ghPutFile,
  generateSlug,
  generatePlanMarkdown,
  REPO_OWNER,
  REPO_NAME,
} from "@/scripts/lib/github-write";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total
const MAX_FILES = 5;
const MAX_LINKS = 20;

const FileSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string(),
  base64: z.string(),
  size: z.number().max(MAX_FILE_SIZE, "File exceeds 10MB limit"),
});

const SubmissionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be under 200 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(10000, "Description must be under 10000 characters"),
  links: z.array(z.string().url("Invalid URL")).max(MAX_LINKS, `Maximum ${MAX_LINKS} links`).default([]),
  files: z.array(FileSchema).max(MAX_FILES, `Maximum ${MAX_FILES} files`).default([]),
});

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  rateLimitMap.set(ip, recent);
  return recent.length < RATE_LIMIT_MAX;
}

function recordRequest(ip: string): void {
  const timestamps = rateLimitMap.get(ip) ?? [];
  timestamps.push(Date.now());
  rateLimitMap.set(ip, timestamps);
}

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
]);

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 5 submissions per hour." },
      { status: 429 }
    );
  }

  // Validate PAT
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    return NextResponse.json(
      { error: "Server configuration error: missing GITHUB_PAT" },
      { status: 500 }
    );
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { title, description, links, files } = parsed.data;

  // Validate file types
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}. Allowed: PDF, DOCX, TXT, MD, PNG, JPEG` },
        { status: 400 }
      );
    }
  }

  // Validate total file size
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return NextResponse.json(
      { error: "Total file size exceeds 25MB limit" },
      { status: 400 }
    );
  }

  const slug = generateSlug(title);
  const basePath = `cerberus/focuspoints/${slug}`;

  try {
    // Create plan.md
    const planMarkdown = generatePlanMarkdown({
      title,
      description,
      links,
      attachmentFilenames: files.map((f) => f.name),
    });

    const planBase64 = Buffer.from(planMarkdown, "utf-8").toString("base64");
    await ghPutFile(
      pat,
      REPO_OWNER,
      REPO_NAME,
      `${basePath}/plan.md`,
      planBase64,
      `[FocusPoint] New submission: ${title}`
    );

    // Upload attachments sequentially
    for (const file of files) {
      await ghPutFile(
        pat,
        REPO_OWNER,
        REPO_NAME,
        `${basePath}/attachments/${file.name}`,
        file.base64,
        `[FocusPoint] Attachment: ${file.name}`
      );
    }

    recordRequest(ip);

    return NextResponse.json(
      { success: true, slug, path: basePath },
      { status: 201 }
    );
  } catch (err) {
    console.error("[FocusPoint API] Error:", err);
    return NextResponse.json(
      { error: "Failed to create FocusPoint submission" },
      { status: 500 }
    );
  }
}
