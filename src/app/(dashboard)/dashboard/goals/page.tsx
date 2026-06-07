"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

type LearningPath = { id: string; status: string };

type Goal = {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  hours_per_day: number;
  deadline: string;
  status: "active" | "paused" | "completed";
  created_at: string;
  learning_path: LearningPath | null;
};

type EditForm = {
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  hours_per_day: string;
  deadline: string;
  status: "active" | "paused" | "completed";
};

const LEVEL_COLOR: Record<Goal["level"], string> = {
  beginner: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  intermediate: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  advanced: "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-800",
};

const STATUS_COLOR: Record<Goal["status"], string> = {
  active: "bg-green-50 text-green-700 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800",
  paused: "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:ring-yellow-800",
  completed: "bg-gray-100 text-gray-600 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700",
};

function toDateInputValue(iso: string) { return iso.split("T")[0]; }
function todayString() { return new Date().toISOString().split("T")[0]; }

function formatDeadline(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function GoalsPage() {
  const { t, lang } = useLanguage();
  const gt = t.goals;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/goals");
    if (res.ok) setGoals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  function openEdit(goal: Goal) {
    setEditingGoal(goal);
    setEditError(null);
    setEditForm({
      title: goal.title, description: goal.description, level: goal.level,
      hours_per_day: String(goal.hours_per_day),
      deadline: toDateInputValue(goal.deadline), status: goal.status,
    });
  }

  function closeEdit() { setEditingGoal(null); setEditForm(null); setEditError(null); }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingGoal || !editForm) return;
    setEditLoading(true); setEditError(null);
    const res = await fetch(`/api/goals/${editingGoal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, hours_per_day: parseFloat(editForm.hours_per_day) }),
    });
    const data = await res.json();
    setEditLoading(false);
    if (!res.ok) { setEditError(data.error ?? "Update failed."); return; }
    setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? { ...g, ...data } : g)));
    closeEdit();
  }

  async function handleDelete() {
    if (!deletingId) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/goals/${deletingId}`, { method: "DELETE" });
    setDeleteLoading(false);
    if (res.ok || res.status === 204) setGoals((prev) => prev.filter((g) => g.id !== deletingId));
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100" />
      </div>
    );
  }

  const inputCls = "mt-1 block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-gray-600 dark:focus:ring-gray-800";

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-6 dark:border-gray-800">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{gt.title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{gt.subtitle}</p>
        </div>
        <Link href="/dashboard/goals/new" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
          {gt.newGoal}
        </Link>
      </div>

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-8 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{gt.noGoals}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">{gt.noGoalsDesc}</p>
          <Link href="/dashboard/goals/new" className="mt-6 inline-block rounded-md bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
            {gt.createFirstGoal}
          </Link>
        </div>
      )}

      {/* Goals grid */}
      {goals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <article key={goal.id} className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${LEVEL_COLOR[goal.level]}`}>
                    {gt.level[goal.level]}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STATUS_COLOR[goal.status]}`}>
                    {gt.status[goal.status]}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => openEdit(goal)} className="rounded px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                    {gt.edit}
                  </button>
                  <button onClick={() => setDeletingId(goal.id)} className="rounded px-2 py-1 text-xs text-red-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                    {gt.delete}
                  </button>
                </div>
              </div>
              <h2 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{goal.title}</h2>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {goal.hours_per_day}{gt.hoursPerDay} &middot; {gt.dueDate} {formatDeadline(goal.deadline, lang)}
              </p>
              <p className="mt-2 flex-1 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">{goal.description}</p>
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                {goal.learning_path ? (
                  <Link href={`/dashboard/goals/${goal.id}`} className="text-xs font-medium text-gray-900 hover:underline dark:text-gray-100">
                    {gt.viewPath}
                  </Link>
                ) : (
                  <Link href={`/dashboard/goals/${goal.id}`} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    {gt.generatePath}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingGoal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">{gt.editModal.title}</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{gt.editModal.titleLabel}</label>
                <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required minLength={3} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{gt.editModal.descLabel}</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} required minLength={10} rows={3} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{gt.editModal.levelLabel}</label>
                  <select value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value as Goal["level"] })} className={inputCls}>
                    <option value="beginner">{gt.level.beginner}</option>
                    <option value="intermediate">{gt.level.intermediate}</option>
                    <option value="advanced">{gt.level.advanced}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{gt.editModal.statusLabel}</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Goal["status"] })} className={inputCls}>
                    <option value="active">{gt.status.active}</option>
                    <option value="paused">{gt.status.paused}</option>
                    <option value="completed">{gt.status.completed}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{gt.editModal.hoursLabel}</label>
                  <input type="number" value={editForm.hours_per_day} onChange={(e) => setEditForm({ ...editForm, hours_per_day: e.target.value })} min={0.5} max={12} step={0.5} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{gt.editModal.deadlineLabel}</label>
                  <input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} min={todayString()} required className={inputCls} />
                </div>
              </div>
              {editError && <p className="text-xs text-red-600 dark:text-red-400">{editError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={closeEdit} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                  {gt.editModal.cancel}
                </button>
                <button type="submit" disabled={editLoading} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
                  {editLoading ? gt.editModal.saving : gt.editModal.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{gt.deleteModal.title}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{gt.deleteModal.description}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeletingId(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                {gt.deleteModal.cancel}
              </button>
              <button onClick={handleDelete} disabled={deleteLoading} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                {deleteLoading ? gt.deleteModal.deleting : gt.deleteModal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
