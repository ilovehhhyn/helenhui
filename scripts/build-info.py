#!/usr/bin/env python3
"""Regenerate the static profile page and agent summary after editing info/profile.json."""
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'info/profile.json').read_text())
person = data['person']
base = person['url']
def link(item):
    return f'<a href="{escape(item["url"], quote=True)}">{escape(item["name"])}</a>'
def listing(items):
    return '<ul>' + ''.join('<li>' + link(item) + '</li>' for item in items) + '</ul>'
structured = {'@context':'https://schema.org', '@type':'ProfilePage', '@id':data['url'], 'url':data['url'], 'mainEntity':{key:value for key,value in person.items() if key != '@context'}}
sections = ''.join(f'<section><h2>{heading}</h2>{listing(data[key])}</section>' for heading,key in [('Projects & art','projects'),('Research & technical writing','research_and_writing'),('Essays','essays')])
research = '<ul>' + ''.join(f'<li><strong>{escape(item["topic"])}</strong> — {escape(item["lab"])}' + (f', under {escape(item["advisor"])}' if 'advisor' in item else '') + '</li>' for item in data['research']) + '</ul>'
profiles = listing([{'name':name,'url':url} for name,url in zip(['GitHub','LinkedIn','X'],person['sameAs'])])
raw = json.dumps(data,indent=2,ensure_ascii=False)
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Helen Hui — Princeton · Profile & API</title>
<meta name="description" content="{escape(person['description'], quote=True)}">
<link rel="canonical" href="{data['url']}">
<link rel="alternate" type="application/json" href="{data['api_url']}" title="Helen Hui profile JSON">
<link rel="alternate" type="text/plain" href="{base}llms.txt" title="Website guide for agents">
<script type="application/ld+json">{json.dumps(structured,ensure_ascii=False).replace('<', chr(92)+'u003c')}</script>
<style>
:root {{ color-scheme: light; font-family: Arial, sans-serif; color: #161616; background: #fff; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; }}
main {{ max-width: 850px; margin: auto; padding: 36px 24px 70px; }}
nav {{ display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 64px; }}
a {{ color: inherit; text-underline-offset: 4px; }}
a:hover {{ color: #b52b20; }}
a:focus-visible {{ outline: 3px solid #b52b20; outline-offset: 5px; }}
.kicker {{ color: #a52b22; font-size: .8rem; letter-spacing: .1em; text-transform: uppercase; }}
h1 {{ font-size: clamp(2.8rem, 9vw, 4.6rem); letter-spacing: -.055em; margin: 12px 0; }}
h2 {{ font-size: 1.35rem; margin-top: 0; }}
p, li {{ line-height: 1.7; }}
.intro {{ font-size: 1.2rem; max-width: 680px; }}
section {{ border-top: 1px solid #dedede; padding-top: 25px; margin-top: 36px; }}
ul {{ padding-left: 22px; }}
li {{ margin: 8px 0; overflow-wrap: anywhere; }}
pre {{ background: #f5f5f3; padding: 20px; overflow-x: auto; border-radius: 8px; line-height: 1.55; }}
code {{ font-size: .9rem; overflow-wrap: anywhere; }}
.note {{ color: #555; font-size: .9rem; }}
summary {{ cursor: pointer; padding: 12px 0; }}
</style>
</head>
<body><main>
<nav aria-label="Profile navigation"><a href="{base}">← home</a><a href="{data['api_url']}">raw JSON ↗</a><a href="{base}llms.txt">agent guide ↗</a></nav>
<header><p class="kicker">Princeton · computer science · class of 2028</p><h1>Helen Hui</h1><p class="intro">{escape(person['description'])}</p></header>
<section><h2>Research</h2>{research}<p>Interests: {escape(', '.join(person['knowsAbout']))}.</p></section>
{sections}
<section><h2>Find Helen</h2>{profiles}</section>
<section><h2>Profile API</h2><p>This public, read-only endpoint returns the profile, education, research, projects, essays, and official profile links as JSON. No API key is required.</p>
<p><code>GET {data['api_url']}</code></p>
<pre><code>curl -fsSL '{data['api_url']}'</code></pre>
<p>Schema version: {escape(data['schema_version'])}. Updated: <time datetime="{data['updated_at']}">{data['updated_at']}</time>.</p>
<details><summary>View the complete JSON response</summary><pre><code>{escape(raw)}</code></pre></details>
<p class="note">Source: <a href="{base}">Helen’s personal website</a>. Research descriptions reflect the homepage at the time of this update.</p></section>
</main></body></html>
'''
(ROOT / 'info/index.html').write_text(page)
summary = f'# Helen Hui\n\n> {person["description"]}\n\nSelf-described public information. Updated {data["updated_at"]}.\n\n## Profile\n\n- [Homepage]({base})\n- [Profile and API documentation]({data["url"]})\n- [Structured JSON profile]({data["api_url"]}): GET, no authentication, schema version {data["schema_version"]}.\n\n## Research\n\n'
summary += '\n'.join('- '+item['topic']+' — '+item['lab']+(', under '+item['advisor'] if 'advisor' in item else '') for item in data['research'])+'\n'
for heading,key in [('Projects and art','projects'),('Research and technical writing','research_and_writing'),('Essays','essays')]:
    summary += '\n## '+heading+'\n\n'+'\n'.join(f'- [{item["name"]}]({item["url"]})' for item in data[key])+'\n'
summary += '\n## Official profiles\n\n'+'\n'.join(f'- {url}' for url in person['sameAs'])+'\n'
(ROOT / 'llms.txt').write_text(summary)
