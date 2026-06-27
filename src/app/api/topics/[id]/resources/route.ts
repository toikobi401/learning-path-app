import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiComplete } from "@/lib/ai";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership via topic → phase → path → goal
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      phase: {
        include: {
          path: { include: { goal: { select: { user_id: true } } } },
        },
      },
      resources: {
        orderBy: { type: "asc" },
        select: { id: true, title: true, url: true, type: true, source: true },
      },
    },
  });

  if (!topic || topic.phase.path.goal.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(topic.resources);
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // Verify ownership and get topic context
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      phase: {
        include: {
          path: {
            include: { goal: { select: { user_id: true, title: true, level: true } } },
          },
        },
      },
    },
  });

  if (!topic || topic.phase.path.goal.user_id !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // If user is adding a resource manually
  if (body.title && body.url) {
    const validTypes = ["article", "video", "course", "doc"] as const;
    const type = validTypes.includes(body.type) ? body.type : "article";

    const resource = await prisma.resource.create({
      data: {
        topic_id: id,
        title: body.title,
        url: body.url,
        type,
        source: "user_added",
      },
    });
    return NextResponse.json(resource, { status: 201 });
  }

  // AI-generate resources for this topic
  const goal = topic.phase.path.goal;

  const prompt = `You are a learning resource curator. Suggest 4-5 high-quality learning resources for this topic.

Topic: "${topic.title}"
Description: ${topic.description}
Level: ${goal.level}
Context: Part of a learning goal about "${goal.title}"

Return ONLY valid JSON. No markdown, no extra text.

{
  "resources": [
    {
      "title": "Resource name",
      "url": "https://...",
      "type": "article" | "video" | "course" | "doc"
    }
  ]
}

Rules:
- Suggest only real, widely-known resources (MDN, official docs, YouTube channels with millions of subscribers, Coursera, freeCodeCamp, etc.)
- Prefer free resources; include 1-2 paid courses if they are highly regarded
- URLs must be real and accurate (homepage or section URL, not deep links that may break)
- type must be one of: article, video, course, doc
- Return exactly 4-5 resources`;

  const raw =
    (await aiComplete(session.user.id, "generation", {
      messages: [
        { role: "system", content: "You are a learning resource curator. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      json: true,
      temperature: 0.5,
      maxTokens: 1024,
    })) || "{}";
  let parsed: { resources?: Array<{ title: string; url: string; type: string }> };

  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 502 });
  }

  const validTypes = ["article", "video", "course", "doc"] as const;
  type ValidType = (typeof validTypes)[number];

  const resourcesData = (parsed.resources ?? [])
    .filter((r) => r.title && r.url)
    .map((r) => ({
      topic_id: id,
      title: r.title,
      url: r.url,
      type: (validTypes.includes(r.type as ValidType) ? r.type : "article") as ValidType,
      source: "ai_suggested" as const,
    }));

  if (resourcesData.length === 0) {
    return NextResponse.json({ error: "No resources generated." }, { status: 502 });
  }

  // Delete existing AI-suggested resources and replace
  await prisma.resource.deleteMany({
    where: { topic_id: id, source: "ai_suggested" },
  });

  await prisma.resource.createMany({ data: resourcesData });

  const resources = await prisma.resource.findMany({
    where: { topic_id: id },
    orderBy: { type: "asc" },
    select: { id: true, title: true, url: true, type: true, source: true },
  });

  return NextResponse.json(resources, { status: 201 });
}
