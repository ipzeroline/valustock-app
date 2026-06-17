"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import { Mail, RefreshCw, X, CheckCircle } from "@/lib/icons";

interface NewsletterSubscriber {
  email: string;
  source: string;
  lang: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminNewsletterPage() {
  const { lang, t } = useTranslation();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const active = subscribers.filter((item) => item.status === "subscribed").length;
    const unsubscribed = subscribers.filter((item) => item.status === "unsubscribed").length;
    return { active, unsubscribed, total: subscribers.length };
  }, [subscribers]);

  const fetchSubscribers = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/newsletter")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Unable to load newsletter subscribers");
        setSubscribers(Array.isArray(data.subscribers) ? data.subscribers : []);
        setMockMode(Boolean(data.mockMode));
      })
      .catch((err) => {
        setError(err.message || "Unable to load newsletter subscribers");
        setSubscribers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleUnsubscribe = (email: string) => {
    if (!confirm(lang === "th" ? `ยกเลิกรับข่าวสารของ ${email} หรือไม่?` : `Unsubscribe ${email}?`)) return;

    fetch("/api/admin/newsletter", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Unable to unsubscribe");
        fetchSubscribers();
      })
      .catch((err) => setError(err.message || "Unable to unsubscribe"));
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2">
            <Mail className="h-7 w-7 text-brand" />
            {lang === "th" ? "รายชื่อ Newsletter" : "Newsletter Subscribers"}
          </h1>
          <p className="text-xs text-muted mt-1.5">
            {lang === "th"
              ? "อีเมลจากฟอร์มเกาะติดรายงานวิเคราะห์หุ้นเจาะลึกฟรี พร้อมสถานะและแหล่งที่มา"
              : "Emails captured from the public newsletter funnel, with source, language, and subscription status."}
          </p>
        </div>
        <Button onClick={fetchSubscribers} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4" />
          {lang === "th" ? "รีเฟรช" : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: lang === "th" ? "ทั้งหมด" : "Total", value: stats.total, tone: "muted" as const },
          { label: lang === "th" ? "กำลังรับข่าวสาร" : "Subscribed", value: stats.active, tone: "brand" as const },
          { label: lang === "th" ? "ยกเลิกแล้ว" : "Unsubscribed", value: stats.unsubscribed, tone: "muted" as const },
        ].map((item) => (
          <Card key={item.label} className="border border-line p-4">
            <div className="text-xs font-bold text-muted">{item.label}</div>
            <div className="mt-2 font-display text-3xl font-black text-ink">{item.value}</div>
          </Card>
        ))}
      </div>

      <Card className="border border-line overflow-hidden">
        <CardHeader
          title={lang === "th" ? "ฐานข้อมูลผู้สมัครรับบทวิเคราะห์" : "Subscriber Database"}
          subtitle={mockMode ? "Sandbox" : "SQL Production"}
          icon={<Mail className="h-4 w-4" />}
        />
        {error && (
          <div className="mx-5 mb-4 rounded-xl border border-down/20 bg-down/5 p-3 text-xs font-bold text-down">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-xs text-muted animate-pulse">{t("common.loading")}</div>
          ) : subscribers.length === 0 ? (
            <div className="py-20 text-center text-xs text-muted">
              {lang === "th" ? "ยังไม่มีผู้สมัครรับ newsletter" : "No newsletter subscribers yet."}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-elevate text-muted uppercase tracking-wider font-semibold">
                  <th className="p-3.5 pl-5">Email</th>
                  <th className="p-3.5">{lang === "th" ? "สถานะ" : "Status"}</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5">{lang === "th" ? "ภาษา" : "Lang"}</th>
                  <th className="p-3.5">{lang === "th" ? "สมัครเมื่อ" : "Created"}</th>
                  <th className="p-3.5 pr-5 text-right">{lang === "th" ? "จัดการ" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {subscribers.map((subscriber) => {
                  const active = subscriber.status === "subscribed";
                  return (
                    <tr key={subscriber.email} className="hover:bg-elevate/40 transition">
                      <td className="p-3.5 pl-5 font-bold text-ink">{subscriber.email}</td>
                      <td className="p-3.5">
                        <Badge tone={active ? "brand" : "muted"} className="text-[10px] font-bold">
                          {active ? (
                            <span className="inline-flex items-center gap-1"><CheckCircle className="h-3 w-3" /> subscribed</span>
                          ) : (
                            "unsubscribed"
                          )}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-muted">{subscriber.source || "-"}</td>
                      <td className="p-3.5 text-muted uppercase">{subscriber.lang || "-"}</td>
                      <td className="p-3.5 text-muted">
                        {new Date(subscriber.created_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => handleUnsubscribe(subscriber.email)}
                          disabled={!active}
                          className="inline-flex items-center gap-1 text-[10px] text-down hover:underline font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5" />
                          {lang === "th" ? "ยกเลิก" : "Unsubscribe"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
