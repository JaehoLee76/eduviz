#!/usr/bin/env python3
"""숨은 성질 검증 (scipy). 사용: node build_csv.mjs && python3 verify.py"""
import os, sys, json
import numpy as np, pandas as pd
from scipy import stats

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'csv')
rd = lambda n: pd.read_csv(os.path.join(D, n))
res = []
def chk(name, ok, detail):
    res.append((name, bool(ok), detail))

# S1 — 3σ 안인데 Welch 유의
s1 = rd('s1_pm_shift.csv'); b = s1[s1.phase == 'before'].steady_pressure_mean.values; a = s1[s1.phase == 'after'].steady_pressure_mean.values
lo, hi = b.mean() - 3 * b.std(ddof=1), b.mean() + 3 * b.std(ddof=1)
t = stats.ttest_ind(a, b, equal_var=False)
chk('S1 after 전부 before 평균±3σ 안', a.min() > lo and a.max() < hi, f'[{lo:.2f},{hi:.2f}] after [{a.min():.2f},{a.max():.2f}]')
chk('S1 Welch p<0.001', t.pvalue < 1e-3, f'p={t.pvalue:.2e} 이동={a.mean()-b.mean():.2f} (참 +2.40)')

# S2 — 평균 t 비유의, Levene(median) 유의
s2 = rd('s2_stick_replace.csv'); b = s2[s2.phase == 'before'].dx_metric_um.values; a = s2[s2.phase == 'after'].dx_metric_um.values
t = stats.ttest_ind(b, a, equal_var=False); lv = stats.levene(b, a, center='median')
chk('S2 평균 t 비유의(p>0.2)', t.pvalue > 0.2, f'p={t.pvalue:.3f} 평균 {b.mean():.2f}→{a.mean():.2f}')
chk('S2 Levene(median) p<0.01', lv.pvalue < 0.01, f'p={lv.pvalue:.2e} sd {b.std(ddof=1):.2f}→{a.std(ddof=1):.2f}')

# S3 — 독립 약함, 대응 강함, 세정 쌍 TOST 동등
s3 = rd('s3_repair_pair.csv'); eb, ea = s3.repair_err_before.values, s3.repair_err_after.values
ti = stats.ttest_ind(eb, ea, equal_var=False); tp = stats.ttest_rel(eb, ea)
chk('S3 독립 Welch p>0.05', ti.pvalue > 0.05, f'p={ti.pvalue:.3f}')
chk('S3 대응 t p<1e-4', tp.pvalue < 1e-4, f'p={tp.pvalue:.2e} 평균차={np.mean(eb-ea):.3f}µm')
c = rd('s3_clean_pair.csv'); d = c.clean_err_after.values - c.clean_err_before.values; delta = 0.3
se = d.std(ddof=1) / np.sqrt(len(d)); n = len(d)
p_lo = 1 - stats.t.cdf((d.mean() + delta) / se, n - 1); p_hi = stats.t.cdf((d.mean() - delta) / se, n - 1)
chk('S3 세정 쌍: 대응 t 비유의', stats.ttest_rel(c.clean_err_before, c.clean_err_after).pvalue > 0.05, f'p={stats.ttest_rel(c.clean_err_before, c.clean_err_after).pvalue:.3f}')
chk('S3 세정 쌍: TOST(δ=0.3) 동등', max(p_lo, p_hi) < 0.05, f'p_TOST={max(p_lo,p_hi):.2e} 평균차={d.mean():.3f}')

# S4 — 단순 전후 유의, 이중차분 ≈ 0
s4 = rd('s4_thermal_confound.csv'); g = lambda grp, ph: s4[(s4.group == grp) & (s4.phase == ph)].mx_ppm.values
tb = stats.ttest_ind(g('treated', 'before'), g('treated', 'after'), equal_var=False)
dT = g('treated', 'after').mean() - g('treated', 'before').mean(); dC = g('control', 'after').mean() - g('control', 'before').mean()
sed = np.sqrt(sum(np.var(g(x, p), ddof=1) / len(g(x, p)) for x in ('treated', 'control') for p in ('before', 'after')))
chk('S4 처리군 단순 전후 유의', tb.pvalue < 1e-6, f'p={tb.pvalue:.2e} 차={dT:.2f}ppm')
chk('S4 이중차분 효과≈0 (|DiD|<2·se)', abs(dT - dC) < 2 * sed, f'DiD={dT-dC:.3f} se={sed:.3f}')

# S5 — 순진한 t 유의, n_eff 보정 비유의
s5 = rd('s5_autocorr.csv'); b = s5[s5.phase == 'before'].vac_level.values; a = s5[s5.phase == 'after'].vac_level.values
tn = stats.ttest_ind(a, b); ph = np.mean([np.corrcoef(x[:-1], x[1:])[0, 1] for x in (b, a)])
neff = len(b) * (1 - ph) / (1 + ph); sp = np.sqrt((b.var(ddof=1) + a.var(ddof=1)) / 2)
tc = (a.mean() - b.mean()) / (sp * np.sqrt(2 / neff)); pc = 2 * stats.t.sf(abs(tc), 2 * neff - 2)
chk('S5 순진한 t p<0.05', tn.pvalue < 0.05, f'p={tn.pvalue:.3f} φ̂={ph:.2f}')
chk('S5 n_eff 보정 p>0.1', pc > 0.1, f'n_eff={neff:.1f} p={pc:.3f}')

# S6 — 590개 특징에 3σ: 유리 단위 헛알람이 대부분, 본페로니 뒤 거의 0, 놓침은 늘어남
s6 = rd('s6_false_alarm.csv'); fc = [c for c in s6.columns if c not in ('glass_id', 'group')]
R = s6[s6.group == 'ref'][fc].to_numpy(); Nn = s6[s6.group == 'normal'][fc].to_numpy(); A = s6[s6.group == 'anomaly'][fc].to_numpy()
zN = np.abs((Nn - R.mean(0)) / R.std(0, ddof=1)); zA = np.abs((A - R.mean(0)) / R.std(0, ddof=1))
m6 = len(fc); a6 = 2 * stats.norm.sf(3); fw_ind = 1 - (1 - a6) ** m6
kB = stats.norm.isf(0.0027 / m6 / 2); kS = stats.norm.isf((1 - (1 - 0.0027) ** (1 / m6)) / 2)
fw3 = (zN.max(1) > 3).mean(); fwB = (zN.max(1) > kB).mean()
tr6 = json.load(open(os.path.join(D, 'truth.json')))['S6']
col = [o['col'] for o in tr6['truth']['anomalies']]
c3 = int(sum(zA[i, col[i]] > 3 for i in range(len(col)))); cB = int(sum(zA[i, col[i]] > kB for i in range(len(col))))
chk('S6 3σ 유리 단위 실측 FWER > 0.5', fw3 > 0.5, f'{fw3:.3f} (특징 {m6}개)')
chk('S6 실측 FWER < 독립 가정 공식', fw3 < fw_ind, f'실측 {fw3:.3f} < 공식 {fw_ind:.3f}')
chk('S6 본페로니 후 실측 FWER < 0.02', fwB < 0.02, f'k={kB:.3f} 시닥 k={kS:.3f} FWER={fwB:.3f}')
chk('S6 3σ 이상 포획 ≥ 보정 후 포획', c3 >= cB and c3 > cB - 1, f'3σ {c3}/10 → 보정 {cB}/10')
chk('S6 JS check 와 scipy 일치', abs(tr6['check']['fwer_3sigma'] - fw3) < 1e-9 and tr6['check']['caught_3sigma'] == c3 and tr6['check']['caught_bonf'] == cB, f"JS FWER {tr6['check']['fwer_3sigma']:.3f} 포획 {tr6['check']['caught_3sigma']}/{tr6['check']['caught_bonf']}")

# Loss — 11개 사유 모두 등장, 연쇄(root≠reason) 존재
ev = rd('loss_events.csv'); codes = ['EQ-BD','EQ-PM','Q-MASK','Q-EVAP','LG-TRANS','LG-STK','LG-CST','LG-JC','CL-CAPA','JC-EARLY','RUN-TRIPLE']
miss = [x for x in codes if x not in set(ev.reason)]
chk('Loss 11개 사유 모두 등장', not miss, f'누락={miss} 행={len(ev)}')
chk('Loss root≠reason 연쇄 행 존재', (ev.root_cause != ev.reason).sum() > 50, f'{(ev.root_cause != ev.reason).sum()}건')
hr = rd('loss_hourly.csv'); chk('Loss 시간표 1440행(60일)', len(hr) == 1440, f'{len(hr)}행 stocker_fill max={hr.stocker_fill.max()}')

# FDC — PM 후 CH2 압력 +0.8%
f = rd('fdc_features.csv'); m = f[f.chamber == 'CH2'].groupby('pm_flag').p_steady_mean.mean()
chk('FDC CH2 PM 후 압력 ≈ +0.8%', 1 in m.index and abs((m[1] - m[0]) / 300 * 100 - 0.8) < 0.3, f'{(m[1]-m[0])/300*100:.2f}%' if 1 in m.index else 'PM 후 없음')

# JS 와 일치(재현성): truth.json 과 비교
tr = json.load(open(os.path.join(D, 'truth.json')))
chk('JS check 와 scipy 일치(S1 p)', abs(np.log10(tr['S1']['check']['welch']['p']) - np.log10(stats.ttest_ind(rd('s1_pm_shift.csv').query("phase=='after'").steady_pressure_mean, rd('s1_pm_shift.csv').query("phase=='before'").steady_pressure_mean, equal_var=False).pvalue)) < 0.05, 'log10 p 차 < 0.05')

w = max(len(r[0]) for r in res)
for n, ok, d in res: print(('OK  ' if ok else 'FAIL'), n.ljust(w), ' ', d)
print(f'\n{sum(r[1] for r in res)}/{len(res)} 통과')
sys.exit(0 if all(r[1] for r in res) else 1)
