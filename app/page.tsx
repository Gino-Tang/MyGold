"use client";

import { useState } from "react";
import { ExtensionPayment } from "../components/extension-payment";

type Theme = "wood" | "fire" | "earth" | "gold" | "water";
const themes: { key: Theme; symbol: string; name: string; description: string }[] = [
  { key: "wood", symbol: "木", name: "ธาตุไม้", description: "เติบโต อบอุ่น" },
  { key: "fire", symbol: "火", name: "ธาตุไฟ", description: "มั่นใจ มีพลัง" },
  { key: "earth", symbol: "土", name: "ธาตุดิน", description: "มั่นคง น่าเชื่อถือ" },
  { key: "gold", symbol: "金", name: "ธาตุทอง", description: "มั่งคั่ง สง่างาม" },
  { key: "water", symbol: "水", name: "ธาตุน้ำ", description: "ราบรื่น ไว้วางใจ" },
];

export default function Home() {
  const [theme, setTheme] = useState<Theme>("gold");
  const [menuOpen, setMenuOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const themeName = themes.find((item) => item.key === theme)?.name;
  return <main className="app-shell" data-theme={theme}>
    <header className="topbar">
      <div className="brand"><span className="brand-mark">✦</span><span>ทองดี</span></div>
      <button className="theme-trigger" onClick={() => setMenuOpen(!menuOpen)}>{themeName}<span className="chevron">⌄</span></button>
      {menuOpen && <div className="theme-menu"><p>เลือกธาตุประจำร้าน</p>{themes.map((item) => <button key={item.key} className={theme === item.key ? "selected" : ""} onClick={() => { setTheme(item.key); setMenuOpen(false); }}><i>{item.symbol}</i><span>{item.name}<small>{item.description}</small></span><b>{theme === item.key ? "✓" : ""}</b></button>)}</div>}
      <button className="avatar" aria-label="โปรไฟล์">ก</button>
    </header>
    <section className="hero"><div className="hero-copy"><p className="eyebrow">ยินดีต้อนรับกลับมา</p><h1>คุณกานต์ธิดา <span>✦</span></h1><p>จัดการสัญญาขายฝากของคุณได้ง่าย ๆ ที่นี่</p></div><div className="orb orb-one" /><div className="orb orb-two" /></section>
    <section className="summary-grid" aria-label="ภาพรวมสัญญา">
      <Summary icon="▤" name="doc" label="สัญญาที่ยังใช้งาน" value="2" unit="สัญญา" /><Summary icon="◷" name="clock" label="ใกล้ครบกำหนด" value="1" unit="สัญญา" /><Summary icon="฿" name="coin" label="ยอดขายฝากรวม" value="85,000" unit="บาท" />
    </section>
    <section className="contracts-head"><div><p className="eyebrow">สัญญาของคุณ</p><h2>สัญญาขายฝาก <span className="count">2</span></h2></div><button className="filter">ตัวกรอง <span>⌄</span></button></section>
    <section className="contract-list"><Contract urgent onExtend={() => setPaymentOpen(true)} /><Contract /></section>
    <p className="legal-note">อัตราค่าขยายเวลาไถ่ถอนเป็นไปตามข้อตกลงในสัญญา</p>
    {paymentOpen && <ExtensionPayment onClose={() => setPaymentOpen(false)} />}
  </main>;
}

function Summary({ icon, name, label, value, unit }: { icon: string; name: string; label: string; value: string; unit: string }) { return <article><span className={`summary-icon ${name}`}>{icon}</span><div><p>{label}</p><strong>{value} <small>{unit}</small></strong></div></article>; }
function Contract({ urgent = false, onExtend }: { urgent?: boolean; onExtend?: () => void }) {
  const number = urgent ? "CG-2025-0418" : "CG-2025-0321", amount = urgent ? "45,000" : "40,000", expiry = urgent ? "18 มิ.ย. 2568" : "21 ส.ค. 2568", fee = urgent ? "562.50" : "500.00";
  return <article className={`contract-card ${urgent ? "urgent" : ""}`}><div className="card-top"><span className={`status ${urgent ? "urgent-status" : "active-status"}`}>{urgent ? "ใกล้ครบกำหนด" : "ใช้งานอยู่"}</span><button className="more" aria-label="ตัวเลือก">•••</button></div><div className="contract-title"><div className="gold-token">Au</div><div><h3>สัญญาเลขที่ {number}</h3><p>ทองรูปพรรณ 96.5% · {urgent ? "1" : "2"} บาท</p></div></div><div className="details"><div><p>ยอดขายฝาก</p><strong>{amount} <small>บาท</small></strong></div><div><p>วันครบกำหนดไถ่ถอนเดิม</p><strong className={urgent ? "danger" : ""}>{expiry}</strong><em className={urgent ? "" : "safe"}>{urgent ? "เหลืออีก 7 วัน" : "เหลืออีก 71 วัน"}</em></div></div><div className="fee-row"><div><span className="fee-icon">◌</span><div><p>ค่าขยายเวลาไถ่ถอน <small>(ต่ออายุสัญญา)</small></p><b>{fee} บาท <small>/ เดือน</small></b></div></div><span className="rate">1.25%</span></div>{urgent ? <button className="primary" onClick={onExtend}>จ่ายค่าขยายเวลาเพื่อต่ออายุสัญญา <span>→</span></button> : <button className="secondary">ดูรายละเอียดสัญญา <span>→</span></button>}</article>;
}
