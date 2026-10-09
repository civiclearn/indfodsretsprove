#!/usr/bin/env python3
"""Pre-flight check for generalprove/event.json. Run: python check_event.py [path]. Exit code 1 on any problem."""
import json, sys, datetime, collections
path = sys.argv[1] if len(sys.argv) > 1 else 'event.json'
ev = json.load(open(path, encoding='utf-8'))
errs = []
def need(cond, msg):
    if not cond: errs.append(msg)
qs = ev.get('questions', [])
need(len(qs) == 45, f'expected 45 questions, got {len(qs)}')
need([q.get('n') for q in qs] == list(range(1, 46)), 'question numbers must be 1..45 in order')
secs = collections.Counter(q.get('section') for q in qs)
need(secs == {'laere': 35, 'aktuel': 5, 'vaerdi': 5}, f'section split must be 35/5/5, got {dict(secs)}')
for q in qs:
    n = q.get('n')
    opts = q.get('options', [])
    need(isinstance(q.get('text'), str) and q['text'].strip(), f'Q{n}: empty text')
    need(2 <= len(opts) <= 4, f'Q{n}: {len(opts)} options')
    need(all(isinstance(o, str) and o.strip() for o in opts), f'Q{n}: empty option')
    need(len(set(o.strip().lower() for o in opts)) == len(opts), f'Q{n}: duplicate options')
    need(isinstance(q.get('correct'), int) and 0 <= q['correct'] < len(opts), f'Q{n}: correct index out of range')
    need('*' not in q['text'], f'Q{n}: stray markdown asterisk')
texts = [q['text'].strip().lower() for q in qs]
need(len(set(texts)) == 45, 'duplicate question texts')
try:
    start = datetime.datetime.fromisoformat(ev['exam_start_at'])
    need(start.utcoffset() is not None, 'exam_start_at must include a timezone offset')
    need(start > datetime.datetime.now(datetime.timezone.utc), f'exam_start_at {start} is in the past')
    cph = start.astimezone(datetime.timezone(datetime.timedelta(hours=1)))
    print(f'start: {start.isoformat()}  (CET {cph.strftime("%H:%M")}; +1 = CET after 25 Oct, +2 = CEST)')
except Exception as e:
    errs.append(f'bad exam_start_at: {e}')
need(ev.get('duration_minutes', 45) == 45, 'duration should be 45')
need(0 < ev.get('late_start_minutes', 30) <= 60, 'late_start_minutes odd')
need(ev.get('pass_rule') == {'total': 36, 'vaerdi': 4}, 'pass_rule should be {total:36, vaerdi:4}')
need(isinstance(ev.get('slug'), str) and ev['slug'], 'slug missing')
official = sum(1 for q in qs if q.get('official'))
print(f'slug: {ev.get("slug")} | questions: {len(qs)} | official past-exam questions: {official} ({official*100//45}%)')
if errs:
    print('PROBLEMS:'); [print(' -', e) for e in errs]; sys.exit(1)
print('OK — event.json is valid')
