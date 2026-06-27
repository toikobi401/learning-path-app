import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopicLearnView from "@/components/topic-learn-view";

type Params = { params: Promise<{ id: string; topicId: string }> };

export default async function TopicLearnPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { id: goalId, topicId } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      lesson: true,
      resources: {
        orderBy: { type: "asc" },
        select: { id: true, title: true, url: true, type: true, source: true },
      },
      progress_logs: {
        where: { user_id: session.user.id },
        select: { status: true, note: true },
      },
      phase: {
        include: {
          path: {
            include: {
              goal: { select: { id: true, user_id: true, title: true } },
              phases: {
                orderBy: { order_index: "asc" },
                include: {
                  topics: {
                    orderBy: [{ week_number: "asc" }, { order_index: "asc" }],
                    select: { id: true, title: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!topic || topic.phase.path.goal.user_id !== session.user.id) notFound();
  // URL goalId phải khớp goal thực sự của topic
  if (topic.phase.path.goal.id !== goalId) notFound();

  // Danh sách topic phẳng để điều hướng trước/tiếp
  const flat = topic.phase.path.phases.flatMap((p) => p.topics);
  const idx = flat.findIndex((tp) => tp.id === topicId);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null;

  const log = topic.progress_logs[0];

  return (
    <TopicLearnView
      goalId={topic.phase.path.goal.id}
      goalTitle={topic.phase.path.goal.title}
      phaseTitle={topic.phase.title}
      topic={{
        id: topic.id,
        title: topic.title,
        description: topic.description,
        week_number: topic.week_number,
        estimated_hrs: topic.estimated_hrs,
      }}
      initialLesson={topic.lesson?.content ?? null}
      initialStatus={log?.status ?? "not_started"}
      initialNote={log?.note ?? ""}
      initialResources={topic.resources}
      prev={prev}
      next={next}
    />
  );
}
