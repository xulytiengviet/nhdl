#!/usr/bin/env python3
"""Rebuild public reading views and translation links from the Vietnamese sources.
No translation API or generated multilingual text is claimed: Google translates on demand.
"""
from pathlib import Path
import re,json,hashlib,html
from urllib.parse import urlencode,urljoin
root=Path(__file__).resolve().parents[1];site=root/'site'
base='https://xulytiengviet.github.io/nhdl/nhdl/site/'
langs=json.loads((site/'i18n/languages.json').read_text())
pages=['index.html','studio.html','challenges.html']
start='<!-- NHDL-LANGUAGES:START -->';end='<!-- NHDL-LANGUAGES:END -->'
esc=lambda s:html.escape(str(s),quote=True)
def toolbar(page,revision):
 links=[]
 for l in langs:
  u=base+page if l['code']=='vi' else 'https://translate.google.com/translate?'+urlencode({'sl':'vi','tl':l['code'],'u':base+'read/'+page+'?v='+revision[:12]})
  current=' aria-current="page"' if l['code']=='vi' else ''
  links.append(f'<a href="{esc(u)}" lang="{l["code"]}" title="{esc(l["name"])}"{current}><span aria-hidden="true">{l["flag"]}</span><span dir="auto">{esc(l["native"])}</span></a>')
 return start+'<aside class="language-bar notranslate" translate="no" aria-label="Ngôn ngữ"><details open><summary>🌐 Tiếng Việt → 16 ngôn ngữ · Team Bila / Long Ngo</summary><nav class="language-links" aria-label="Chọn bản dịch">'+''.join(links)+'</nav><p>Chọn cờ để đọc bản dịch máy qua Google Translate. Bản gốc tiếng Việt là nguồn đối chiếu; mã và định danh kỹ thuật giữ nguyên. Bản đọc công khai được dựng lại từ nguồn mỗi lần build; Studio tương tác dùng ở bản gốc. Ấn Độ: Hindi · Campuchia: Khmer. Cờ là biểu tượng nhận diện ngôn ngữ.</p></details></aside>'+end
sources={}
for page in pages:
 p=site/page;s=p.read_text();s=re.sub(re.escape(start)+'.*?'+re.escape(end),'',s,flags=re.S)
 if 'href="i18n/languages.css"' not in s:s=s.replace('</head>','<link rel="stylesheet" href="i18n/languages.css"></head>')
 s=re.sub(r'<(pre|code|textarea)(?![^>]*translate=)([^>]*)>',r'<\1 translate="no" class="notranslate"\2>',s)
 # Mark output artifacts as non-translatable, including runtime source maps and RTL.
 s=s.replace('<pre id="compiled">','<pre id="compiled" translate="no" class="notranslate">')
 sources[page]=s

data=json.loads((site/'challenges.json').read_text());hashes={p:hashlib.sha256(s.encode()).hexdigest() for p,s in sources.items()}
hashes['challenges.json']=hashlib.sha256((site/'challenges.json').read_bytes()).hexdigest()
hashes['languages.json']=hashlib.sha256((site/'i18n/languages.json').read_bytes()).hexdigest()
hashes['build_languages.py']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
revision=hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest()
(site/'read').mkdir(exist_ok=True)
for page,s in sources.items():
 (site/page).write_text(s.replace('</header>','</header>'+toolbar(page,revision),1))
 content=re.search(r'<main>(.*?)</main>',s,re.S).group(1)
 if page=='challenges.html':
  counts={k:sum(x['status']==k for x in data['items']) for k in ['unresolved','in_progress','resolved']}
  content=f'<h1>{len(data["items"])} bài toán kỹ thuật NHDL</h1><p>Team Bila · Long Ngo. Danh mục nghiên cứu; hiện {counts["unresolved"]} chưa giải quyết, {counts["in_progress"]} đang và {counts["resolved"]} đã giải quyết. Một demo PASS chưa đủ đóng bài toán. Các hướng mở rộng chỉ cần khi chọn phạm vi tương ứng.</p>'
  for p in data['items']:
   content+=f'<article id="{esc(p["id"])}"><p>{esc(data["groups"][p["group"]])} · {"Luồng nền tảng" if p["scope"]=="core" else "Mở rộng có điều kiện"}</p><h2><span translate="no">{esc(p["id"])}</span> · {esc(p["title"])}</h2><p>Trạng thái: {esc({"unresolved":"Chưa giải quyết","in_progress":"Đang giải quyết","resolved":"Đã giải quyết"}[p["status"]])}</p><h3>Bản chất kỹ thuật</h3><p>{esc(p["desc"])}</p><h3>Vì sao là nút thắt?</h3><p>{esc(p["bottleneck"])}</p></article>'
 else:
  content=re.sub(r'<script\b.*?</script>','',content,flags=re.S)
  content=re.sub(r'<textarea([^>]*)>(.*?)</textarea>',r'<pre translate="no" class="notranslate">\2</pre>',content,flags=re.S)
  content=re.sub(r'<select\b.*?</select>|<button\b.*?</button>|<input\b[^>]*>','',content,flags=re.S)
 content=re.sub(r'(href|src)="([^"]*)"',lambda m:f'{m[1]}="{esc(urljoin(base+page,html.unescape(m[2])))}"',content)
 out='<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NHDL · Team Bila / Long Ngo · Bản đọc công khai</title><link rel="stylesheet" href="../style.css"><link rel="stylesheet" href="../i18n/languages.css"></head><body class="reading"><header><a href="'+base+page+'">NHDL · Bản gốc tiếng Việt / mở tương tác</a></header>'+toolbar(page,revision)+'<main><p class="source-revision">Bản đọc công khai · nguồn <span translate="no">'+revision[:12]+'</span>. Dịch máy theo yêu cầu, chưa thẩm định chuyên môn. Nếu dịch vụ không khả dụng, mở bản gốc và dùng chức năng dịch của trình duyệt.</p>'+content+'</main></body></html>'
 (site/'read'/page).write_text(out)
manifest={'schema':'nhdl-language-build/1.0.0','sourceLanguage':'vi','mode':'external-machine-translation-on-demand','provider':'Google Translate','languages':[l['code'] for l in langs],'sourceRevision':revision,'sourceHashes':hashes,'pages':pages,'humanReviewed':False}
(site/'i18n/build.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Built 3 Vietnamese reading views, 16 translation links per page, revision '+revision[:12])
