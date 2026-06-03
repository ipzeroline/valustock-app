"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, Card, CardHeader } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import {
  Check,
  MessageSquare,
  RefreshCw,
  Star,
  Trash2,
  X,
} from "@/lib/icons";

type ReviewStatus = "pending" | "approved" | "rejected";

interface AdminReview {
  id: number;
  user_email: string;
  user_name: string;
  rating: number;
  title: string | null;
  content: string;
  status: ReviewStatus;
  admin_note: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<ReviewStatus, { th: string; en: string }> = {
  pending: { th: "รออนุมัติ", en: "Pending" },
  approved: { th: "อนุมัติแล้ว", en: "Approved" },
  rejected: { th: "ปฏิเสธ", en: "Rejected" },
};

export default function AdminReviewsPage() {
  const { lang, t } = useTranslation();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [status, setStatus] = useState<ReviewStatus | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const fetchReviews = () => {
    setLoading(true);
    setError("");
    const query = status === "all" ? "" : `?status=${status}`;
    fetch(`/api/admin/reviews${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setReviews(data.reviews || []);
      })
      .catch((err) => setError(err.message || "Could not load reviews"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, [status]);

  const counts = useMemo(() => {
    return reviews.reduce(
      (acc, review) => {
        acc[review.status] += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 } as Record<ReviewStatus, number>
    );
  }, [reviews]);

  const updateReview = async (id: number, nextStatus: ReviewStatus) => {
    setSavingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update review");
      fetchReviews();
    } catch (err: any) {
      setError(err.message || "Could not update review");
    } finally {
      setSavingId(null);
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm(lang === "th" ? "ต้องการลบรีวิวนี้หรือไม่?" : "Delete this review?")) return;
    setSavingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete review");
      fetchReviews();
    } catch (err: any) {
      setError(err.message || "Could not delete review");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-brand" />
            {lang === "th" ? "อนุมัติรีวิวผู้ใช้งาน" : "User Review Approval"}
          </h1>
          <p className="text-xs text-muted mt-1.5">
            {lang === "th"
              ? "ตรวจสอบรีวิวก่อนเผยแพร่หน้าแรกและก่อนนำไปใช้ใน SEO structured data"
              : "Moderate reviews before they appear on the homepage and SEO structured data."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReviews} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {lang === "th" ? "โหลดใหม่" : "Refresh"}
        </Button>
      </div>

      <Card className="border border-line">
        <CardHeader
          title={lang === "th" ? "รายการรีวิวในฐานข้อมูล" : "Review Database"}
          subtitle={lang === "th" ? "ผู้ใช้ 1 คนมีได้ 1 รีวิว หากแก้ไขจะกลับไปรออนุมัติใหม่" : "Each member has one review. Edited reviews return to pending approval."}
          icon={<MessageSquare className="h-4 w-4" />}
          right={
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {(["pending", "approved", "rejected", "all"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStatus(item)}
                  className={`h-9 rounded-xl border px-3 text-[11px] font-black transition ${
                    status === item
                      ? "border-brand bg-brand text-bg"
                      : "border-line bg-bg text-muted hover:border-brand/40 hover:text-ink"
                  }`}
                >
                  {item === "all"
                    ? lang === "th" ? "ทั้งหมด" : "All"
                    : statusLabels[item][lang]}
                </button>
              ))}
            </div>
          }
        />

        {error && (
          <div className="m-5 rounded-xl border border-down/30 bg-down/10 p-3 text-xs font-bold text-down">
            {error}
          </div>
        )}

        <div className="grid gap-3 border-b border-line/50 px-5 py-4 sm:grid-cols-3">
          {(["pending", "approved", "rejected"] as const).map((item) => (
            <div key={item} className="rounded-xl border border-line bg-bg/45 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {statusLabels[item][lang]}
              </div>
              <div className="mt-1 font-display text-xl font-black text-ink">{counts[item]}</div>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-xs text-muted animate-pulse">{t("common.loading")}</div>
          ) : reviews.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted">
              {lang === "th" ? "ยังไม่มีรีวิวในสถานะนี้" : "No reviews in this status."}
            </div>
          ) : (
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-elevate text-muted uppercase tracking-wider font-semibold">
                  <th className="p-3.5 pl-5">{lang === "th" ? "ผู้ใช้" : "Member"}</th>
                  <th className="p-3.5">{lang === "th" ? "รีวิว" : "Review"}</th>
                  <th className="p-3.5">{lang === "th" ? "คะแนน" : "Rating"}</th>
                  <th className="p-3.5">{lang === "th" ? "สถานะ" : "Status"}</th>
                  <th className="p-3.5 pr-5 text-right">{lang === "th" ? "จัดการ" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reviews.map((review) => (
                  <tr key={review.id} className="align-top hover:bg-elevate/35">
                    <td className="p-3.5 pl-5">
                      <div className="font-bold text-ink">{review.user_name}</div>
                      <div className="mt-0.5 text-[10px] text-muted">{review.user_email}</div>
                      <div className="mt-2 text-[10px] text-muted">
                        {new Date(review.created_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US")}
                      </div>
                    </td>
                    <td className="max-w-lg p-3.5">
                      {review.title && <div className="font-display text-sm font-bold text-ink">{review.title}</div>}
                      <p className="mt-1 leading-relaxed text-muted [overflow-wrap:anywhere]">{review.content}</p>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 text-gold">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`h-3.5 w-3.5 ${index < review.rating ? "fill-current" : "opacity-25"}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge
                        tone={review.status === "approved" ? "up" : review.status === "rejected" ? "down" : "gold"}
                        className="text-[10px] font-bold"
                      >
                        {statusLabels[review.status][lang]}
                      </Badge>
                    </td>
                    <td className="p-3.5 pr-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={savingId === review.id}
                          onClick={() => updateReview(review.id, "approved")}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-up/30 bg-up/10 text-up transition hover:bg-up/20 disabled:opacity-50"
                          title={lang === "th" ? "อนุมัติ" : "Approve"}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={savingId === review.id}
                          onClick={() => updateReview(review.id, "rejected")}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-down/30 bg-down/10 text-down transition hover:bg-down/20 disabled:opacity-50"
                          title={lang === "th" ? "ปฏิเสธ" : "Reject"}
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={savingId === review.id}
                          onClick={() => deleteReview(review.id)}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-bg text-muted transition hover:border-down/40 hover:text-down disabled:opacity-50"
                          title={lang === "th" ? "ลบ" : "Delete"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
