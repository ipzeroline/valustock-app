"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import {
  Layers,
  Plus,
  Check,
} from "@/lib/icons";

interface AdminArticle {
  slug: string;
  title: string;
  category: string;
  read_time: string;
  summary: string;
  content: string;
  tag: string;
  lang: string;
  created_at?: string;
}

export default function AdminArticles() {
  const { lang, t } = useTranslation();
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [newsResult, setNewsResult] = useState<string | null>(null);

  const [articleForm, setArticleForm] = useState({
    slug: "",
    title: "",
    category: "Asset Allocation",
    read_time: "5 mins",
    summary: "",
    content: "",
    tag: "News",
    lang: "th",
  });

  const handleFetchNews = () => {
    setFetchingNews(true);
    setNewsResult(null);
    fetch("/api/admin/news/fetch", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNewsResult(data.message);
          fetchArticles();
        } else {
          setNewsResult("Error: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Error fetching news:", err);
        setNewsResult("Error: " + err.message);
      })
      .finally(() => setFetchingNews(false));
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = () => {
    setLoading(true);
    fetch("/api/admin/articles")
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles);
      })
      .catch((err) => console.error("Error loading articles:", err))
      .finally(() => setLoading(false));
  };

  const handleArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.slug || !articleForm.title) return;

    fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleForm),
    })
      .then((res) => res.json())
      .then(() => {
        fetchArticles();
        setArticleForm({
          slug: "",
          title: "",
          category: "Asset Allocation",
          read_time: "5 mins",
          summary: "",
          content: "",
          tag: "News",
          lang: "th",
        });
      })
      .catch((err) => console.error("Error creating article:", err));
  };

  const handleArticleDelete = (slug: string) => {
    if (!confirm(lang === "th" ? `ต้องการลบบทความ ${slug} หรือไม่?` : `Are you sure you want to delete article ${slug}?`)) return;

    fetch("/api/admin/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then((res) => res.json())
      .then(() => fetchArticles())
      .catch((err) => console.error("Error deleting article:", err));
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* 1. Page Title */}
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2">
          <Layers className="h-7 w-7 text-brand" /> 
          {lang === "th" ? "จัดการบทความนักลงทุน" : "Manage Articles"}
        </h1>
        <p className="text-xs text-muted mt-1.5">
          เขียนบทความใหม่ แก้ไข หรือลบบทความนำเสนอหน้าแรก (รองรับรูปแบบสองภาษา TH/EN แยกชัดเจน)
        </p>
      </div>
      {/* Automated market news pull console */}
      <Card className="border border-brand/20 bg-brand/5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="chip border-brand/40 bg-brand/10 text-brand text-xs font-semibold uppercase">
              {lang === "th" ? "ขุมพลังหลังบ้าน" : "Core System"}
            </span>
            <h2 className="font-display text-lg font-bold text-ink">
              {lang === "th" ? "ระบบดึงข้อมูลข่าวด่วน & ปรับแต่งเนื้อหาอัตโนมัติ" : "AI Automated News & SEO Engine"}
            </h2>
            <p className="text-xs text-muted max-w-3xl">
              {lang === "th" 
                ? "ดึงข้อมูลจากระบบประมวลผลตลาดเพื่อนำมาแปลภาษาไทยและสร้างเนื้อหาข่าวสารที่เหมาะต่อการติดเสิร์ชเอนจิ้น (SEO-Optimized H1-H3 & Keywords) บันทึกลงฐานข้อมูลอย่างเป็นระบบ"
                : "Pull fresh market reports, automatically translate into local formats, and enrich with search engine optimized headers and tags."}
            </p>
          </div>
          <button
            onClick={handleFetchNews}
            disabled={fetchingNews}
            className="shrink-0 rounded-xl bg-brand text-bg px-5 py-3 font-semibold hover:brightness-110 active:scale-98 transition disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            {fetchingNews ? (lang === "th" ? "กำลังประมวลผลดึงข่าว..." : "Syncing & Translating...") : (lang === "th" ? "📥 ดึงข่าวด่วนและแปลด่วนที่สุด" : "📥 Fetch & Optimize news now")}
          </button>
        </div>
        {newsResult && (
          <div className="mt-4 border-t border-line/60 pt-4 text-xs font-mono text-ink">
            <div className="rounded-lg bg-surface/50 border border-line p-3 text-up">
              {newsResult}
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Left Column: Create Article Form */}
        <Card className="md:col-span-2 border border-line">
          <CardHeader
            title={lang === "th" ? "เขียนบทความใหม่" : "Compose Article"}
            subtitle={lang === "th" ? "รายละเอียดบทความและภาษาเป้าหมาย" : "Provide details and target language option"}
            icon={<Plus className="h-4 w-4" />}
          />
          <form onSubmit={handleArticleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted block mb-1">Slug (ลิงก์ย่อภาษาอังกฤษ)</label>
                <input
                  type="text"
                  required
                  placeholder="how-to-dcf"
                  value={articleForm.slug}
                  onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                  className="input-base text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">หมวดหมู่</label>
                <input
                  type="text"
                  placeholder="Asset Allocation"
                  value={articleForm.category}
                  onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                  className="input-base text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">หัวข้อบทความ</label>
              <input
                type="text"
                required
                placeholder="วิธีการคำนวณ WACC อย่างง่าย"
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                className="input-base text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted block mb-1">เวลาอ่าน (นาที)</label>
                <input
                  type="text"
                  placeholder="5 mins"
                  value={articleForm.read_time}
                  onChange={(e) => setArticleForm({ ...articleForm, read_time: e.target.value })}
                  className="input-base text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">แท็กเด่น</label>
                <input
                  type="text"
                  placeholder="ความรู้ภาษี"
                  value={articleForm.tag}
                  onChange={(e) => setArticleForm({ ...articleForm, tag: e.target.value })}
                  className="input-base text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">ภาษา</label>
                <select
                  value={articleForm.lang}
                  onChange={(e) => setArticleForm({ ...articleForm, lang: e.target.value })}
                  className="input-base text-xs"
                >
                  <option value="th">ไทย (TH)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">คำอธิบายย่อ</label>
              <textarea
                required
                rows={2}
                placeholder="บทวิเคราะห์สรุปหลักการประเมินสำหรับผู้เริ่มต้น..."
                value={articleForm.summary}
                onChange={(e) => setArticleForm({ ...articleForm, summary: e.target.value })}
                className="input-base text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-muted block mb-1">เนื้อหาแบบละเอียด (รองรับ Markdown)</label>
              <textarea
                required
                rows={5}
                placeholder="รายละเอียดบทความที่ต้องการเขียน..."
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                className="input-base text-xs animate-none"
              />
            </div>

            <Button type="submit" className="w-full text-white bg-brand hover:bg-brand/90 mt-2">
              <Check className="h-4 w-4" /> {lang === "th" ? "เผยแพร่บทความนี้" : "Publish Article"}
            </Button>
          </form>
        </Card>

        {/* Right Column: Articles List */}
        <Card className="md:col-span-3 border border-line">
          <CardHeader
            title={lang === "th" ? "คลังบทความปัจจุบัน" : "Published Editorial Board"}
            subtitle={lang === "th" ? "รายการบทความความรู้ทั้งหมด" : "Active list of investor articles"}
            icon={<Layers className="h-4 w-4" />}
          />
          <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="py-20 text-center text-xs text-muted animate-pulse">{t("common.loading")}</div>
            ) : articles.length === 0 ? (
              <p className="py-20 text-center text-xs text-muted">ไม่มีบทความวิเคราะห์ในระบบ</p>
            ) : (
              articles.map((art) => (
                <div key={art.slug} className="rounded-xl border border-line bg-elevate p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-brand uppercase tracking-wider">{art.category}</span>
                      <span className="text-[9px] text-muted">| {art.lang.toUpperCase()}</span>
                      <span className="rounded-full bg-line/80 px-2 py-0.5 text-[9px] text-ink font-semibold">{art.tag}</span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-ink mt-1.5 leading-snug">{art.title}</h4>
                    <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">{art.summary}</p>
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-muted font-medium">
                      <span>Slug: <strong className="font-mono text-ink font-bold">{art.slug}</strong></span>
                      <span>•</span>
                      <span>อ่าน {art.read_time}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleArticleDelete(art.slug)}
                    className="text-xs text-down hover:underline shrink-0"
                  >
                    {lang === "th" ? "ลบออก" : "Delete"}
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
