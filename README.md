# Postpay Document Quality Web Dashboard

## เปิดดูบนเครื่อง
เปิดไฟล์ `index.html` ด้วย Chrome หรือ Edge ได้ทันที

## ขึ้น GitHub Pages
1. สร้าง GitHub repository เช่น `Postpay-Document-Dashboard`
2. Upload ไฟล์ทั้งหมดในโฟลเดอร์นี้ไปที่ root ของ repository
3. ไปที่ Settings > Pages
4. Source: Deploy from a branch
5. Branch: `main` / folder: `/ (root)` แล้ว Save
6. GitHub จะแสดง URL รูปแบบ `https://USERNAME.github.io/Postpay-Document-Dashboard/`

## ความปลอดภัย
ไฟล์เว็บนี้ตัด Customer Name, BAN, Subscriber ID, SIM/ESIM และข้อมูลส่วนบุคคลออกแล้ว แต่ยังมีข้อมูลผลการดำเนินงานระดับ Region/Shop ซึ่งอาจเป็นข้อมูลภายในบริษัท หากเป็นข้อมูลลับ แนะนำใช้ private/internal hosting แทน public GitHub Pages.

## อัปเดตข้อมูลในอนาคต
Dashboard ใช้ `data.js` เป็นฐานข้อมูลแบบ static หากมีไฟล์ DPS รอบใหม่ ต้อง regenerate `data.js` จาก source ใหม่แล้ว replace ไฟล์เดิมบน hosting.
