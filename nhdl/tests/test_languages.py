import unittest,json
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,parse_qs
site=Path(__file__).resolve().parents[1]/'site'
class Page(HTMLParser):
 def __init__(self,s):super().__init__();self.links=[];self.articles=[];self.codes=[];self.scripts=0;self.feed(s)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='a':self.links.append(a)
  if tag=='article':self.articles.append(a.get('id'))
  if tag in ['pre','code','textarea']:self.codes.append(a)
  if tag=='script':self.scripts+=1
class Languages(unittest.TestCase):
 def test_targets_and_source(self):
  d=json.loads((site/'i18n/languages.json').read_text());self.assertEqual(len(d),17);self.assertEqual(len({x['code'] for x in d}),17)
  for name in ['index.html','studio.html','challenges.html']:
   page=Page((site/name).read_text());links=[x for x in page.links if x.get('href','').startswith('https://translate.google.com/translate?')];self.assertEqual(len(links),16)
   for a in links:
    q=parse_qs(urlparse(a['href']).query);self.assertEqual(q['sl'],['vi']);self.assertEqual(q['u'],['https://xulytiengviet.github.io/nhdl/nhdl/site/read/'+name+'?v='+json.loads((site/'i18n/build.json').read_text())['sourceRevision'][:12]]);self.assertNotEqual(q['tl'],['vi'])
   self.assertTrue(all(x.get('translate')=='no' for x in page.codes))
 def test_complete_static_reader(self):
  page=Page((site/'read/challenges.html').read_text());d=json.loads((site/'challenges.json').read_text());self.assertEqual(page.articles,[x['id'] for x in d['items']]);self.assertEqual(page.scripts,0)
 def test_build_manifest(self):
  d=json.loads((site/'i18n/build.json').read_text());self.assertFalse(d['humanReviewed']);self.assertEqual(d['sourceLanguage'],'vi');self.assertEqual(d['mode'],'external-machine-translation-on-demand');self.assertEqual(len(d['sourceRevision']),64)
if __name__=='__main__':unittest.main()
