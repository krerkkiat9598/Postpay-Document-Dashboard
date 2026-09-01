# W&W Postpay Document Quality Executive Dashboard V6

Source: `DPS_01July - 17Aug2026 sent 26.08.26(1).xlsb`

## V6 enhancements
- Executive Text Highlight บนทุกหน้า และเปลี่ยนตาม Filter
- Quality Trend แสดง July → August แม้เลือก Month เดียว โดย Highlight เดือนที่เลือก
- Employee Ranking แยก `ไม่ระบุพนักงาน` ออกจาก Ranking และแสดง Data Quality Alert
- Employee Highlight: Top Incomplete Employee + Case + Rate
- Root Cause Highlight: Main Root Cause + Top Detailed Reason + Where to Focus
- Detailed Reason คลิกเพื่อ Drill-down Region → Area → Shop
- ทุก Ranking สำคัญแสดงทั้ง Case และ %

## Deployment
อัปโหลดไฟล์ทั้ง 5 ไฟล์ไปทับใน GitHub repository เดิม แล้ว Commit:
- `index.html`
- `style.css`
- `app.js`
- `data.js`
- `README.md`

GitHub Pages URL เดิมจะอัปเดตอัตโนมัติหลัง Deploy

> หมายเหตุ: data.js มีชื่อพนักงานจริง จึงควรใช้งานภายใต้นโยบายข้อมูลของบริษัท และไม่ควรเผยแพร่ Public หากไม่ได้รับอนุญาต
