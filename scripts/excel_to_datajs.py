import argparse, json, os, re
import pandas as pd

REQUIRED=['Order Type','Parent Code/SIM Owner Name','Sales Name','Channel','ผลการตรวจสอบ','เหตุผลการตรวจสอบ','เหตุผลการตรวจสอบ อื่นๆ','Region','Month','RR']

def clean(v):
    return '' if pd.isna(v) else str(v).strip()

def root_category(main_reason, other_reason, status):
    r=clean(main_reason); o=clean(other_reason)
    if r:
        r=re.sub(r'^-?\s*ผลตรวจจากการ Upload Verification Result\s*','',r).strip(' -')
        return r or 'ไม่ระบุ'
    if o: return 'อื่นๆ'
    if clean(status)=='สมบูรณ์': return ''
    return 'ไม่ระบุ'

def detail_reason(main_reason, other_reason):
    o=clean(other_reason)
    if o: return o
    r=clean(main_reason)
    return re.sub(r'^-?\s*ผลตรวจจากการ Upload Verification Result\s*','',r).strip(' -') if r else ''

def convert(src,out):
    ext=os.path.splitext(src)[1].lower()
    engine='pyxlsb' if ext=='.xlsb' else 'openpyxl'
    df=pd.read_excel(src,sheet_name='Detail',engine=engine)
    missing=[c for c in REQUIRED if c not in df.columns]
    if missing: raise ValueError('Missing required columns: '+', '.join(missing))
    records=[]
    for row in df.itertuples(index=False,name=None):
        d=dict(zip(df.columns,row))
        records.append({'m':clean(d['Month']),'rr':clean(d['RR']),'ar':clean(d['Region']),'ch':clean(d['Channel']),'ot':clean(d['Order Type']),'sh':clean(d['Parent Code/SIM Owner Name']),'emp':clean(d['Sales Name']),'st':clean(d['ผลการตรวจสอบ']),'cat':root_category(d['เหตุผลการตรวจสอบ'],d['เหตุผลการตรวจสอบ อื่นๆ'],d['ผลการตรวจสอบ']),'reason':detail_reason(d['เหตุผลการตรวจสอบ'],d['เหตุผลการตรวจสอบ อื่นๆ'])})
    if not records: raise ValueError('Detail sheet has no rows')
    for k in ['m','rr','ar','st']:
        if not any(r[k] for r in records): raise ValueError(f'{k} is empty for all rows')
    with open(out,'w',encoding='utf-8') as f:
        f.write('window.POSTPAY_DATA = '); json.dump(records,f,ensure_ascii=False,separators=(',',':')); f.write(';\n')
    report={'source':os.path.basename(src),'output':os.path.basename(out),'rows':len(records),'status':pd.Series([r['st'] for r in records]).value_counts().to_dict(),'month':pd.Series([r['m'] for r in records]).value_counts().to_dict(),'rr':pd.Series([r['rr'] for r in records]).value_counts().to_dict(),'area_count':int(pd.Series([r['ar'] for r in records]).nunique()),'channel_count':int(pd.Series([r['ch'] for r in records]).nunique()),'order_type_count':int(pd.Series([r['ot'] for r in records]).nunique()),'employee_blank':sum(not r['emp'] for r in records),'shop_blank':sum(not r['sh'] for r in records),'root_category_counts':pd.Series([r['cat'] for r in records]).value_counts().head(20).to_dict(),'output_bytes':os.path.getsize(out)}
    rp=os.path.splitext(out)[0]+'_validation.json'
    with open(rp,'w',encoding='utf-8') as f: json.dump(report,f,ensure_ascii=False,indent=2)
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('source'); ap.add_argument('output'); a=ap.parse_args(); convert(a.source,a.output)
