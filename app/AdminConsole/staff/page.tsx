"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { Modal, Field } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/translations";
import { Shield, Sparkles, Plus, Edit3, Trash2, Key, Mail, RefreshCw } from "@/lib/icons";

interface AdminStaff {
  id: number;
  username: string;
  name: string;
  role: string; // 'superadmin' | 'analyst' | 'editor' | 'support'
  email: string;
  status: string; // 'active' | 'suspended'
  created_at: string;
}

export default function AdminStaffPanel() {
  const { lang } = useTranslation();
  const [staffList, setStaffList] = useState<AdminStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AdminStaff | null>(null);

  // Form Fields State
  const [usernameInput, setUsernameInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState("support");
  const [emailInput, setEmailInput] = useState("");
  const [statusInput, setStatusInput] = useState("active");

  const fetchStaff = () => {
    setLoading(true);
    fetch("/api/admin/staff")
      .then((res) => res.json())
      .then((data) => {
        setStaffList(data.staff || []);
        setMockMode(!!data.mockMode);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching staff list:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openCreateModal = () => {
    setEditingStaff(null);
    setUsernameInput("");
    setNameInput("");
    setRoleInput("support");
    setEmailInput("");
    setStatusInput("active");
    setModalOpen(true);
  };

  const openEditModal = (staff: AdminStaff) => {
    setEditingStaff(staff);
    setUsernameInput(staff.username);
    setNameInput(staff.name);
    setRoleInput(staff.role);
    setEmailInput(staff.email);
    setStatusInput(staff.status);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !nameInput) return;

    try {
      const payload = {
        id: editingStaff?.id,
        username: usernameInput,
        name: nameInput,
        role: roleInput,
        email: emailInput,
        status: statusInput,
      };

      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchStaff();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(lang === "th" ? "คุณต้องการถอดถอนและลบข้อมูลเจ้าหน้าที่รายนี้จริงหรือไม่?" : "Are you sure you want to remove this staff profile?")) return;

    try {
      const res = await fetch("/api/admin/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (data.success) {
        setStaffList((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const roleLabels: Record<string, string> = {
    superadmin: lang === "th" ? "ผู้ดูแลระบบสูงสุด (Super Admin)" : "Super Admin",
    analyst: lang === "th" ? "นักวิเคราะห์หลักทรัพย์" : "Equity Analyst",
    editor: lang === "th" ? "บรรณาธิการข่าวสาร" : "Content Editor",
    support: lang === "th" ? "ฝ่ายดูแลลูกค้า" : "Customer Support",
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2">
            <Shield className="h-7 w-7 text-brand shrink-0" />
            {lang === "th" ? "ระบบจัดการสิทธิ์เจ้าหน้าที่ปฏิบัติการ" : "Internal Staff Accounts Management"}
          </h1>
          <p className="text-xs text-muted mt-1">
            {lang === "th"
              ? "เพิ่ม ถอดถอน หรือจำกัดสิทธิ์ผู้ปฏิบัติงานระบบ ทีมงานวิเคราะห์ หรืองานบรรณาธิการเขียนบทความ"
              : "Provision administrative permissions, manage equity analysts, and assign editorial content tags."}
          </p>
        </div>

        <Button
          size="sm"
          className="flex items-center gap-2 bg-brand text-bg hover:bg-brand/90"
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" />
          {lang === "th" ? "ลงทะเบียนเจ้าหน้าที่ใหม่" : "Add Staff Profile"}
        </Button>
      </div>

      {mockMode && (
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 flex items-center gap-3 text-xs text-gold">
          <Sparkles className="h-4.5 w-4.5 text-gold animate-pulse shrink-0" />
          <span>
            {lang === "th"
              ? "Sandbox Active: ข้อมูลเจ้าหน้าที่ทำงานบนหน่วยความจำจำลอง เนื่องจาก MariaDB VPS บล็อกสิทธิ์การเชื่อมต่อจากที่อยู่อาศัยปัจจุบันของคุณ"
              : "Sandbox Active: Permissions are operating on local state because database query has failed over network rules."}
          </span>
        </div>
      )}

      {/* Staff Table */}
      <Card className="border border-line overflow-hidden">
        <CardHeader
          title={lang === "th" ? "รายชื่อบุคลากรและเจ้าหน้าที่ที่ได้รับสิทธิ์" : "Operations Control Personnel"}
          subtitle={lang === "th" ? "จัดการทีมสนับสนุนและผู้เผยแพร่ข้อมูลบทความลงทุน" : "Internal users who maintain and moderate ValuStock"}
          icon={<Key className="h-5 w-5" />}
        />

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted font-mono">LOADING STAFF REGISTRY...</div>
          ) : staffList.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              {lang === "th" ? "ไม่มีบัญชีรายชื่อเจ้าหน้าที่" : "No staff accounts found"}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-elevate/50 text-muted font-semibold">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">{lang === "th" ? "ชื่อเจ้าหน้าที่" : "NAME"}</th>
                  <th className="px-5 py-3">{lang === "th" ? "ชื่อบัญชีผู้ใช้" : "USERNAME"}</th>
                  <th className="px-5 py-3">{lang === "th" ? "อีเมลติดต่อ" : "EMAIL"}</th>
                  <th className="px-5 py-3">{lang === "th" ? "บทบาทและตำแหน่ง" : "ROLE & ACCESS LEVEL"}</th>
                  <th className="px-5 py-3">{lang === "th" ? "สถานะการทำงาน" : "STATUS"}</th>
                  <th className="px-5 py-3 text-right">{lang === "th" ? "จัดการ" : "ACTIONS"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-elevate/30 transition">
                    <td className="px-5 py-3.5 font-mono text-muted">{staff.id}</td>
                    <td className="px-5 py-3.5 font-medium text-ink font-display">{staff.name}</td>
                    <td className="px-5 py-3.5 font-mono text-muted">@{staff.username}</td>
                    <td className="px-5 py-3.5 font-mono text-muted flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted/80" />
                      {staff.email || "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Badge tone={staff.role === "superadmin" ? "gold" : staff.role === "analyst" ? "brand" : staff.role === "editor" ? "up" : "muted"}>
                          {staff.role.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted">{roleLabels[staff.role]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={staff.status === "active" ? "up" : "down"}>
                        {staff.status === "active"
                          ? lang === "th"
                            ? "ปฏิบัติงานปกติ"
                            : "Active"
                          : lang === "th"
                          ? "ระงับสิทธิ์ชั่วคราว"
                          : "Suspended"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(staff)}
                          className="p-1.5 text-muted hover:text-brand hover:bg-brand-soft rounded-lg transition"
                          title={lang === "th" ? "แก้ไขสิทธิ์" : "Edit permissions"}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {staff.username !== "zeroline" && (
                          <button
                            onClick={() => handleDelete(staff.id)}
                            className="p-1.5 text-muted hover:text-down hover:bg-down-soft rounded-lg transition"
                            title={lang === "th" ? "ถอดถอนสิทธิ์" : "Revoke staff permissions"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Create / Edit Staff Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingStaff
            ? lang === "th"
              ? "แก้ไขโปรไฟล์และสิทธิ์เจ้าหน้าที่"
              : "Edit Internal Access Level"
            : lang === "th"
            ? "ลงทะเบียนเจ้าหน้าที่ปฏิบัติการรายใหม่"
            : "Provision Administrative Access Profile"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Field label={lang === "th" ? "ชื่อบัญชีผู้ใช้งาน (Username ID)" : "Username ID"}>
            <input
              className="input-base text-sm font-mono"
              type="text"
              placeholder="somchai_editor"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
              disabled={!!editingStaff} // Cannot modify username for safety
            />
          </Field>

          <Field label={lang === "th" ? "ชื่อ-นามสกุลจริงเจ้าหน้าที่" : "Full Operator Name"}>
            <input
              className="input-base text-sm"
              type="text"
              placeholder="สมชาย ยืนเด่น"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
            />
          </Field>

          <Field label={lang === "th" ? "อีเมลติดต่อที่ทำงาน" : "Corporate Email Address"}>
            <input
              className="input-base text-sm font-mono"
              type="email"
              placeholder="somchai@valustock.app"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "th" ? "ตำแหน่งปฏิบัติงาน" : "Corporate Role"}>
              <select
                className="input-base text-sm"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                disabled={editingStaff?.username === "zeroline"} // super admin role is locked
              >
                <option value="support">{lang === "th" ? "ฝ่ายบริการลูกค้า (Support)" : "Support Agent"}</option>
                <option value="editor">{lang === "th" ? "บรรณาธิการเนื้อหา (Editor)" : "Content Editor"}</option>
                <option value="analyst">{lang === "th" ? "นักวิเคราะห์หุ้น (Analyst)" : "Stock Analyst"}</option>
                <option value="superadmin">{lang === "th" ? "แอดมินสูงสุด (Super Admin)" : "Super Admin"}</option>
              </select>
            </Field>

            <Field label={lang === "th" ? "สถานะการปฏิบัติงาน" : "Staff Access Status"}>
              <select
                className="input-base text-sm"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                disabled={editingStaff?.username === "zeroline"} // super admin status is immutable
              >
                <option value="active">{lang === "th" ? "ปฏิบัติงานปกติ (Active)" : "Active"}</option>
                <option value="suspended">{lang === "th" ? "ระงับสิทธิ์ชั่วคราว (Suspended)" : "Suspended"}</option>
              </select>
            </Field>
          </div>

          <Button type="submit" size="lg" className="w-full text-white bg-brand hover:bg-brand/90 font-semibold shadow-glow">
            {editingStaff
              ? lang === "th"
                ? "บันทึกการเปลี่ยนแปลงสิทธิ์"
                : "Apply Security Overrides"
              : lang === "th"
              ? "ยืนยันและเปิดบัญชีทันที"
              : "Provision Access Profile"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
