"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { useStore } from "@/lib/store";
import { useTranslation } from "@/lib/translations";
import { MessageSquare, Star, Clock, CheckCircle, AlertTriangle, User } from "@/lib/icons";

interface PublicReview {
  id: number;
  name: string;
  emailMask: string;
  rating: number;
  title: string;
  content: string;
  approvedAt: string | null;
  createdAt: string;
}

interface MyReview {
  id: number;
  name: string;
  rating: number;
  title: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ReviewsPage() {
  const { ready, user } = useStore();
  const { lang } = useTranslation();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [form, setForm] = useState({ rating: 5, title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    setLoading(true);
    fetch("/api/reviews?limit=12")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!payload) return;
        setReviews(Array.isArray(payload.reviews) ? payload.reviews : []);
        setMyReview(payload.myReview || null);
        if (payload.myReview) {
          setForm({
            rating: payload.myReview.rating || 5,
            title: payload.myReview.title || "",
            content: payload.myReview.content || "",
          });
        }
      })
      .catch((err) => console.error("Error fetching reviews:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, [user?.email]);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  }, [reviews]);

  const statusTone = myReview?.status === "approved" ? "up" : myReview?.status === "rejected" ? "down" : "gold";
  const statusText = myReview
    ? myReview.status === "approved"
      ? lang === "th" ? "เผยแพร่แล้ว" : "Published"
      : myReview.status === "rejected"
      ? lang === "th" ? "ถูกปฏิเสธ" : "Rejected"
      : lang === "th" ? "รออนุมัติ" : "Pending approval"
    : lang === "th" ? "ยังไม่ได้เขียน" : "Not submitted";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.email) {
      setError(lang === "th" ? "กรุณาเข้าสู่ระบบสมาชิกก่อนเขียนรีวิว" : "Please sign in as a member before writing a review.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: form.rating,
          title: form.title,
          content: form.content,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save review");
      setMessage(lang === "th" ? "ส่งรีวิวแล้ว ระบบจะส่งให้แอดมินตรวจอีกครั้ง" : "Review submitted. It will appear after admin approval.");
      fetchReviews();
    } catch (err: any) {
      setError(
        lang === "th"
          ? "บันทึกรีวิวไม่สำเร็จ กรุณาตรวจสอบข้อความและลองใหม่"
          : err.message || "Could not save your review. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return <div className="mx-auto max-w-5xl py-12 text-sm font-semibold text-muted">{lang === "th" ? "กำลังโหลด..." : "Loading..."}</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-20 text-center animate-fade-up">
        <User className="mx-auto h-10 w-10 text-muted" />
        <h1 className="mt-4 font-display text-2xl font-bold">{lang === "th" ? "เข้าสู่ระบบเพื่อเขียนรีวิว" : "Sign In to Write a Review"}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {lang === "th" ? "เฉพาะสมาชิก ValuStock เท่านั้นที่สามารถส่งรีวิวได้" : "Only ValuStock members can submit reviews."}
        </p>
        <Link href="/login">
          <Button className="mt-5">{lang === "th" ? "เข้าสู่ระบบ" : "Log in"}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">
            {lang === "th" ? "เขียนรีวิว ValuStock" : "Write a ValuStock Review"}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted">
            {lang === "th" ? "สมาชิก 1 คนเขียนได้ 1 รีวิว และแก้ไขได้โดยส่งกลับไปให้แอดมินอนุมัติใหม่" : "Each member can keep one review and resubmit edits for admin approval."}
          </p>
        </div>
        <Badge tone={myReview ? statusTone : "muted"}>{statusText}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <Card>
          <CardHeader
            title={lang === "th" ? "รีวิวของฉัน" : "My Review"}
            subtitle={lang === "th" ? "ชื่อผู้รีวิวใช้จากบัญชีสมาชิกที่ล็อกอินอยู่เท่านั้น" : "Reviewer identity comes from your signed-in member account."}
            icon={<MessageSquare className="h-4 w-4" />}
            right={myReview ? <Badge tone={statusTone}>{statusText}</Badge> : undefined}
          />
          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            {myReview && (
              <div className="rounded-xl border border-line bg-elevate p-4 text-xs font-semibold text-muted">
                <div className="flex items-center gap-2 text-ink">
                  {myReview.status === "approved" ? <CheckCircle className="h-4 w-4 text-up" /> : myReview.status === "rejected" ? <AlertTriangle className="h-4 w-4 text-down" /> : <Clock className="h-4 w-4 text-gold" />}
                  {statusText}
                </div>
                {myReview.adminNote && <div className="mt-2 text-down">{myReview.adminNote}</div>}
              </div>
            )}

            <div>
              <label className="mb-2 block text-xs font-semibold text-muted">{lang === "th" ? "คะแนน" : "Rating"}</label>
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }).map((_, index) => {
                  const rating = index + 1;
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, rating }))}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-bg text-gold transition hover:border-gold/40"
                      title={`${rating}/5`}
                    >
                      <Star className={`h-4.5 w-4.5 ${rating <= form.rating ? "fill-current" : "opacity-25"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">{lang === "th" ? "หัวข้อรีวิว" : "Review Title"}</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                maxLength={160}
                className="input-base text-sm"
                placeholder={lang === "th" ? "ช่วยประเมินมูลค่าหุ้นได้เร็วขึ้น" : "Helps me value stocks faster"}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">{lang === "th" ? "รายละเอียดรีวิว" : "Review Details"}</label>
              <textarea
                required
                minLength={20}
                maxLength={1200}
                rows={8}
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                className="input-base resize-none text-sm"
                placeholder={lang === "th" ? "เล่าว่า ValuStock ช่วยการวิเคราะห์หุ้นของคุณอย่างไร..." : "Share how ValuStock helps your stock analysis..."}
              />
              <div className="mt-1 text-right text-[10px] font-semibold text-muted">{form.content.length}/1200</div>
            </div>

            {error && <div className="text-xs font-bold text-down">{error}</div>}
            {message && <div className="text-xs font-bold text-up">{message}</div>}

            <Button type="submit" className="w-full font-bold" disabled={saving}>
              {saving
                ? lang === "th" ? "กำลังบันทึก..." : "Saving..."
                : myReview ? lang === "th" ? "แก้ไขและส่งตรวจอีกครั้ง" : "Update and Resubmit"
                : lang === "th" ? "ส่งรีวิว" : "Submit Review"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title={lang === "th" ? "รีวิวจากสมาชิก" : "Member Reviews"}
            subtitle={lang === "th" ? `${reviews.length} รีวิว · คะแนนเฉลี่ย ${average.toFixed(1)} / 5.0` : `${reviews.length} reviews · ${average.toFixed(1)} / 5.0 average`}
            icon={<Star className="h-4 w-4" />}
          />
          <div className="max-h-[720px] space-y-3 overflow-y-auto p-5">
            {loading ? (
              <div className="text-sm font-semibold text-muted">{lang === "th" ? "กำลังโหลดรีวิว..." : "Loading reviews..."}</div>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl border border-line bg-elevate p-4 text-sm font-semibold text-muted">
                {lang === "th" ? "ยังไม่มีรีวิวจากสมาชิก" : "No member reviews yet."}
              </div>
            ) : (
              reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-line bg-elevate p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-sm font-bold text-ink">
                        {review.title || (lang === "th" ? "รีวิว ValuStock" : "ValuStock review")}
                      </h2>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-muted">
                        {review.name} · {review.emailMask}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 text-gold">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? "fill-current" : "opacity-25"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium leading-relaxed text-muted [overflow-wrap:anywhere]">{review.content}</p>
                </article>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
