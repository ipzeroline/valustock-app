"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { useTranslation } from "@/lib/translations";
import {
  User,
  Plus,
  Check,
  X,
} from "@/lib/icons";

interface AdminUser {
  email: string;
  name: string;
  plan: string;
  billing: string;
  joined_at: string;
}

export default function AdminUsers() {
  const { lang, t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [mockMode, setMockMode] = useState(true);
  const [loading, setLoading] = useState(true);

  const [userForm, setUserForm] = useState({
    email: "",
    name: "",
    plan: "free",
    billing: "monthly",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users);
        setMockMode(data.mockMode);
      })
      .catch((err) => console.error("Error loading users:", err))
      .finally(() => setLoading(false));
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email.includes("@")) return;

    fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm),
    })
      .then((res) => res.json())
      .then(() => {
        fetchUsers();
        setUserForm({ email: "", name: "", plan: "free", billing: "monthly" });
      })
      .catch((err) => console.error("Error creating user:", err));
  };

  const handleUserDelete = (email: string) => {
    if (!confirm(lang === "th" ? `ต้องการลบผู้ใช้ ${email} หรือไม่?` : `Are you sure you want to delete user ${email}?`)) return;

    fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((res) => res.json())
      .then(() => fetchUsers())
      .catch((err) => console.error("Error deleting user:", err));
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* 1. Page Title */}
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2">
          <User className="h-7 w-7 text-brand" /> 
          {lang === "th" ? "จัดการสมาชิกระบบ" : "Manage Members"}
        </h1>
        <p className="text-xs text-muted mt-1.5">
          สมัครสมาชิกใหม่ อัปเกรดระดับแผนผู้ใช้ (Free / Pro / Premium / Lifetime) และลบบัญชีผู้ใช้งานระบบ
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Left Column: Create User Form */}
        <Card className="md:col-span-2 border border-line">
          <CardHeader
            title={lang === "th" ? "บันทึกระดับสิทธิ์สมาชิก" : "Register / Upgrade Member"}
            subtitle={lang === "th" ? "ระบุข้อมูลสมาขิกและแพ็กเกจ" : "Specify user parameters and billing cycle"}
            icon={<Plus className="h-4 w-4" />}
          />
          <form onSubmit={handleUserSubmit} className="p-5 space-y-4">
            <div>
              <label className="text-xs text-muted block mb-1">
                {lang === "th" ? "อีเมลผู้สมัคร" : "Registered Email"}
              </label>
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="input-base text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">
                {lang === "th" ? "ชื่อสมาขิก" : "Full Name"}
              </label>
              <input
                type="text"
                required
                placeholder="สมชาย ยอดนักลงทุน"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="input-base text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted block mb-1">
                  {lang === "th" ? "ระดับสิทธิ์ (Plan)" : "Plan Tier"}
                </label>
                <select
                  value={userForm.plan}
                  onChange={(e) => setUserForm({ ...userForm, plan: e.target.value })}
                  className="input-base text-xs"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">
                  {lang === "th" ? "รอบการชำระเงิน" : "Billing Cycle"}
                </label>
                <select
                  value={userForm.billing}
                  onChange={(e) => setUserForm({ ...userForm, billing: e.target.value })}
                  className="input-base text-xs"
                >
                  <option value="monthly">{lang === "th" ? "รายเดือน" : "Monthly"}</option>
                  <option value="yearly">{lang === "th" ? "รายปี" : "Annually"}</option>
                  <option value="lifetime">{lang === "th" ? "ตลอดชีพ" : "Lifetime"}</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full text-white bg-brand hover:bg-brand/90 mt-2">
              <Check className="h-4 w-4 animate-pulse" /> {lang === "th" ? "บันทึกระดับสิทธิ์สมาชิก" : "Save Member Account"}
            </Button>
          </form>
        </Card>

        {/* Right Column: Users List Table */}
        <Card className="md:col-span-3 border border-line">
          <CardHeader
            title={lang === "th" ? "บัญชีสมาชิกสะสม" : "Registered Accounts Database"}
            subtitle={mockMode ? (lang === "th" ? "ข้อมูลจำลองพรีเซตใน Sandbox" : "Running in Sandbox Mock Mode") : (lang === "th" ? "ข้อมูลบันทึกในฐานข้อมูล SQL สด" : "Connected to SQL Production")}
            icon={<User className="h-4 w-4" />}
          />
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-xs text-muted animate-pulse">{t("common.loading")}</div>
            ) : users.length === 0 ? (
              <div className="py-20 text-center text-xs text-muted">ไม่มีรายชื่อสมาชิก</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-elevate text-muted uppercase tracking-wider font-semibold">
                    <th className="p-3.5 pl-5">{lang === "th" ? "โปรไฟล์" : "User Profile"}</th>
                    <th className="p-3.5">{lang === "th" ? "ระดับแพ็กเกจ" : "Sub Tier"}</th>
                    <th className="p-3.5">{lang === "th" ? "วันที่เข้าร่วม" : "Joined"}</th>
                    <th className="p-3.5 pr-5 text-right">{lang === "th" ? "จัดการ" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map((u) => (
                    <tr key={u.email} className="hover:bg-elevate/40 transition">
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-ink">{u.name}</div>
                        <div className="text-[10px] text-muted">{u.email}</div>
                      </td>
                      <td className="p-3.5">
                        <Badge tone={u.plan === "premium" || u.plan === "lifetime" ? "gold" : u.plan === "pro" ? "brand" : "muted"} className="capitalize font-bold text-[10px]">
                          {u.plan} ({u.billing === "lifetime" ? "life" : u.billing === "monthly" ? "mo" : "yr"})
                        </Badge>
                      </td>
                      <td className="p-3.5 text-muted">
                        {new Date(u.joined_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => handleUserDelete(u.email)}
                          className="text-[10px] text-down hover:underline font-semibold"
                        >
                          {lang === "th" ? "ลบบัญชี" : "Delete Account"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
