"use client";

import { useRef, useState } from "react";

export function ExtensionPayment({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const copyAccount = async () => { await navigator.clipboard.writeText("1234567890"); };
  if (submitted) return <><button className="modal-backdrop" onClick={onClose} aria-label="ปิด" /><section className="payment-sheet"><button className="close" onClick={onClose}>×</button><span className="sheet-icon">✓</span><p className="eyebrow">ส่งข้อมูลเรียบร้อย</p><h2>กำลังตรวจสอบสลิป</h2><p className="sheet-copy">ระบบจะตรวจสอบยอดโอนและบัญชีปลายทาง เมื่อผ่านแล้ว วันครบกำหนดไถ่ถอนจะขยายออกไป 30 วัน และจะแจ้งผลผ่าน LINE</p><button className="primary" onClick={onClose}>กลับสู่สัญญาของฉัน</button></section></>;
  return <><button className="modal-backdrop" onClick={onClose} aria-label="ปิด" /><section className="payment-sheet payment-flow"><button className="close" onClick={onClose}>×</button><p className="eyebrow">ต่ออายุสัญญาขายฝาก · CG-2025-0418</p><h2>ชำระค่าขยายเวลาไถ่ถอน</h2><div className="amount">562.50 <small>บาท</small></div><div className="bank-details"><span>บัญชีรับโอน</span><b>ธนาคารกสิกรไทย</b><strong>xxx-x-12345-x</strong><small>ชื่อบัญชี ร้านทองทองดี</small><button onClick={copyAccount}>คัดลอกเลขบัญชี</button></div><input ref={input} type="file" accept="image/*" hidden onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><button className={`slip-upload ${file ? "attached" : ""}`} onClick={() => input.current?.click()}><span>{file ? "✓" : "↑"}</span><div><b>{file ? file.name : "อัปโหลดสลิปโอนเงิน"}</b><small>{file ? "พร้อมส่งตรวจสอบ" : "รองรับไฟล์ภาพ JPG, PNG"}</small></div></button><button className="primary" disabled={!file} onClick={() => setSubmitted(true)}>ส่งสลิปเพื่อตรวจสอบ <span>→</span></button></section></>;
}
