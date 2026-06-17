"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, Badge } from "@/components/ui/Card";
import { Modal, Field } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/translations";
import { Crown, Sparkles, Plus, CheckCircle, Trash2, Calendar, FileText } from "@/lib/icons";

interface AdminPayment {
  id: number;
  user_email: string;
  amount: number;
  plan: string;
  billing: string;
  status: string; // 'pending' | 'verified' | 'failed'
  payment_method: string;
  transaction_ref: string;
  created_at: string;
}

export default function AdminPayments() {
  const { lang } = useTranslation();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);

  // New payment form modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [amountInput, setAmountInput] = useState("49");
  const [planInput, setPlanInput] = useState("pro");
  const [billingInput, setBillingInput] = useState("monthly");
  const [methodInput, setMethodInput] = useState("promptpay");
  const [refInput, setRefInput] = useState("");

  const fetchPayments = () => {
    setLoading(true);
    fetch("/api/admin/payments")
      .then((res) => res.json())
      .then((data) => {
        setPayments(data.payments || []);
        setMockMode(!!data.mockMode);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching payments:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const applyPlanDefaults = (plan: string) => {
    setPlanInput(plan);
    if (plan === "lifetime") {
      setBillingInput("lifetime");
      setAmountInput("888");
    } else if (plan === "premium") {
      setBillingInput((current) => (current === "lifetime" ? "monthly" : current));
      setAmountInput("88");
    } else {
      setBillingInput((current) => (current === "lifetime" ? "monthly" : current));
      setAmountInput("49");
    }
  };

  const handleApprove = async (pay: AdminPayment) => {
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pay.id,
          user_email: pay.user_email,
          plan: pay.plan,
          billing: pay.billing,
          status: "verified",
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistic UI updates
        setPayments((prev) =>
          prev.map((p) => (p.id === pay.id ? { ...p, status: "verified" } : p))
        );
        // If in mock mode, alert
        if (data.mockMode) {
          alert(
            lang === "th"
              ? "อนุมัติรายการชำระเงินเรียบร้อย (ระบบ Sandbox)"
              : "Payment verified successfully (Sandbox Mode)"
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes("@")) return;

    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: emailInput,
          amount: parseFloat(amountInput),
          plan: planInput,
          billing: billingInput,
          status: "verified", // manual entry is pre-verified
          payment_method: methodInput,
          transaction_ref: refInput || "MANUAL_" + Date.now().toString().slice(-6),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchPayments();
        // Clear inputs
        setEmailInput("");
        setRefInput("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(lang === "th" ? "ต้องการลบข้อมูลประวัตินี้จริงหรือไม่?" : "Are you sure you want to delete this log?")) return;
    try {
      const res = await fetch("/api/admin/payments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setPayments((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2">
            <Crown className="h-7 w-7 text-gold shrink-0" />
            {lang === "th" ? "ระบบจัดการสลิปและการชำระเงิน" : "Subscription Payments Audit"}
          </h1>
          <p className="text-xs text-muted mt-1">
            {lang === "th"
              ? "ตรวจสอบประวัติชำระค่าสมาชิกพรีเมียม และอนุมัติการโอนเงินธนาคารเพื่อเปิดแผนลงทุนอัตโนมัติ"
              : "Review direct premium invoices, process pending bank transfers, and verify client VIP access."}
          </p>
        </div>

        <Button
          size="sm"
          className="flex items-center gap-2 bg-brand text-bg hover:bg-brand/90"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {lang === "th" ? "บันทึกการรับเงินแมนนวล" : "Record Manual Payment"}
        </Button>
      </div>

      {mockMode && (
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 flex items-center gap-3 text-xs text-gold">
          <Sparkles className="h-4.5 w-4.5 text-gold animate-pulse shrink-0" />
          <span>
            {lang === "th"
              ? "Sandbox Active: การกระทำทั้งหมดจัดเก็บลง Memory ชั่วคราวเนื่องจากฐานข้อมูล production ยังเชื่อมต่อไม่ได้"
              : "Sandbox Active: Action is operating on memory state because the production data service is offline."}
          </span>
        </div>
      )}

      {/* Main transactions container */}
      <Card className="border border-line overflow-hidden">
        <CardHeader
          title={lang === "th" ? "ประวัติการชำระเงินค่าสมัครสมาชิก" : "Recent Invoices & Transactions"}
          subtitle={lang === "th" ? "รายการที่รันและเปิดใช้บริการในระบบทั้งหมด" : "Overview of paid and pending subscribers"}
          icon={<FileText className="h-5 w-5" />}
        />

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted font-mono">LOADING SYSTEM INVOICES...</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              {lang === "th" ? "ไม่มีประวัติการชำระเงิน" : "No invoices found"}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-elevate/50 text-muted font-semibold">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">{lang === "th" ? "อีเมลผู้ใช้งาน" : "SUBSCRIBER"}</th>
                  <th className="px-5 py-3 text-right">{lang === "th" ? "ยอดชำระ" : "AMOUNT"}</th>
                  <th className="px-5 py-3">{lang === "th" ? "แผนและรอบบิล" : "PACKAGE"}</th>
                  <th className="px-5 py-3">{lang === "th" ? "ช่องทาง" : "METHOD"}</th>
                  <th className="px-5 py-3">{lang === "th" ? "เลขอ้างอิง" : "REFERENCE"}</th>
                  <th className="px-5 py-3">{lang === "th" ? "วันที่ทำรายการ" : "DATE"}</th>
                  <th className="px-5 py-3">{lang === "th" ? "สถานะ" : "STATUS"}</th>
                  <th className="px-5 py-3 text-right">{lang === "th" ? "จัดการ" : "ACTIONS"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-elevate/30 transition">
                    <td className="px-5 py-3.5 font-mono text-muted">{pay.id}</td>
                    <td className="px-5 py-3.5 font-medium text-ink">{pay.user_email}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-ink">
                      {pay.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} THB
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Badge tone={pay.plan === "premium" || pay.plan === "lifetime" ? "gold" : pay.plan === "pro" ? "brand" : "muted"}>
                          {pay.plan.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted capitalize">({pay.billing})</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 capitalize text-muted">{pay.payment_method}</td>
                    <td className="px-5 py-3.5 font-mono text-muted select-all">{pay.transaction_ref}</td>
                    <td className="px-5 py-3.5 text-muted flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(pay.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={pay.status === "verified" ? "up" : pay.status === "pending" ? "gold" : "down"}>
                        {pay.status === "verified"
                          ? lang === "th"
                            ? "อนุมัติแล้ว"
                            : "Verified"
                          : pay.status === "pending"
                          ? lang === "th"
                            ? "รอตรวจสอบ"
                            : "Pending"
                          : lang === "th"
                          ? "ล้มเหลว"
                          : "Failed"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {pay.status === "pending" && (
                          <button
                            onClick={() => handleApprove(pay)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-brand text-bg rounded-lg font-bold hover:bg-brand/90 transition"
                            title={lang === "th" ? "อนุมัติแผนสมาชิก" : "Verify Invoice"}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {lang === "th" ? "อนุมัติโอน" : "Verify"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(pay.id)}
                          className="p-1.5 text-muted hover:text-down hover:bg-down-soft rounded-lg transition"
                          title="Delete transaction log"
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

      {/* Record payment modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={lang === "th" ? "บันทึกข้อมูลรับชำระเงินแมนนวล" : "Record Cash/Transfer Invoice"}
      >
        <form onSubmit={handleAddPayment} className="space-y-4 text-left">
          <Field label={lang === "th" ? "อีเมลสมาชิก" : "Subscriber Email"}>
            <input
              className="input-base text-sm"
              type="email"
              placeholder="client@gmail.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "th" ? "จำนวนเงิน (THB)" : "Amount Received"}>
              <input
                className="input-base text-sm font-mono"
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                required
              />
            </Field>

            <Field label={lang === "th" ? "ช่องทางการชำระ" : "Payment Method"}>
              <select
                className="input-base text-sm"
                value={methodInput}
                onChange={(e) => setMethodInput(e.target.value)}
              >
                <option value="promptpay">PromptPay</option>
                <option value="bank_transfer">{lang === "th" ? "โอนเงินธนาคาร" : "Bank Transfer"}</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={lang === "th" ? "แพ็กเกจ" : "Product Plan"}>
              <select
                className="input-base text-sm"
                value={planInput}
                onChange={(e) => applyPlanDefaults(e.target.value)}
              >
                <option value="pro">Pro Plan</option>
                <option value="premium">Premium Plan</option>
                <option value="lifetime">Lifetime Plan</option>
              </select>
            </Field>

            <Field label={lang === "th" ? "รอบบิล" : "Billing Interval"}>
              <select
                className="input-base text-sm"
                value={billingInput}
                onChange={(e) => setBillingInput(e.target.value)}
              >
                <option value="monthly">{lang === "th" ? "รายเดือน" : "Monthly"}</option>
                <option value="yearly">{lang === "th" ? "รายปี" : "Yearly"}</option>
                <option value="lifetime">{lang === "th" ? "ตลอดชีพ" : "Lifetime"}</option>
              </select>
            </Field>
          </div>

          <Field label={lang === "th" ? "เลขที่อ้างอิงธุรกรรม / Slip Ref (ไม่บังคับ)" : "Slip Reference ID (Optional)"}>
            <input
              className="input-base text-sm font-mono"
              placeholder="DBX98765432"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
            />
          </Field>

          <Button type="submit" size="lg" className="w-full text-white bg-brand hover:bg-brand/90 font-semibold shadow-glow">
            {lang === "th" ? "บันทึกและเปิดสิทธิ์ทันที" : "Register & Grant VIP Access"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
