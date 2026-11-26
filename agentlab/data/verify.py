#!/usr/bin/env python3
"""숨은 성질 검증 (scipy). 사용: node build_csv.mjs && python3 verify.py  (S11 은 labs/0303-thermal-turn.html, S12 는 labs/0304-correct-or-repair.html, S13 은 labs/0305-virtual-metrology.html, S14 는 labs/0306-mask-life.html 의 Python 블록도 읽는다)"""
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

# S7 — 3σ 의 숨은 가정 셋: 치우침·자기상관·오염된 기준. 값은 node 로 내보낸 같은 데이터를 scipy 로 다시 계산해 대조
import subprocess, shutil
_mf = os.path.join(os.path.dirname(D), 'mfgsim.js')
_node = shutil.which('node')
_js = subprocess.run([_node, '-e', "const M=require(%s);const S=M.scenario('S7');console.log(JSON.stringify(S))" % json.dumps(_mf)],
                     capture_output=True, text=True, check=True).stdout
S7 = json.loads(_js); A7, B7, C7 = S7['A'], S7['B'], S7['C']; NOM = stats.norm.sf(3); K = 3
def _bc_limit(x):
    lam = stats.boxcox(x)[1]; y = (x ** lam - 1) / lam if abs(lam) > 1e-9 else np.log(x)
    yl = y.mean() + K * y.std(ddof=1); t = lam * yl + 1
    return lam, (t ** (1 / lam) if t > 0 else np.inf)
def _ar_fit(x):
    m = x.mean(); d = x - m; phi = (d[1:] * d[:-1]).sum() / (d[:-1] ** 2).sum()
    r = d[1:] - phi * d[:-1]; return m, phi, r.std(ddof=1)
def _mad_sd(x): return 1.4826 * stats.median_abs_deviation(x, scale=1)
ra, pa = np.array(A7['ref']), np.array(A7['post'])
sA = S7['params']['s']; e = np.exp(sA ** 2); th = stats.norm.sf(np.log(np.exp(sA ** 2 / 2) + 3 * np.sqrt((e - 1) * e)) / sA)
lamA, limBC = _bc_limit(ra); limQ = np.quantile(ra, S7['params']['p_quant']); limN = ra.mean() + K * ra.std(ddof=1)
rA = {k: float((pa > v).mean()) for k, v in (('naive', limN), ('quantile', limQ), ('boxcox', limBC))}
chk('S7-A 이론 헛알람률(s=0.5, scipy) = 0.01538', abs(th - 0.01538) < 5e-5 and abs(A7['theory']['naive_rate'] - th) < 1e-9, f'scipy {th:.5f} JS {A7["theory"]["naive_rate"]:.5f}')
chk('S7-A JS 한계·헛알람률·λ̂ 가 scipy 와 일치', abs(A7['lam'] - lamA) < 2e-3 and all(abs(A7['rates'][k] - rA[k]) < 1e-9 for k in rA) and abs(A7['limits']['boxcox'] - limBC) / limBC < 2e-3,
    f'λ̂ JS {A7["lam"]:.4f} scipy {lamA:.4f} · 한계 Box-Cox JS {A7["limits"]["boxcox"]:.4f} scipy {limBC:.4f}')
rb, pb = np.array(B7['ref']), np.array(B7['post']); mB, phB, sdr = _ar_fit(rb)
rB = {'naive': float((pb > rb.mean() + K * rb.std(ddof=1)).mean())}
rr = (pb[1:] - mB) - phB * (pb[:-1] - mB); rB['resid'] = float((rr > K * sdr).mean())
neff = len(rb) * (1 - S7['params']['phi']) / (1 + S7['params']['phi'])
chk('S7-B 실효 표본 수(φ=0.9, n=50) = 2.63', abs(neff - 2.63) < 0.005 and abs(B7['n_eff']['true_phi'] - neff) < 1e-9, f'{neff:.3f}')
chk('S7-B JS φ̂·잔차 sd·헛알람률 이 scipy/numpy 와 일치', abs(B7['fit']['phi'] - phB) < 1e-9 and abs(B7['fit']['sdr'] - sdr) < 1e-9 and abs(B7['rates']['naive'] - rB['naive']) < 1e-9 and abs(B7['rates']['resid'] - rB['resid']) < 1e-9,
    f'φ̂ JS {B7["fit"]["phi"]:.4f} numpy {phB:.4f} · 잔차 sd {sdr:.4f}')
rc, pc, ac = np.array(C7['ref']), np.array(C7['post']), np.array(C7['anom']); clean = rc[~np.array(C7['bad'])]
limC = {'naive': rc.mean() + K * rc.std(ddof=1), 'robust': np.median(rc) + K * _mad_sd(rc), 'clean': clean.mean() + K * clean.std(ddof=1)}
missC = {k: int((ac <= v).sum()) for k, v in limC.items()}
fa = {k: int((pc > v).sum()) for k, v in limC.items()}
chk('S7-C JS 한계·놓침·헛알람 이 scipy 와 일치(MAD 상수 1.4826)', all(abs(C7['limits'][k] - limC[k]) < 1e-9 for k in limC) and all(C7['missed'][k] == missC[k] and C7['false_alarms'][k] == fa[k] for k in limC),
    f'로버스트 한계 JS {C7["limits"]["robust"]:.4f} scipy {limC["robust"]:.4f} · 헛알람 {fa}')
# S7 분포 검사 — 시드 1..200 의 중앙값·퍼짐(한 시드의 운이 아니라 전형적 행동을 확인)
_dist = json.loads(subprocess.run([_node, '-e', """const M=require(%s);const o=[];for(let sd=1;sd<=200;sd++){const S=M.scenario('S7',{seed:sd});o.push({An:S.A.rates.naive,Aq:S.A.rates.quantile,Ab:S.A.rates.boxcox,Bn:S.B.rates.naive,Br:S.B.rates.resid,Cn:S.C.missed.naive,Cr:S.C.missed.robust,Cc:S.C.missed.clean});}console.log(JSON.stringify(o))""" % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
_m = lambda k: float(np.median([d[k] for d in _dist]))
_q = lambda k, p: float(np.quantile([d[k] for d in _dist], p))
chk('S7 분포(시드 200) 중앙값 A 순진 > 5×명목', _m('An') > 5 * NOM, f'{_m("An")/NOM:.1f}배 (10~90%: {_q("An",.1)/NOM:.1f}~{_q("An",.9)/NOM:.1f})')
chk('S7 분포 중앙값 A Box-Cox < 3×명목', _m('Ab') < 3 * NOM, f'{_m("Ab")/NOM:.2f}배 · 분위수(N0=300) 중앙값 {_m("Aq")/NOM:.2f}배, 10~90% {_q("Aq",.1)/NOM:.1f}~{_q("Aq",.9)/NOM:.1f}')
chk('S7 분포 중앙값 B 순진 > 3×명목 · 잔차 < 3×명목', _m('Bn') > 3 * NOM and _m('Br') < 3 * NOM, f'순진 {_m("Bn")/NOM:.1f}배 · 잔차 {_m("Br")/NOM:.2f}배')
chk('S7 분포 B 순진의 퍼짐이 큼(p90−p10 > 20×명목)', _q('Bn', .9) - _q('Bn', .1) > 20 * NOM, f'10%={_q("Bn",.1)/NOM:.1f}배 · 90%={_q("Bn",.9)/NOM:.1f}배')
chk('S7 분포 중앙값 C 놓침: 오염 ≥ 깨끗 + 5', _m('Cn') >= _m('Cc') + 5, f'오염 {_m("Cn"):.0f} · 깨끗 {_m("Cc"):.0f} / 20')
chk('S7 분포 중앙값 C 놓침: 로버스트 ≤ 깨끗 + 2', _m('Cr') <= _m('Cc') + 2, f'로버스트 {_m("Cr"):.0f} / 20')

# S8 — 작은 지속 변화 감지(슈하트·EWMA·CUSUM)와 평균 런 길이. 마르코프 사슬·이분법·몬테카를로를 Python 으로 따로 구현해 JS 와 대조
_S8 = json.loads(subprocess.run([_node, '-e', "const M=require(%s);const S=M.scenario('S8',{keep_runs:false});console.log(JSON.stringify(S,(k,v)=>typeof v==='function'?undefined:v))" % json.dumps(_mf)],
                                capture_output=True, text=True, check=True).stdout)
P8, ARL8, MC8, TR8, R8 = _S8['params'], _S8['arl'], _S8['mc'], _S8['trace'], _S8['R']
T0 = 1 / (2 * stats.norm.sf(3))                      # 목표 ARL0 = 370.4
def py_arl_shewhart(delta, L=3.0): return 1 / (stats.norm.sf(L - delta) + stats.norm.sf(L + delta))
def py_arl_ewma(lam, L, delta, m=101):
    U = L * np.sqrt(lam / (2 - lam)); w = 2 * U / m; e = -U + w * np.arange(m + 1); c = (e[:-1] + e[1:]) / 2
    Z = (e[None, :] - (1 - lam) * c[:, None]) / lam - delta
    P = np.diff(stats.norm.cdf(Z), axis=1)
    return np.linalg.solve(np.eye(m) - P, np.ones(m))[m // 2]
def py_arl_cusum1(k, h, delta, m=100):
    w = 2 * h / (2 * m - 1); S = w * np.arange(m)
    lo = S - w / 2; lo[0] = -np.inf                  # 칸 0 = [0, w/2], 칸 j = (jw − w/2, jw + w/2]
    hi = S + w / 2
    nxt = (S[:, None])                                # 현재 칸의 대표값
    Fhi = stats.norm.cdf(hi[None, :] - nxt + k - delta); Flo = stats.norm.cdf(lo[None, :] - nxt + k - delta)
    P = Fhi - Flo
    return np.linalg.solve(np.eye(m) - P, np.ones(m))[0]
def py_arl_cusum(k, h, delta, m=100):
    a = py_arl_cusum1(k, h, delta, m)
    return a / 2 if abs(delta) < 1e-12 else 1 / (1 / a + 1 / py_arl_cusum1(k, h, -delta, m))
def py_bisect(fn, target, lo, hi, n=60):
    for _ in range(n):
        mid = (lo + hi) / 2
        if fn(mid) < target: lo = mid
        else: hi = mid
    return (lo + hi) / 2
_cal = {}
def py_L(lam): return _cal.setdefault(('e', lam), py_bisect(lambda L: py_arl_ewma(lam, L, 0), T0, 1.0, 5.0, 45))
def py_h(k): return _cal.setdefault(('c', k), py_bisect(lambda h: py_arl_cusum(k, h, 0), T0, 0.05, 60.0, 45))
LAM, KK = P8['lam'], P8['k']; Lp, hp = py_L(LAM), py_h(KK)
chk('S8 슈하트 ARL0=370.4 · ARL1(δ=1)=43.9 · ARL1(δ=0.5)=155.2 (scipy)', abs(py_arl_shewhart(0) - 370.4) < 0.05 and abs(py_arl_shewhart(1) - 43.9) < 0.05 and abs(py_arl_shewhart(0.5) - 155.2) < 0.05,
    f'{py_arl_shewhart(0):.2f} / {py_arl_shewhart(1):.2f} / {py_arl_shewhart(0.5):.2f}')
chk('S8 JS 의 L(λ=0.2)·h(k=0.5) = Python 독립 이분법과 1e-3 이내, 그 값에서 ARL0=370.4±1',
    abs(P8['L_ewma'] - Lp) < 1e-3 and abs(P8['h_cusum'] - hp) < 1e-3 and abs(py_arl_ewma(LAM, P8['L_ewma'], 0) - 370.4) < 1 and abs(py_arl_cusum(KK, P8['h_cusum'], 0) - 370.4) < 1,
    f'L JS {P8["L_ewma"]:.5f} Py {Lp:.5f} · h JS {P8["h_cusum"]:.5f} Py {hp:.5f}')
_D = ARL8['deltas']; _py = {'shew': [py_arl_shewhart(d, P8['L_shew']) for d in _D], 'ewma': [py_arl_ewma(LAM, Lp, d) for d in _D], 'cusum': [py_arl_cusum(KK, hp, d) for d in _D]}
_rel = max(abs(ARL8[m][i] / _py[m][i] - 1) for m in _py for i in range(len(_D)))
chk('S8 세 방식 × δ∈{0,0.5,1,2,3}: JS 식 값 = Python 식 값(상대 1e-6)', _rel < 1e-6, f'최대 상대오차 {_rel:.1e}')
def py_mc(method, delta, n, rg, L=3.0, lam=LAM, k=KK, cap=200000):
    ucl = Lp * np.sqrt(lam / (2 - lam)); t = np.zeros(n, int); w = np.zeros(n); sp = np.zeros(n); sm = np.zeros(n)
    act = np.arange(n); step = 0
    while act.size and step < cap:
        step += 1; z = rg.normal(size=act.size) - delta
        if method == 'shew': hit = np.abs(z) > L
        elif method == 'ewma':
            w[act] = lam * z + (1 - lam) * w[act]; hit = np.abs(w[act]) > ucl
        else:
            sp[act] = np.maximum(0, sp[act] + z - k); sm[act] = np.maximum(0, sm[act] - z - k); hit = (sp[act] > hp) | (sm[act] > hp)
        t[act[hit]] = step; act = act[~hit]
    t[act] = cap
    return t
_rg = np.random.default_rng(20261123); _zmax = 0; _zpy = 0; _bad = []
for m in ('shew', 'ewma', 'cusum'):
    for i, d in enumerate(_D):
        c = MC8[m][i]; z = (c['mean'] - _py[m][i]) / c['se']; _zmax = max(_zmax, abs(z))
        r = py_mc(m, d, 20000, _rg); zp = (r.mean() - _py[m][i]) / (r.std(ddof=1) / np.sqrt(len(r))); _zpy = max(_zpy, abs(zp))
        if abs(z) > 3 or abs(zp) > 3: _bad.append((m, d, round(z, 2), round(zp, 2)))
chk('S8 몬테카를로 평균이 식 값의 ±3 표준오차 안 (JS 2000런 · Python 20000런, 15칸)', not _bad, f'|z| 최대 JS {_zmax:.2f} · Python {_zpy:.2f}' + (f' 벗어남 {_bad}' if _bad else ''))
_i05, _i1, _i3 = _D.index(0.5), _D.index(1), _D.index(3)
chk('S8 δ=0.5·1 에서 EWMA·CUSUM ARL1 < 슈하트의 0.5배 (식 · JS 몬테카를로)',
    all(_py[m][i] < 0.5 * _py['shew'][i] and MC8[m][i]['mean'] < 0.5 * MC8['shew'][i]['mean'] for m in ('ewma', 'cusum') for i in (_i05, _i1)),
    f'δ=0.5: {_py["shew"][_i05]:.1f}→{_py["ewma"][_i05]:.1f}/{_py["cusum"][_i05]:.1f} · δ=1: {_py["shew"][_i1]:.1f}→{_py["ewma"][_i1]:.1f}/{_py["cusum"][_i1]:.1f}')
chk('S8 δ=3 에서 슈하트 ARL1 ≤ EWMA·CUSUM', _py['shew'][_i3] <= _py['ewma'][_i3] and _py['shew'][_i3] <= _py['cusum'][_i3], f'{_py["shew"][_i3]:.2f} ≤ {_py["ewma"][_i3]:.2f}/{_py["cusum"][_i3]:.2f}')
chk('S8 런 길이 분포: 오른쪽 꼬리(중앙값 < 평균 · 90% > 평균, δ=1 세 방식)', all(MC8[m][_i1]['med'] < MC8[m][_i1]['mean'] < MC8[m][_i1]['p90'] for m in ('shew', 'ewma', 'cusum')),
    ' · '.join(f'{m} 중앙값 {MC8[m][_i1]["med"]:.0f} 평균 {MC8[m][_i1]["mean"]:.1f} 90% {MC8[m][_i1]["p90"]:.0f}' for m in ('shew', 'ewma', 'cusum')))
# 갈래 R — 기준 200장에서 φ̂ 추정, 잔차 CUSUM 의 k·h 를 따로 계산, 몬테카를로를 Python 으로 다시
_rf = np.array(R8['ref']); _m = _rf.mean(); _d = _rf - _m; _phi = (_d[1:] * _d[:-1]).sum() / (_d[:-1] ** 2).sum(); _sdr = (_d[1:] - _phi * _d[:-1]).std(ddof=1)
_sdx = _rf.std(ddof=1); _kR = R8['delta'] * (1 - _phi) * _sdx / _sdr / 2; _hR = py_h(_kR); _hRaw = py_h(0.5); _kTh = R8['delta'] * np.sqrt((1 - P8['phi']) / (1 + P8['phi'])) / 2; _hTh = py_h(_kTh)
chk('S8-R JS φ̂·잔차 sd·k·h 가 Python 독립 계산과 일치', abs(R8['fit']['phi'] - _phi) < 1e-9 and abs(R8['fit']['sdr'] - _sdr) < 1e-9 and abs(R8['k_res'] - _kR) < 1e-9 and abs(R8['h_res'] - _hR) < 1e-3 and abs(R8['k_ideal'] - _kTh) < 1e-9 and abs(R8['h_ideal'] - _hTh) < 1e-3,
    f'φ̂ {_phi:.4f} 잔차 sd {_sdr:.4f} k {_kR:.4f} h JS {R8["h_res"]:.3f} Py {_hR:.3f} · 이상적 k {_kTh:.4f} h JS {R8["h_ideal"]:.3f} Py {_hTh:.3f}')
def py_mc_R(shifted, n, rg, cap=20000):
    phi, delta = P8['phi'], R8['delta']; inn = np.sqrt(1 - phi ** 2)
    xp = rg.normal(size=n); yp = xp.copy(); names = ['res3', 'rescusum'] + ([] if shifted else ['raw'])
    t = {nm: np.full(n, cap) for nm in names}; done = {nm: np.zeros(n, bool) for nm in names}
    sp = np.zeros(n); sm = np.zeros(n); rp = np.zeros(n); rm = np.zeros(n)
    for step in range(1, cap + 1):
        xt = phi * xp + inn * rg.normal(size=n); yt = xt - (delta if shifted else 0.0); rz = (yt - phi * yp) / inn
        h3 = (np.abs(rz) > 3) & ~done['res3']; t['res3'][h3] = step; done['res3'] |= h3
        sp = np.maximum(0, sp + rz - _kTh); sm = np.maximum(0, sm - rz - _kTh); hc2 = ((sp > _hTh) | (sm > _hTh)) & ~done['rescusum']; t['rescusum'][hc2] = step; done['rescusum'] |= hc2
        if not shifted:
            rp = np.maximum(0, rp + yt - 0.5); rm = np.maximum(0, rm - yt - 0.5); hr = ((rp > _hRaw) | (rm > _hRaw)) & ~done['raw']; t['raw'][hr] = step; done['raw'] |= hr
        xp, yp = xt, yt
        if all(d.all() for d in done.values()): break
    return t
_rg2 = np.random.default_rng(20261124); _ps = py_mc_R(True, 4000, _rg2); _pn = py_mc_R(False, 4000, _rg2)
_js = {('s', 'res3'): R8['mc']['shift']['res3'], ('s', 'rescusum'): R8['mc']['shift']['rescusum'], ('n', 'res3'): R8['mc']['null']['res3'], ('n', 'rescusum'): R8['mc']['null']['rescusum'], ('n', 'raw'): R8['mc']['null']['raw']}
_pyr = {('s', 'res3'): _ps['res3'], ('s', 'rescusum'): _ps['rescusum'], ('n', 'res3'): _pn['res3'], ('n', 'rescusum'): _pn['rescusum'], ('n', 'raw'): _pn['raw']}
_zr = max(abs(_js[key]['mean'] - _pyr[key].mean()) / np.hypot(_js[key]['se'], _pyr[key].std(ddof=1) / np.sqrt(len(_pyr[key]))) for key in _js)
chk('S8-R JS 몬테카를로(1000런)와 Python 몬테카를로(4000런)의 평균 차이가 4 표준오차 이내', _zr < 4, f'|z| 최대 {_zr:.2f}')
_j3, _jc, _jraw = _js[('s', 'res3')], _js[('s', 'rescusum')], _js[('n', 'raw')]['mean']
_p3, _pc, _praw = _pyr[('s', 'res3')], _pyr[('s', 'rescusum')], _pyr[('n', 'raw')].mean()
_q90 = lambda a: float(np.quantile(a, 0.9))
chk('S8-R 변화 뒤 런 길이: 잔차 CUSUM 이 중앙값은 더 짧고, 평균·90% 지점은 잔차 3σ 의 0.5배 미만 (JS · Python)',
    _jc['med'] < _j3['med'] and _jc['mean'] < 0.5 * _j3['mean'] and _jc['p90'] < 0.5 * _j3['p90'] and np.median(_pc) < np.median(_p3) and _pc.mean() < 0.5 * _p3.mean() and _q90(_pc) < 0.5 * _q90(_p3),
    f'JS 중앙값 {_jc["med"]:.0f} vs {_j3["med"]:.0f} · 평균 {_jc["mean"]:.0f} vs {_j3["mean"]:.0f} · 90% {_jc["p90"]:.0f} vs {_j3["p90"]:.0f} · Python 평균 {_pc.mean():.0f} vs {_p3.mean():.0f}')
_a3, _ac = _js[('n', 'res3')], _js[('n', 'rescusum')]
chk('S8-R 참 φ 로 만든 잔차 관리도(3σ·CUSUM)의 정상 때 ARL0 = 370.4 (JS ±3 표준오차 · Python 4000런 ±3 표준오차)',
    all(abs(c['mean'] - T0) < 3 * c['se'] for c in (_a3, _ac)) and all(abs(_pyr[key].mean() - T0) < 3 * _pyr[key].std(ddof=1) / np.sqrt(4000) for key in (('n', 'res3'), ('n', 'rescusum'))),
    f'JS 3σ {_a3["mean"]:.0f}±{_a3["se"]:.0f} · CUSUM {_ac["mean"]:.0f}±{_ac["se"]:.0f} · Python 3σ {_pyr[("n","res3")].mean():.0f} · CUSUM {_pyr[("n","rescusum")].mean():.0f}')
chk('S8-R 원값에 CUSUM 을 그대로 쓴 정상 때 ARL0 < 370.4/5 (JS · Python)', _jraw < T0 / 5 and _praw < T0 / 5, f'JS {_jraw:.1f} · Python {_praw:.1f} (약속 {T0:.1f})')
# 시드 분포 — trace 와 갈래 R 의 첫 알람 지연을 Python 으로 다시 계산해 JS 와 같은지, 기본 시드가 분포 25~75% 안인지
_seeds = json.loads(subprocess.run([_node, '-e', """const M=require(%s);const o=[];for(let sd=1;sd<=200;sd++){const S=M.scenario('S8',{seed:sd,only:'trace'});o.push({seed:sd,mon:S.trace.mon,rref:S.R.ref,rmon:S.R.mon,js:[S.trace.shew.delay,S.trace.ewma.delay,S.trace.cusum.delay,S.R.res3.delay,S.R.rescusum.delay],pre:[S.trace.shew.pre.length,S.trace.ewma.pre.length,S.trace.cusum.pre.length]});}console.log(JSON.stringify(o))""" % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
SA = P8['shift_at']; UCLp = Lp * np.sqrt(LAM / (2 - LAM))
# 변화 전 알람은 헛알람으로 세고 통계량을 처음 상태로 되돌린다. 반환: 변화 뒤 첫 알람의 지연(없으면 None)
def py_delays(z, kind, k=None, h=None, lam=None, ucl=None):
    n = len(z); w = 0.0; sp = 0.0; sm = 0.0
    for i in range(n):
        if kind == 'shew': hit = abs(z[i]) > 3
        elif kind == 'ewma':
            w = lam * z[i] + (1 - lam) * w; hit = abs(w) > ucl
        else:
            sp = max(0.0, sp + z[i] - k); sm = max(0.0, sm - z[i] - k); hit = sp > h or sm > h
        if hit:
            if i + 1 < SA: w = sp = sm = 0.0
            else: return i + 1 - SA + 1
    return None
_pyd = []
for e in _seeds:
    z = (np.array(e['mon']) - P8['mu0']) / P8['sd0']
    rf = np.array(e['rref']); mm = rf.mean(); dd = rf - mm; ph = (dd[1:] * dd[:-1]).sum() / (dd[:-1] ** 2).sum(); sr = (dd[1:] - ph * dd[:-1]).std(ddof=1)
    kr = R8['delta'] * (1 - ph) * rf.std(ddof=1) / sr / 2; hr = py_h(kr)
    prev = np.concatenate([[rf[-1]], np.array(e['rmon'])[:-1]]); rz = ((np.array(e['rmon']) - mm) - ph * (prev - mm)) / sr
    _pyd.append([py_delays(z, 'shew'), py_delays(z, 'ewma', lam=LAM, ucl=UCLp), py_delays(z, 'cusum', k=KK, h=hp), py_delays(rz, 'shew'), py_delays(rz, 'cusum', k=kr, h=hr)])
_same = all([(a if a is not None else -1) for a in _pyd[i]] == [(a if a is not None else -1) for a in e['js']] for i, e in enumerate(_seeds))
chk('S8 시드 1~200 의 첫 알람 지연(트레이스 셋 · 갈래 R 둘)을 Python 으로 다시 계산한 값 = JS 값', _same, '200개 시드 × 5개 지연 전부 일치' if _same else '불일치 있음')
_arr = np.array([[np.inf if a is None else a for a in row] for row in _pyd]); _def = _S8['params']['seed']; _row = _arr[_def - 1]
_rk = [((_arr[:, c] < _row[c]).sum() + 0.5 * (_arr[:, c] == _row[c]).sum()) / len(_arr) for c in range(5)]
_names = ['슈하트', 'EWMA', 'CUSUM', '잔차 3σ', '잔차 CUSUM']
chk('S8 대표 시드: 기본 시드의 첫 알람 지연 다섯이 시드 1~200 각 분포의 25~75% 안', all(0.25 <= r <= 0.75 for r in _rk),
    f'시드 {_def}: ' + ' · '.join(f'{n} {_row[c]:.0f}장({_rk[c]*100:.0f}%)' for c, n in enumerate(_names)))
_med = np.median(_arr, axis=0)
chk('S8 분포(시드 200) 중앙값: 슈하트 > 2×EWMA · 2×CUSUM, 잔차 CUSUM < 0.5×잔차 3σ', _med[0] > 2 * _med[1] and _med[0] > 2 * _med[2] and _med[4] < 0.5 * _med[3],
    f'중앙값 슈하트 {_med[0]:.0f} · EWMA {_med[1]:.0f} · CUSUM {_med[2]:.0f} · 잔차 3σ {_med[3]:.0f} · 잔차 CUSUM {_med[4]:.0f}')

# S9 — 가성 인터락을 줄이는 spec: 적응형 한계·비용 최적화·시간순 분할. 같은 원자료를 node 로 받아 정책·집계를 numpy 로 따로 구현해 정확히 일치시킨다
_S9_CFGS = [('기본', {}), ('역추적 없음', {'miss_traced': False}), ('라벨 오류 20%(양쪽)', {'label_err': 0.2}), ('가성→진성만 30%', {'label_err': 0.3, 'label_dir': 'fa2true'}),
            ('진성→가성만 30%', {'label_err': 0.3, 'label_dir': 'true2fa'}), ('가드 끔', {'guard': False}), ('안정화 30장', {'n_burn': 30}), ('Δmax 1.5', {'dmax': 1.5})]
_S9_EXPORT = """const M=require(%s);const seeds=%s,cfgs=%s;const out=[];
for(const sd of seeds){const S=M.scenario('S9',{seed:sd});const D=S.D;const o={seed:sd,x:Array.from(D.x),pm:D.pm,events:D.events,U:Array.from(D.U),UE:D.UE,memA:Array.from(D.memA),nHist:D.nHist,N:D.N,base:D.base,cfgs:[]};
 for(const c of cfgs){const A=S.analyze(c[1]);const cv=(t)=>({fa:t.fa,miss:t.miss});o.cfgs.push({name:c[0],opt:c[1],P0:A.P0,P1:A.P1.pick,P2:A.P2.pick,params:A.params,curves:{P1_true:cv(A.curves.P1_true),P2_true:cv(A.curves.P2_true),P1_rec:cv(A.curves.P1_rec),P2_rec:cv(A.curves.P2_rec)}});}
 out.push(o);}console.log(JSON.stringify(out))"""
_tau9 = json.loads(subprocess.run([_node, '-e', "console.log(JSON.stringify(require(%s).scenario('S9',{seed:1}).params.tau))" % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
_s9def = json.loads(subprocess.run([_node, '-e', "console.log(require(%s).SEEDS.S9)" % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
_s9seeds = [_s9def, 1, 17]
_S9X = json.loads(subprocess.run([_node, '-e', _S9_EXPORT % (json.dumps(_mf), json.dumps(_s9seeds), json.dumps([[n, c] for n, c in _S9_CFGS]))], capture_output=True, text=True, check=True).stdout)
GRID9 = (200 + 5 * np.arange(81)) / 100; PER9 = ['tr', 'ck', 'fut', 'A', 'B']
def py9_limits(x, pm, ev_s, ev_e, kind, nb, dmax, guard):
    N = len(x); n0 = min(2000, pm[0] if len(pm) else N); cc, ww = x[:n0].mean(), x[:n0].std(ddof=1)
    c = np.full(N, cc); w = np.full(N, ww); add = np.zeros(N); forced = []
    if kind == 'adaptive':
        for j, p in enumerate(pm):
            seg_end = pm[j + 1] if j + 1 < len(pm) else N; we = min(p + nb, seg_end); win = x[p:we]
            nc = np.median(win); nw = 1.4826 * np.median(np.abs(win - nc)); moved = abs(nc - cc) > dmax * ww
            evs = [e for e in range(len(ev_s)) if ev_s[e] < we and ev_e[e] > p]; adopt = True
            if guard and moved: forced.append((we - 1, evs)); adopt = len(evs) == 0
            c[p:we] = cc; w[p:we] = ww; add[p:we] = dmax
            if adopt: cc, ww = nc, nw
            c[we:seg_end] = cc; w[we:seg_end] = ww
    return c, w, add, forced
def py9_labels(U, UE, evg, err, dr):
    eT = 0 if dr == 'fa2true' else err; eF = 0 if dr == 'true2fa' else err
    mis = np.array([u < eT for u in UE], bool); evid = np.where(evg >= 0, np.where(mis[np.maximum(evg, 0)], -1, evg), np.where(U < eF, -2, -1))
    return evid, mis
def py9_scan(x, lim, k, evid, mis, traced, ev_s, ev_e, masks, rearm=10):
    c, w, add, forced = lim; lo = c - (k + add) * w; hi = c + (k + add) * w
    cand = np.flatnonzero((x > hi) | (x < lo)); fmap = {t: evs for t, evs in forced}; pts = np.union1d(cand, np.array(sorted(fmap), dtype=int)).astype(int)
    det = np.full(len(ev_s), np.inf); fa_idx = []; sup = -1; p = 0; n = len(pts)
    while p < n:
        i = int(pts[p])
        if i in fmap:
            found = False
            for e in fmap[i]:
                if mis is not None and mis[e]: continue
                found = True
                if det[e] == np.inf: det[e] = i
            if not found: fa_idx.append(i)
            sup = i + rearm; p += 1; continue
        e = evid[i]
        if e >= 0 and det[e] < i: p += 1; continue
        if i <= sup:
            if not fmap: p = int(np.searchsorted(pts, sup + 1)); continue
            p += 1; continue
        sup = i + rearm
        if e >= 0: det[e] = i
        elif e == -1: fa_idx.append(i)
        p += 1
    fa = np.array([int(m[fa_idx].sum()) if fa_idx else 0 for m in masks]); miss = np.zeros(len(masks), int)
    for e in range(len(ev_s)):
        if mis is not None and mis[e]: continue
        if det[e] == np.inf and not traced: continue
        b = int(min(det[e], ev_e[e]))
        for q, m in enumerate(masks): miss[q] += int(m[ev_s[e]:b].sum())
    return fa, miss
_ok9, _bad9, _pick9 = True, [], {}
for X in _S9X:
    x = np.array(X['x']); N = X['N']; nH = X['nHist']; idx = np.arange(N); memA = np.array(X['memA']); ev_s = [e['start'] for e in X['events']]; ev_e = [e['end'] for e in X['events']]
    evg = np.full(N, -1)
    for e in range(len(ev_s)): evg[ev_s[e]:ev_e[e]] = e
    masks = [idx < nH // 2, (idx >= nH // 2) & (idx < nH), idx >= nH, memA == 1, (idx < nH) & (memA == 0)]
    for cfg in X['cfgs']:
        prm = cfg['params']; nb, dm, gd, cfa, cmiss = prm['n_burn'], prm['dmax'], prm['guard'], prm['c_fa'], prm['c_miss']; err, dr, trc = prm['label_err'], prm['label_dir'], prm['miss_traced']
        if X['seed'] != _s9def and cfg['name'] != '기본': continue
        evid_r, mis_r = py9_labels(np.array(X['U']), X['UE'], evg, err, dr) if (err > 0 or not trc) else (evg, None)
        for pk, kind in (('P1', 'fixed'), ('P2', 'adaptive')):
            lim = py9_limits(x, X['pm'], ev_s, ev_e, kind, nb, dm, gd)
            for lbl, (ev_id, mis, tr) in (('true', (evg, None, True)), ('rec', (evid_r, mis_r, trc))):
                if lbl == 'rec' and not (err > 0 or not trc): continue
                if kind == 'fixed' and (X['seed'] != _s9def or cfg['name'] in ('가드 끔', '안정화 30장', 'Δmax 1.5')): continue
                F = np.zeros((81, 5), int); Mi = np.zeros((81, 5), int)
                for j, k in enumerate(GRID9): F[j], Mi[j] = py9_scan(x, lim, k, ev_id, mis, tr, ev_s, ev_e, masks)
                cj = cfg['curves'][f'{pk}_{lbl}']
                if not (np.array_equal(F, np.array(cj['fa'])) and np.array_equal(Mi, np.array(cj['miss']))): _ok9 = False; _bad9.append((X['seed'], cfg['name'], pk, lbl))
                if lbl == 'rec' or not (err > 0 or not trc):
                    cost = cfa * F + cmiss * Mi; jp = int(np.argmin(cost[:, 0])); _pick9[(X['seed'], cfg['name'], pk)] = GRID9[jp]
                    if abs(GRID9[jp] - cfg[pk]['k']) > 1e-9: _ok9 = False; _bad9.append((X['seed'], cfg['name'], pk, 'k'))
chk('S9 JS 정책·집계 = numpy 독립 구현(정확 일치): 기본 시드와 시드 1·17 의 기본 조건 + 기본 시드의 여덟 조건 × k 81칸 × 다섯 기간의 가성 건수·놓친 장수·최적 k', _ok9,
    f'비교 곡선 {len(_pick9)}개 최적 k 포함 · 불일치 {_bad9}' if _bad9 else f'전부 일치 · 기본 시드 최적 k: P1 {_pick9[(_s9def,"기본","P1")]:.2f} · P2 {_pick9[(_s9def,"기본","P2")]:.2f}')
# 데이터 구조: 기간·PM 간격·사건 수·크기
X0 = _S9X[0]; _pm = np.array(X0['pm']); _gap = np.diff(np.concatenate([[0], _pm]))
chk('S9 구조: 하루 200장 × 180일 = 36,000장 + 배포 뒤 90일, PM 간격 1,600~2,400', X0['nHist'] == 36000 and X0['N'] == 54000 and _gap.min() >= 1600 and _gap.max() <= 2400, f'PM {int((_pm < X0["nHist"]).sum())}회(기록 구간) · 간격 {_gap.min()}~{_gap.max()}')
# 시드 분포 — 1~200
_S9_DIST = """const M=require(%s);const T=M.s9tools;const out=[];
const sum=(a,k)=>a.reduce((s,r)=>s+r[k],0);
for(let sd=1;sd<=200;sd++){const S=M.scenario('S9',{seed:sd});const D=S.D,A=S.analysis,c=(x,p)=>x[p].cost;
 const pol0=T.policy(D,'fixed',100,3,true),r0=T.scan(D,pol0,3,null,true);let near=0,nh=0,post=0;
 r0.alarms.forEach(i=>{if(i>=D.nHist)return;nh++;let d=1e9;for(const p of D.pm)if(i>=p)d=i-p;if(d<500)near++;if(i>=D.pm[0])post++;});
 const bt=c(A.P2.time,'fut')/c(A.P2.time,'ck')-1,bs=c(A.shuffle.P2.at,'fut')/c(A.shuffle.P2.at,'B')-1;
 const reg=a=>c(a.P2.time,'tr')-c(a.P2.at_true_k,'tr');
 const un=S.analyze({miss_traced:false}),sy=S.analyze({label_err:0.2}),f2t=S.analyze({label_err:0.3,label_dir:'fa2true'}),t2f=S.analyze({label_err:0.3,label_dir:'true2fa'});
 const burn=[];D.events.forEach((e,id)=>{if(e.start>=D.nHist)return;for(const p of D.pm)if(e.start>=p&&e.start<p+100){burn.push(id);break;}});
 const kk=A.P2.pick.k,on=T.scan(D,T.policy(D,'adaptive',100,3,true),kk,null,true),off=T.scan(D,T.policy(D,'adaptive',100,3,false),kk,null,true);
 const bm=r=>burn.reduce((s,id)=>s+Math.min(r.det[id],D.events[id].end)-D.events[id].start,0);
 out.push({sd:sd,near:nh?near/nh:0,post:nh?post/nh:0,p0ck:c(A.P0,'ck'),p1ck:c(A.P1.time,'ck'),p2ck:c(A.P2.time,'ck'),p2tr:c(A.P2.time,'tr'),k1:A.P1.pick.k,k2:A.P2.pick.k,bt:bt,bs:bs,
  unK:un.P2.pick.k-un.P2.pick.k_true,unReg:reg(un),unRatio:c(un.P2.rec,'tr')/c(un.P2.time,'tr'),syK:sy.P2.pick.k-sy.P2.pick.k_true,syReg:reg(sy),syRatio:c(sy.P2.rec,'tr')/c(sy.P2.time,'tr'),
  f2tK:f2t.P2.pick.k-f2t.P2.pick.k_true,t2fK:t2f.P2.pick.k-t2f.P2.pick.k_true,nBurn:burn.length,bmOn:bm(on),bmOff:bm(off),
  nPM:D.pm.filter(p=>p<D.nHist).length,nEv:D.events.filter(e=>e.start<D.nHist).length,minSize:Math.min(...D.events.map(e=>e.size)),maxSize:Math.max(...D.events.map(e=>e.size)),
  fday:(r0.fa[0]+r0.fa[1])/180,top3:(function(){const c={};let n=0;r0.alarms.forEach(i=>{if(i>=D.nHist)return;let s=0;D.pm.forEach((p,j)=>{if(i>=p)s=j+1});c[s]=(c[s]||0)+1;n++;});const v=Object.values(c).sort((a,b)=>b-a);return n?(v[0]+(v[1]||0)+(v[2]||0))/n:0;})(),
  mchg:A.P2.time.ck.miss-A.P0.ck.miss,p1fut:A.P1.time.fut.cost,
  hiTau:(function(){const B=M.scenario('S9',{seed:sd,tau:2}).analysis;return [B.P2.time.ck.cost,B.P1.time.ck.cost,B.P0.ck.cost];})()});}
console.log(JSON.stringify(out))"""
_d9 = json.loads(subprocess.run([_node, '-e', _S9_DIST % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
_c9 = lambda k: np.array([np.nan if d[k] is None else d[k] for d in _d9], float); _md = lambda k: float(np.nanmedian(_c9(k))); _qq = lambda k, p: float(np.nanquantile(_c9(k), p))   # 0/0 인 비율은 null → 제외
chk('S9 분포(시드 200): 기록 구간 PM 약 17회·진성 이상 약 12건(기대 3,000장에 1건 + PM 직후 가중), 크기 2.5~5σ', 15 <= _md('nPM') <= 19 and 9 <= _md('nEv') <= 17 and _c9('minSize').min() >= 2.5 and _c9('maxSize').max() <= 5.0,
    f'PM 중앙값 {_md("nPM"):.0f} · 사건 중앙값 {_md("nEv"):.0f}(10~90%: {_qq("nEv",.1):.0f}~{_qq("nEv",.9):.0f})')
chk('S9 분포 중앙값: 현행(P0)의 가성 인터락이 특징 하나당 하루 0.3~1건(τ 기본값의 근거. 3σ 선의 이론 하한은 하루 약 0.54건)', 0.3 <= _md('fday') <= 1.0, f'중앙값 하루 {_md("fday"):.2f}건 (10~90%: {_qq("fday",.1):.2f}~{_qq("fday",.9):.2f}) · τ = {_tau9}')
chk('S9 분포 중앙값: P0 가성이 PM 구간 몇 개에 몰림 — 가성이 가장 많은 구간 3개의 점유율이 균등(3/18)의 1.5배 이상', _md('top3') > 1.5 * 3 / 18, f'중앙값 {_md("top3")*100:.0f}% (10~90%: {_qq("top3",.1)*100:.0f}~{_qq("top3",.9)*100:.0f}%)')
chk('S9 분포 중앙값: PM 뒤 500장 안 비율은 구간 길이 비율(500/2000)에 가깝다 — 설계서의 60% 는 새 정상이 계속 머무는 설정과 맞지 않아 바로잡음', 0.15 < _md('near') < 0.40, f'중앙값 {_md("near")*100:.1f}% (10~90%: {_qq("near",.1)*100:.1f}~{_qq("near",.9)*100:.1f}%)')
_r = _c9('p2ck') / _c9('p1ck'); _r0 = _c9('p1ck') / _c9('p0ck'); _r20 = _c9('p2ck') / _c9('p0ck')
chk('S9 분포 중앙값: 비용으로 고른 k(고정 한계, P1)의 확인 기간 비용 < 현행(P0)의 0.6배, 적응형(P2)도 현행의 0.8배 미만', float(np.median(_r0)) < 0.6 and float(np.median(_r20)) < 0.8,
    f'P1/P0 {np.median(_r0):.2f}배 (10~90%: {np.quantile(_r0,.1):.2f}~{np.quantile(_r0,.9):.2f}) · P2/P0 {np.median(_r20):.2f}배 (10~90%: {np.quantile(_r20,.1):.2f}~{np.quantile(_r20,.9):.2f}) · P1 의 최적 k 중앙값 {_md("k1"):.2f}(격자 끝에 붙는 시드 {int((_c9("k1")>=5.999).sum())}개)')
_hi = np.array([d['hiTau'] for d in _d9], float); _hr = _hi[:, 0] / np.maximum(_hi[:, 1], 1)
chk('S9 분포 중앙값: 적응형(P2)이 고정+최적 k(P1)보다 나은지는 PM 이동폭 τ 에 달림 — τ 기본값에서는 P2/P1 > 1(적응형이 앞서지 못함), τ = 2 에서는 < 1(앞섬)', float(np.median(_r)) > 1 and float(np.median(_hr)) < 1,
    f'τ={_tau9}: P2/P1 중앙값 {np.median(_r):.2f}배 (10~90%: {np.quantile(_r,.1):.2f}~{np.quantile(_r,.9):.2f}) · τ=2: {np.median(_hr):.2f}배 (10~90%: {np.quantile(_hr,.1):.2f}~{np.quantile(_hr,.9):.2f})')
_o = (_c9('p2ck') / np.where(_c9('p2tr') > 0, _c9('p2tr'), np.nan))
_o = _o[np.isfinite(_o)]
chk('S9 분포 중앙값: 학습 기간 비용으로 본 성능이 확인 기간보다 낙관적(확인/학습 비용비 > 1)', float(np.median(_o)) > 1, f'중앙값 {np.median(_o):.2f}배 (10~90%: {np.quantile(_o,.1):.2f}~{np.quantile(_o,.9):.2f}) · 학습 비용이 0 이라 제외한 시드 {200-len(_o)}개')
chk('S9 분포 중앙값: 섞어 나누기의 낙관 편향(배포 뒤 비용/확인 비용 − 1) > 시간순의 것, 섞어 나누기는 0 보다 큼', _md('bs') > _md('bt') and _md('bs') > 0, f'섞어 나누기 {_md("bs")*100:+.0f}% (10~90%: {_qq("bs",.1)*100:+.0f}~{_qq("bs",.9)*100:+.0f}%) · 시간순 {_md("bt")*100:+.0f}% (10~90%: {_qq("bt",.1)*100:+.0f}~{_qq("bt",.9)*100:+.0f}%)')
chk('S9 분포 중앙값: 놓친 이상 기록이 없으면 고른 k 가 참값 최적 k 보다 크고(중앙값 > 0) 참값 비용 손해 > 0', _md('unK') > 0 and _md('unReg') > 0, f'k 이동 중앙값 +{_md("unK"):.2f}(10~90%: {_qq("unK",.1):+.2f}~{_qq("unK",.9):+.2f}) · 손해 중앙값 {_md("unReg"):.0f}분/90일')
chk('S9 분포: 양쪽 같은 비율의 라벨 오류 20% — 손해는 한 번도 음수가 아니고 평균 > 0, 장부 비용은 참값보다 낮게 적힘(중앙값 비율 < 0.95), 최적 k 는 중앙값이 거의 안 움직임(|이동| ≤ 0.1)',
    float(_c9('syReg').min()) >= 0 and float(_c9('syReg').mean()) > 0 and _md('syRatio') < 0.95 and abs(_md('syK')) <= 0.1,
    f'손해 평균 {_c9("syReg").mean():.0f}분(0 초과 시드 {(_c9("syReg")>0).mean()*100:.0f}%, 중앙값 {_md("syReg"):.0f}) · 장부/참값 {_md("syRatio"):.2f} · k 이동 중앙값 {_md("syK"):+.2f}')
chk('S9 분포: 한 방향 라벨 오류 30% — 가성→진성만이면 k 가 낮아지는 쪽(평균 < 0), 진성→가성만이면 높아지는 쪽(평균 > 0)', _c9('f2tK').mean() < 0 and _c9('t2fK').mean() > 0, f'가성→진성 평균 {_c9("f2tK").mean():+.2f} · 진성→가성 평균 {_c9("t2fK").mean():+.2f}')
_h = _c9('nBurn') > 0; _on, _off = _c9('bmOn')[_h], _c9('bmOff')[_h]; _df = _off - _on
chk('S9 분포: 안정화 구간 안에서 시작한 진성 이상의 놓친 장수(같은 k) — 가드 끔이 켬보다 더 놓친 시드가 5% 이상, 덜 놓친 시드는 2% 미만, 평균 차이 > 0 (가드의 효과는 대부분의 기록에서 0 이고 일부 기록에서 큼)',
    float((_df > 0).mean()) >= 0.05 and float((_df < 0).mean()) < 0.02 and float(_df.mean()) > 0,
    f'그런 사건이 있는 시드 {int(_h.sum())}개 · 끔이 더 놓침 {(_df>0).mean()*100:.0f}% · 덜 놓침 {(_df<0).mean()*100:.0f}% · 차이 중앙값 {np.median(_df):.0f}장 · 평균 {_df.mean():+.1f}장(켬 {_on.mean():.0f} / 끔 {_off.mean():.0f})')
_rk = lambda k, i: float(((_c9(k) < _c9(k)[i]).sum() + 0.5 * (_c9(k) == _c9(k)[i]).sum()) / 200)
_ms = ['p0ck', 'p1ck', 'p2ck', 'unK', 'bs', 'bt', 'mchg']; _nm = ['P0', 'P1', 'P2', '놓침기록없음 k이동', '섞어 낙관', '시간순 낙관', '적응형 놓침 변화']
_sum = [sum(abs(_rk(m, i) - 0.5) for m in _ms) for i in range(200)]
chk('S9 대표 시드: 기본 시드는 일곱 지표 백분위의 Σ|백분위−50| 이 가장 작은 시드이고, 일곱 지표가 모두 시드 1~200 분포의 25~75% 안', int(np.argmin(_sum)) + 1 == _s9def and all(0.25 <= _rk(m, _s9def - 1) <= 0.75 for m in _ms),
    f'시드 {_s9def}(Σ {_sum[_s9def-1]:.2f}, 최소 시드 {int(np.argmin(_sum))+1}): ' + ' · '.join(f'{n} {_rk(m, _s9def - 1)*100:.0f}%' for m, n in zip(_ms, _nm)))

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

# ============================================================
# ESTC 층 (0206) — 파이썬 독립 재생: 같은 표(node JSON 덤프)로 CSV 궤적을 다시 검사한다. estcCheck 를 부르지 않는다.
# ============================================================
_mq = rd('mask_transitions.csv').fillna({'cause': ''}); _END = 60 * 1440
_est = json.loads(subprocess.run([_node, '-e', "const M=require(%s);console.log(JSON.stringify({estc:M.ESTC,schema:M.CASE_SCHEMA}))" % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
_TB = {(x['entity'], x['from'], x['to']): x for x in _est['estc']['transitions']}; _CAP = _est['estc']['params']['CAP']
def py_check(df, end=_END, cap=_CAP):
    """독립 재생: 표 대조(T0)·시각(T1)·이음새(C3)·세정 동시 수(C1)·블록당 dep(C2)·챔버 체류 합(C4). 위반 (규칙, 행 번호) 목록."""
    v = []
    key = list(zip(df.entity, df['from'], df['to']))
    v += [('T0', i) for i, k in enumerate(key) if k not in _TB]
    tv = df.t.values; v += [('T1', i) for i in np.where(np.diff(tv) < 0)[0] + 1]
    g = df.groupby(['entity', 'id'], sort=False)
    prev_to = g['to'].shift(1).fillna('init'); bad = np.where((df['from'] != prev_to).values)[0]; v += [('C3', i) for i in bad]
    dt = g['t'].diff(); v += [('T1', i) for i in np.where((dt < 0).values)[0]]
    m = (df.entity == 'mask').values
    d = np.where(m & (df['to'] == 'cleaning').values, 1, 0) - np.where(m & (df['from'] == 'cleaning').values, 1, 0); cs = np.cumsum(d)
    v += [('C1', i) for i in np.where(cs > cap)[0]]
    s = (df.entity == 'set').values; blk = df.id.str[:3].values
    for b in np.unique(blk[s]):
        sel = s & (blk == b); dd = np.where(df['to'][sel] == 'dep', 1, 0) - np.where(df['from'][sel] == 'dep', 1, 0); cc = np.cumsum(dd)
        v += [('C2', int(df.index[sel][i])) for i in np.where(cc > 1)[0]]
    c = df[df.entity == 'chamber']; tot = {}
    for cid, gg in c.groupby('id'):
        tt = gg.t.values; tot[cid] = (tt[0], (np.diff(tt)).sum() + (end - tt[-1]))
    v += [('C4', cid) for cid, (t0, s_) in tot.items() if t0 != 0 or s_ != end]
    return v
_v0 = py_check(_mq)
chk('ESTC Python 독립 재생: 60일 전이 %s줄(마스크·세트·챔버·블록) — 표 대조·이음새·세정 ≤ %d장·블록당 dep ≤ 1·챔버 체류 합 = 86,400분, 위반 0' % (f'{len(_mq):,}', _CAP), len(_v0) == 0 and len(_mq) > 100000,
    f'위반 {len(_v0)}건 · 개체 종류 {dict(_mq.entity.value_counts())}')
# 표와 CSV 의 일치: 표의 전이 중 실제로 한 번도 안 나온 것(시뮬레이터가 내지 않는 것)과 나온 것
_seen = set(zip(_mq.entity, _mq['from'], _mq['to'])); _unseen = sorted(k for k in _TB if k not in _seen)
chk('ESTC 표 대조: 기록된 전이 종류가 모두 표에 있고, 표에만 있고 기록에 없는 전이는 사람 승인(scrapped)·드문 경로뿐', _seen <= set(_TB) and all(_TB[k]['needs_human'] or k[0] in ('set', 'block', 'chamber', 'mask') for k in _unseen),
    f'기록된 종류 {len(_seen)}개 / 표 {len(_TB)}개 · 기록 없음: ' + ', '.join(f'{k[0]}:{k[1]}→{k[2]}' for k in _unseen if not k[0] == 'block') + f' (+블록 {sum(1 for k in _unseen if k[0]=="block")}개)')
# 고장 낸 궤적 셋 — 파이썬과 JS 가 똑같이 정확히 그 규칙만 잡는다
def _brk_py():
    out = {}
    df = _mq.copy(); df = df.reset_index(drop=True)
    # (1) 전이 한 줄 삭제: 어떤 마스크의 held→to_stock
    i = int(df[(df.entity == 'mask') & (df['from'] == 'held') & (df['to'] == 'to_stock')].index[100]); out['del'] = py_check(df.drop(index=i).reset_index(drop=True))
    # (2) 순서 뒤집기: 같은 마스크의 연속 두 줄(held→to_stock, to_stock→stock)의 내용을 맞바꿈(시각 칸은 그대로)
    d2 = df.copy(); j = int(d2[(d2.entity == 'mask') & (d2['from'] == 'held') & (d2['to'] == 'to_stock')].index[200]); mid = d2.id[j]
    k = int(d2[(d2.index > j) & (d2.id == mid)].index[0]); cols = ['from', 'to', 'trigger', 'cause']; a, b = d2.loc[j, cols].copy(), d2.loc[k, cols].copy(); d2.loc[j, cols] = b.values; d2.loc[k, cols] = a.values; out['swap'] = py_check(d2)
    # (3) 세정 한 장 더: 세정기가 27장 찬 순간, 대기 중인 마스크의 clean_wait→cleaning 을 그 시각으로 당김
    m = (df.entity == 'mask').values; dd = np.where(m & (df['to'] == 'cleaning').values, 1, 0) - np.where(m & (df['from'] == 'cleaning').values, 1, 0); cs = np.cumsum(dd)
    full = int(np.where(cs == _CAP)[0][50]); tfull = int(df.t[full]); d3 = df.copy()
    cand = d3[(d3.entity == 'mask') & (d3['to'] == 'cleaning') & (d3.t > tfull)]
    for ci in cand.index:
        mid = d3.id[ci]; prev = d3[(d3.id == mid) & (d3.index < ci)].iloc[-1]
        if prev.t <= tfull: break
    d3.loc[ci, 't'] = tfull; d3 = pd.concat([d3.iloc[:full + 1], d3.loc[[ci]], d3.drop(index=ci).iloc[full + 1:]]) if False else d3
    d3 = d3.sort_values('t', kind='stable').reset_index(drop=True); out['push'] = py_check(d3)
    return out
_bp = _brk_py(); _rules = lambda v: sorted(set(r for r, _ in v))
chk('ESTC 고장 낸 궤적 셋(파이썬): 전이 삭제 → 이음새(C3)만, 순서 뒤집기 → 이음새(C3)만, 세정 한 장 더 밀어 넣기 → 세정 한도(C1)만', _rules(_bp['del']) == ['C3'] and _rules(_bp['swap']) == ['C3'] and _rules(_bp['push']) == ['C1'],
    f'삭제 {_rules(_bp["del"])}×{len(_bp["del"])} · 뒤집기 {_rules(_bp["swap"])}×{len(_bp["swap"])} · 밀어 넣기 {_rules(_bp["push"])}×{len(_bp["push"])}')
_BRK_JS = r"""const M=require(%s);const s=M.simulateLoss({trace:true}),tr=s.transitions.map(x=>Object.assign({},x));const rules=r=>[...new Set(r.violations.map(v=>v.rule))].sort();const o={};
let i=tr.map((x,k)=>x.entity==='mask'&&x.from==='held'&&x.to==='to_stock'?k:-1).filter(k=>k>=0)[100];o.del=rules(M.estcCheck(tr.filter((_,k)=>k!==i),{end:s.end}));
const t2=tr.map(x=>Object.assign({},x));const j=tr.map((x,k)=>x.entity==='mask'&&x.from==='held'&&x.to==='to_stock'?k:-1).filter(k=>k>=0)[200];const k2=t2.findIndex((x,k)=>k>j&&x.id===t2[j].id);
for(const f of ['from','to','trigger','cause']){const a=t2[j][f];t2[j][f]=t2[k2][f];t2[k2][f]=a;}o.swap=rules(M.estcCheck(t2,{end:s.end}));
let c=0,full=-1,n=0;for(let k=0;k<tr.length;k++){const x=tr[k];if(x.entity!=='mask')continue;if(x.to==='cleaning')c++;if(x.from==='cleaning')c--;if(c===27){n++;if(n===51){full=k;break;}}}
const tf=tr[full].t;let ci=-1;for(let k=full+1;k<tr.length;k++){const x=tr[k];if(x.entity==='mask'&&x.to==='cleaning'){const pv=tr.slice(0,k).reverse().find(y=>y.id===x.id);if(pv.t<=tf){ci=k;break;}}}
const t3=tr.map(x=>Object.assign({},x));t3[ci].t=tf;t3.sort((a,b)=>a.t-b.t);o.push=rules(M.estcCheck(t3,{end:s.end}));console.log(JSON.stringify(o));"""
_bj = json.loads(subprocess.run([_node, '-e', _BRK_JS % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
chk('ESTC 고장 낸 궤적 셋(JS estcCheck): 같은 세 가지를 정확히 그 규칙만 잡음', _bj == {'del': ['C3'], 'swap': ['C3'], 'push': ['C1']}, f'{_bj}')
# 기록 끔/켬 동일 + 기본 반환 키 불변
_OFFON = r"""const M=require(%s);const a=M.simulateLoss(),b=M.simulateLoss({trace:true}),c=M.simulateLoss({days:20,seed:5}),d=M.simulateLoss({days:20,seed:5,trace:true});const j=x=>JSON.stringify([x.events,x.hourly,x.turns,x.params,x.days]);
console.log(JSON.stringify({same:j(a)===j(b)&&j(c)===j(d),keys_off:Object.keys(a),keys_on:Object.keys(b)}))"""
_oo = json.loads(subprocess.run([_node, '-e', _OFFON % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
chk('ESTC 기록 훅: 켜도 events·hourly·turns·params 가 끈 것과 바이트 단위로 같고(기본·20일/시드 5), 끈 반환 키는 기존 5개 그대로', _oo['same'] and _oo['keys_off'] == ['events', 'hourly', 'turns', 'params', 'days'] and _oo['keys_on'][-3:] == ['transitions', 'resources', 'end'], f'끔 {_oo["keys_off"]} · 켬 추가 {_oo["keys_on"][5:]}')
# 챔버 체류 ↔ 이벤트 분
_ev = rd('loss_events.csv'); _ev['start_min'] = ((pd.to_datetime(_ev.start_ts) - pd.Timestamp('2026-01-05')).dt.total_seconds() / 60).round().astype(int); _rmap = {'EQ-BD': 'bd', 'Q-EVAP': 'ev', 'EQ-PM': 'pm', 'Q-MASK': 'mask'}
_e1 = _ev[_ev.reason.isin(_rmap) & (_ev.chamber != 'ALL')].copy(); _e1['cid'] = _e1.block + '-' + _e1.chamber; _e1['st'] = _e1.reason.map(_rmap)
_evsum = _e1.groupby(['cid', 'st']).loss_chamber_min.sum().round().astype(int)
_ch = _mq[_mq.entity == 'chamber'].copy(); _ch['nt'] = _ch.groupby('id').t.shift(-1).fillna(_END); _ch['dur'] = (_ch.nt - _ch.t).astype(int); _dw = _ch[_ch['to'] != 'run'].groupby(['id', 'to']).dur.sum()
_dw.index.names = ['cid', 'st']; _cmp = pd.concat([_dw.rename('dwell'), _evsum.rename('events')], axis=1).fillna(0)
chk('ESTC 챔버 체류 분 ↔ events 분: 44개 챔버 × 정지 네 종류(고장·증착기·PM·마스크) 모두 정확히 일치', len(_cmp) > 150 and (_cmp.dwell == _cmp.events).all(), f'비교 {len(_cmp)}칸 · 불일치 {(_cmp.dwell != _cmp.events).sum()} · 정지 총 {int(_cmp.dwell.sum()):,}분')
# 세정 동시 수 ↔ hourly
_hr2 = rd('loss_hourly.csv'); _mm = _mq[_mq.entity == 'mask']; _t = _mm.t.values
_dcl = np.where(_mm['to'] == 'cleaning', 1, 0) - np.where(_mm['from'] == 'cleaning', 1, 0); _dwq = np.where(_mm['to'] == 'clean_wait', 1, 0) - np.where(_mm['from'] == 'clean_wait', 1, 0)
_ends = np.arange(1440) * 60 + 59; _ix = np.searchsorted(_t, _ends, side='right'); _ccl = np.concatenate([[0], np.cumsum(_dcl)])[_ix]; _cwq = np.concatenate([[0], np.cumsum(_dwq)])[_ix]
chk('ESTC 세정 동시 수 ↔ hourly: 1,440시간 모두 전이에서 다시 센 세정 중 장수 = cleaner_busy, 세정 대기 장수 = cleaner_queue, 최대 ≤ 27', (_ccl == _hr2.cleaner_busy.values).all() and (_cwq == _hr2.cleaner_queue.values).all() and _ccl.max() <= _CAP,
    f'세정 중 최대 {_ccl.max()}장(27장 꽉 찬 시간 {(_ccl == _CAP).sum()}개) · 대기열 최대 {_cwq.max()}장')
# 사례 집계: 파이썬이 CSV 만으로 다시 센 값 = JS caseRecords
_CASES = r"""const M=require(%s);const s=M.simulateLoss({trace:true}),c=M.caseRecords(s),m=M.estcMetrics(s,c);const q=c.filter(x=>x.decision.rule==='R-MASK-REPAIR'),w=c.filter(x=>x.entity==='block');
console.log(JSON.stringify({n:c.length,nq:q.length,nw:w.length,rec:q.filter(x=>x.label==='recurred').length,notrec:q.filter(x=>x.label==='not_recurred').length,cens:q.filter(x=>x.label==='censored').length,absent:q.reduce((a,x)=>a+x.outcome.absent_min,0),wait_min:w.reduce((a,x)=>a+x.outcome.value,0),early:w.filter(x=>x.label==='early_jc').length,m:m,bad:c.map(x=>M.validateCase(x)).filter(e=>e.length).length,cases:c}))"""
_cj = json.loads(subprocess.run([_node, '-e', _CASES % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
_mk = _mq[_mq.entity == 'mask']; _bl = _mq[_mq.entity == 'block']; _chf = _mq[(_mq.entity == 'chamber') & (_mq.trigger == 'mask_failure')]
_nq = _nrec = _nnot = _ncen = 0; _bymask = {k: g.reset_index(drop=True) for k, g in _mk.groupby('id')}; _absent = 0
_qev = _ev[(_ev.reason == 'Q-MASK') & (_ev.chamber != 'ALL')]
for _, r in _chf.iterrows():
    b, cn = r.id[:3], r.id[-1]; found = None
    for sname in 'ABC':
        g = _bymask.get(f'{b}-{sname}{cn}')
        if g is None: continue
        hit = g[(g['to'] == 'repair') & (g.t >= r.t) & (g.t - r.t < 400)]
        if len(hit): found = (f'{b}-{sname}{cn}', g, int(hit.index[0])); break
    if not found: continue
    mid, g, k = found; _nq += 1; rt = int(g.t[k]); back = g[(g.index > k) & (g['from'] == 'cleaning') & (g['to'] == 'stock')]
    nxt = g[(g.index > k) & (g['to'] == 'in_use') & ((g.t > back.t.iloc[0]) if len(back) else False)] if len(back) else g.iloc[0:0]
    tto = _END
    if len(nxt):
        ni = int(nxt.index[0]); tto = int(g.t[ni])
        if ni + 1 < len(g): _nrec += int(g['to'][ni + 1] == 'repair'); _nnot += int(g['to'][ni + 1] != 'repair')
        else: _ncen += 1
    else: _ncen += 1
    _absent += _qev[(_qev.block == b) & (_qev.chamber == 'CH' + cn) & (_qev.mask_set == mid[4]) & (_qev.start_min > rt) & (_qev.start_min < tto)].loss_chamber_min.sum()
_blk = {}; _nw = _wmin = 0
for bid, g in _bl.groupby('id'):
    g = g.reset_index(drop=True)
    for k in range(len(g) - 1):
        if g['to'][k] == 'wait_jc' and g.t[k + 1] - g.t[k] >= 20: _nw += 1; _wmin += int(g.t[k + 1] - g.t[k])
chk('ESTC 사례 집계: 파이썬이 CSV 에서 다시 센 Q-MASK 사례 수·재불량·정상 반납·미확인·빠진 동안 정지 분, 잡 체인지 대기 사례 수·대기 분이 JS caseRecords 와 일치', (_nq, _nrec, _nnot, _ncen, int(_absent), _nw, _wmin) == (_cj['nq'], _cj['rec'], _cj['notrec'], _cj['cens'], _cj['absent'], _cj['nw'], _cj['wait_min']),
    f'Q-MASK {_nq}건(재불량 {_nrec} · 정상 반납 {_nnot} · 미확인 {_ncen}) · 빠진 동안 정지 {int(_absent)}분 · 잡 체인지 대기 {_nw}건 {_wmin}분')
# 사례 양식 검사(파이썬 독립 구현) + 일부러 망가뜨린 기록
_SC = {f['name']: f for f in _est['schema']['fields']}
def py_validate(rec):
    e = []
    for n, f in _SC.items():
        v = rec.get(n)
        if v is None:
            if f['required']: e.append('필수 ' + n)
            continue
        ty = 'array' if isinstance(v, list) else 'object' if isinstance(v, dict) else 'string' if isinstance(v, str) else 'number'
        if ty != f['type']: e.append('형식 ' + n)
        if 'enum' in f and v not in f['enum']: e.append('enum ' + n)
    if e: return e
    import re
    if not re.match(r'^\d{4}-\d\d-\d\d \d\d:\d\d$', rec['t_detect']): e.append('t_detect')
    if rec['outcome']['t_check'] < rec['t_detect']: e.append('시각 순서')
    a = rec['action']['transition']
    if (rec['entity'], a['from'], a['to']) not in _TB and not (rec['entity'] == 'block' and a['from'] == 'wait_jc'): e.append('전이가 표에 없음')
    elif (rec['entity'], a['from'], a['to']) in _TB and _TB[(rec['entity'], a['from'], a['to'])]['needs_human'] and (not rec['action']['needs_human'] or rec['action']['approved_by'] in (None, '', 'rule')): e.append('사람 승인 칸')
    return e
import copy
_cs = _cj['cases']; _bad = sum(1 for c in _cs if py_validate(c)); _c0 = _cs[0]
_m1 = copy.deepcopy(_c0); del _m1['evidence']; _m2 = copy.deepcopy(_c0); _m2['outcome']['t_check'] = '2000-01-01 00:00'; _m3 = copy.deepcopy(_c0); _m3['action']['transition'] = {'from': 'repair', 'to': 'scrapped'}; _m3['entity'] = 'mask'; _m3['action']['approved_by'] = 'rule'
_m4 = copy.deepcopy(_c0); _m4['entity'] = 'mask'; _m4['action']['transition'] = {'from': 'stock', 'to': 'repair'}
chk('ESTC 사례 양식: 가상 사례 %d건이 모두 양식 검사 통과(파이썬·JS 모두), 일부러 망가뜨린 넷(필수 칸 삭제·시각 거꾸로·사람 승인 없는 폐기·표에 없는 전이)은 모두 거절' % len(_cs),
    _bad == 0 and _cj['bad'] == 0 and all(len(py_validate(x)) > 0 for x in (_m1, _m2, _m3, _m4)), f'통과 {len(_cs) - _bad}/{len(_cs)} · 거절 사유 {[py_validate(x)[:1] for x in (_m1, _m2, _m3, _m4)]}')
# 전이 요청 판정(JS requestTransition): 표에 없음·사람 승인·가드 실패·허용이 각각 나옴
_REQ = r"""const M=require(%s);const s=M.simulateLoss({trace:true}),tr=s.transitions;const out={};
let c=0,tf=-1,cq=0;for(const x of tr){if(x.entity==='mask'){if(x.to==='cleaning')c++;if(x.from==='cleaning')c--;if(x.to==='clean_wait')cq++;if(x.from==='clean_wait')cq--;if(c===27&&cq>0&&x.t>3000){tf=x.t;break;}}}
const sn=M.stateAt(tr,tf);const cw=Object.keys(sn.states).filter(k=>sn.states[k]==='clean_wait').map(k=>k.slice(5))[0];
out.full=M.requestTransition(sn,'mask',cw,'cleaning').kind;const st=Object.keys(sn.states).filter(k=>sn.states[k]==='stock'&&k.startsWith('mask:')).map(k=>k.slice(5))[0];
out.notab=M.requestTransition(sn,'mask',st,'held').kind;const iu=Object.keys(sn.states).filter(k=>sn.states[k]==='in_use'&&k.startsWith('mask:')).map(k=>k.slice(5))[0];out.scrap=M.requestTransition(sn,'mask',iu,'scrapped').kind;
const xs=tr.find(x=>x.entity==='mask'&&x.to==='to_stock'),sn2=M.stateAt(tr,xs.t);out.ok=M.requestTransition(sn2,'mask',xs.id,'stock').ok;console.log(JSON.stringify(out))"""
_rq = json.loads(subprocess.run([_node, '-e', _REQ % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
chk('ESTC 전이 요청 판정: 세정기 27장 가득이면 가드 실패, 표에 없는 전이는 거절, 폐기는 사람 승인 요구, 시간 조건만 있는 전이는 허용', _rq == {'full': 'guard_fail', 'notab': 'not_in_table', 'scrap': 'needs_human', 'ok': True}, f'{_rq}')
# 시드 1~200 분포: 핵심 지표 네 개
_ESD = r"""const M=require(%s);const out=[];for(let sd=1;sd<=200;sd++){const s=M.simulateLoss({trace:true,seed:sd}),c=M.caseRecords(s),m=M.estcMetrics(s,c),r=M.estcCheck(s.transitions,{end:s.end});out.push(Object.assign({sd:sd,viol:r.violations.length},m));}
const s0=M.simulateLoss({trace:true}),c0=M.caseRecords(s0);console.log(JSON.stringify({d:out,def:M.estcMetrics(s0,c0)}))"""
_ed = json.loads(subprocess.run([_node, '-e', _ESD % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
_ek = ['held_frac', 'wait_frac', 'wait_jc', 'qmask_recur']; _en = ['마스크 한 바퀴 중 짝 대기 비율', '세정 대기 비율', '잡 체인지 대기 건수(60일)', 'Q-MASK 사례 재불량 비율']
_ea = {k: np.array([x[k] for x in _ed['d']], float) for k in _ek + ['qmask_cases', 'viol']}
_epct = {k: float(((_ea[k] < _ed['def'][k]).sum() + 0.5 * (_ea[k] == _ed['def'][k]).sum()) / 200) for k in _ek}
chk('ESTC 시드 1~200 분포: 시드마다 estcCheck 위반 0, 핵심 지표 네 개가 모두 양수 분포(짝 대기·세정 대기 비율 > 0, 잡 체인지 대기 건수 > 0)', int(_ea['viol'].sum()) == 0 and (_ea['held_frac'] > 0).all() and (_ea['wait_frac'] > 0).all() and (_ea['wait_jc'] > 0).all(),
    ' · '.join(f'{n} 중앙값 {np.median(_ea[k]):.4g} (10~90%: {np.quantile(_ea[k], .1):.4g}~{np.quantile(_ea[k], .9):.4g})' for k, n in zip(_ek, _en)))
chk('ESTC 기본 시드(20261011) 백분위 기록: 지표 네 개의 시드 1~200 분포 속 위치(10~90% 밖이면 본문은 분포 숫자로 씀)', True,
    ' · '.join(f'{n} {_ed["def"][k]:.4g} → {_epct[k]*100:.0f}%' for k, n in zip(_ek, _en)) + f' · Q-MASK 사례 수 기본 {_ed["def"]["qmask_cases"]} / 분포 중앙값 {np.median(_ea["qmask_cases"]):.0f}')

# 0206 페이지의 Python 블록: 그대로 실행한 출력이 페이지에 적힌 출력과 같고, 코드 속 사례 기록이 JS 대표 사건과 같다
import html as _html, re as _re, tempfile as _tf
_pg = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'labs', '0206-process-state-model.html'), encoding='utf-8').read()
_code = _html.unescape(_re.search(r'<pre id="pyCode">(.*?)</pre>', _pg, _re.S).group(1)); _outp = _html.unescape(_re.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg, _re.S).group(1)).strip()
with _tf.TemporaryDirectory() as _td:
    shutil.copy(os.path.join(D, 'mask_transitions.csv'), _td); open(os.path.join(_td, 'lab0206.py'), 'w', encoding='utf-8').write(_code)
    _run = subprocess.run([sys.executable, '-I', 'lab0206.py'], cwd=_td, capture_output=True, text=True)
chk('0206 페이지의 Python 블록을 CSV 에 그대로 실행한 출력 = 페이지에 적힌 출력', _run.returncode == 0 and _run.stdout.strip() == _outp, f'종료 {_run.returncode} · 출력 {len(_run.stdout.splitlines())}줄' + ('' if _run.stdout.strip() == _outp else ' · 다름: ' + _run.stdout.strip()[:200]))
_lit = json.loads(_re.search(r'json\.loads\("""(.*?)"""\)', _code, _re.S).group(1)); _fc = json.loads(subprocess.run([_node, '-e', "const M=require(%s);const s=M.simulateLoss({trace:true});console.log(JSON.stringify(M.featuredCase(M.caseRecords(s))))" % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
chk('0206 Python 블록 속 사례 기록 = JS featuredCase, 표(TABLE) = JS ESTC 전이 표 전체', _lit == _fc and sorted(l.split()[:3] for l in _re.search(r'TABLE = """(.*?)"""', _code, _re.S).group(1).strip().splitlines()) == sorted([x['entity'], x['from'], x['to']] for x in _est['estc']['transitions']), f"사례 {_fc['case_id']} · 표 {len(_est['estc']['transitions'])}줄")

# ============================================================
# S10 (0301) — PPA 벡터장: 성분 일곱 묶음·열 단면·튀는 점·짝/문항 규칙을 Python 으로 독립 구현해 시드 1~200 전부 JS 와 대조한다
# ============================================================
_S10_EXPORT = r"""const M=require(%s);const T=M.s10tools;const out=[];
for(let sd=1;sd<=200;sd++){const S=M.scenario('S10',{seed:sd});
 out.push({seed:sd,spec:S.spec,pair:S.pair,quiz:S.quiz,bad:S.bad,miss:S.miss_metric,caught:S.caught_col,false_col:S.false_col,n_good:S.n_good,defect:S.defect,
  items:S.items.map(it=>({id:it.mask_id,turn:it.turn,git:it.glass_in_turn,temp:it.chamber_temp,dom:it.dominant,bad:it.bad_stick,
   c:{Tx:it.truth.Tx,Ty:it.truth.Ty,theta:it.truth.theta,Mx:it.truth.Mx,My:it.truth.My,K:it.truth.K,Cx:it.truth.Cx,Cy:it.truth.Cy,so:it.truth.stick_off,sp:it.truth.stick_pitch,df:it.truth.defects},
   dx:it.grid.map(g=>g.dx_um),dy:it.grid.map(g=>g.dy_um),met:it.metric,share:it.share,colz:it.col.z,colf:it.col.flagged,ptf:it.pts.flagged.map(f=>[f.px,f.py]),
   fld:sd===%d?M.ppaField(it.truth).map(q=>[q.dx,q.dy]):null}))});}
console.log(JSON.stringify(out))"""
_s10def = json.loads(subprocess.run([_node, '-e', "console.log(require(%s).SEEDS.S10)" % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
_S10 = json.loads(subprocess.run([_node, '-e', _S10_EXPORT % (json.dumps(_mf), _s10def)], capture_output=True, text=True, check=True).stdout)
_X10 = -750 + 150 * np.tile(np.arange(11), 7); _Y10 = -462.5 + (925 / 6) * np.repeat(np.arange(7), 11); _PX10 = np.tile(np.arange(11), 7); _PY10 = np.repeat(np.arange(7), 11)
_CK = ['trans', 'rot', 'mag', 'ortho', 'high', 'stick', 'local']
def py10_parts(c):                      # 성분 일곱 묶음 (77,2) — 행렬식으로 따로 구현
    z = np.zeros(77); xm, ym = _X10 / 1000, _Y10 / 1000; so = np.array(c['so'])[_PX10]; sp = np.array(c['sp'])[_PX10]
    loc = np.zeros((77, 2))
    for d in c['df']: loc[d['py'] * 11 + d['px']] += [d['dx'], d['dy']]
    return {'trans': np.c_[z + c['Tx'], z + c['Ty']], 'rot': np.c_[-c['theta'] * _Y10 / 1000, c['theta'] * _X10 / 1000], 'mag': np.c_[c['Mx'] * _X10 / 1000, c['My'] * _Y10 / 1000],
            'ortho': np.c_[c['K'] * _Y10 / 1000, z], 'high': np.c_[c['Cx'] * xm * ym, c['Cy'] * xm * xm], 'stick': np.c_[so, sp * _Y10 / 1000], 'local': loc}
def py10_shares(c):
    P = py10_parts(c); ss = {k: float((P[k] ** 2).sum()) for k in _CK}; t = sum(ss.values()); sh = {k: ss[k] / t for k in _CK}
    return P, sh, max(_CK, key=lambda k: (sh[k], -_CK.index(k)))
def py10_col(dx, thr=3.5):
    cm = np.array(dx).reshape(7, 11).mean(0); pred = np.empty(11); pred[1:-1] = (cm[:-2] + cm[2:]) / 2; pred[0] = 2 * cm[1] - cm[2]; pred[-1] = 2 * cm[-2] - cm[-3]
    r = (cm - pred) / np.sqrt(np.r_[6, np.full(9, 1.5), 6]); md = np.median(r); sc = 1.4826 * np.median(np.abs(r - md)); z = (r - md) / sc
    return z, [int(i) for i in np.where(np.abs(z) >= thr)[0]]
def py10_pts(dx, dy, thr=4):
    gx, gy = np.array(dx).reshape(7, 11), np.array(dy).reshape(7, 11); rx = np.zeros((7, 11)); ry = np.zeros((7, 11))
    for i in range(7):
        for j in range(11):
            nb = [(a, b) for a in range(max(0, i - 1), min(7, i + 2)) for b in range(max(0, j - 1), min(11, j + 2)) if (a, b) != (i, j)]
            rx[i, j] = gx[i, j] - np.median([gx[a, b] for a, b in nb]); ry[i, j] = gy[i, j] - np.median([gy[a, b] for a, b in nb])
    def rz(r): md = np.median(r); return (r - md) / (1.4826 * np.median(np.abs(r - md)))
    zm = np.maximum(np.abs(rz(rx)), np.abs(rz(ry))); return [[int(j), int(i)] for i in range(7) for j in range(11) if zm[i, j] >= thr]
_tot10 = {'fld': 0, 'recon': 0, 'met': 0, 'sh': 0, 'colz': 0, 'colf': 0, 'ptf': 0, 'spec': 0, 'pair': 0, 'quiz': 0, 'dom': 0, 'agg': 0, 'noise': []}; _per10 = []
for X in _S10:
    its = X['items']; met10 = []; dom10 = []; sh10 = []
    for it in its:
        P, sh, dom = py10_shares(it['c']); tot = sum(P.values())                          # 일곱 묶음의 합
        dxy = np.c_[it['dx'], it['dy']]
        c = it['c']; xm, ym = _X10 / 1000, _Y10 / 1000                                      # 묶음 없이 한 식으로 쓴 전체 장(성분 합 재구성 오차 비교용)
        whole = np.c_[c['Tx'] - c['theta'] * _Y10 * 1e-3 + c['Mx'] * _X10 * 1e-3 + c['K'] * _Y10 * 1e-3 + c['Cx'] * xm * ym + np.array(c['so'])[_PX10],
                      c['Ty'] + c['theta'] * _X10 * 1e-3 + c['My'] * _Y10 * 1e-3 + c['Cy'] * xm * xm + np.array(c['sp'])[_PX10] * _Y10 * 1e-3]
        for d in c['df']: whole[d['py'] * 11 + d['px']] += [d['dx'], d['dy']]
        _tot10['recon'] = max(_tot10['recon'], float(np.abs(tot - whole).max()))
        if it['fld'] is not None: _tot10['fld'] = max(_tot10['fld'], float(np.abs(np.array(it['fld']) - whole).max())); _tot10['noise'].append(dxy - whole)
        dxm = np.array(it['dx']); dym = np.array(it['dy'])
        mdx = abs(dxm.mean()) + 3 * dxm.std(ddof=1); mdy = abs(dym.mean()) + 3 * dym.std(ddof=1); met10.append(mdx)
        _tot10['met'] = max(_tot10['met'], abs(mdx - it['met']['dx_metric']), abs(mdy - it['met']['dy_metric']))
        _tot10['sh'] = max(_tot10['sh'], max(abs(sh[k] - it['share'][k]) for k in _CK)); _tot10['dom'] += (dom != it['dom'])
        z, f = py10_col(it['dx']); _tot10['colz'] = max(_tot10['colz'], float(np.abs(z - np.array(it['colz'])).max())); _tot10['colf'] += (f != it['colf'])
        _tot10['ptf'] += (py10_pts(it['dx'], it['dy']) != it['ptf']); dom10.append(dom); sh10.append(sh)
    good = [m for m, it in zip(met10, its) if it['bad'] < 0]; spec = float(np.quantile(good, 0.95)); _tot10['spec'] = max(_tot10['spec'], abs(spec - X['spec']))
    best = None                                                                          # 짝 규칙
    for i in range(72):
        for j in range(i + 1, 72):
            if dom10[i] == dom10[j] or (met10[i] <= spec) != (met10[j] <= spec): continue
            d = abs(met10[i] - met10[j])
            if best is None or d < best[0]: best = (d, i, j)
    _tot10['pair'] += not (best and (best[1], best[2]) == (X['pair']['i'], X['pair']['j']) and abs(best[0] - X['pair']['diff']) < 1e-9)
    used = {best[1], best[2]}; qz = []                                                   # 문항 규칙
    for k in _CK:
        bi = max((i for i in range(72) if i not in used), key=lambda i: (sh10[i][k], -i)); used.add(bi); qz.append((k, bi, sh10[bi][k]))
    _tot10['quiz'] += not all(a[0] == b['comp'] and a[1] == b['i'] and abs(a[2] - b['share']) < 1e-9 for a, b in zip(qz, X['quiz']))
    badi = [i for i, it in enumerate(its) if it['bad'] >= 0]; mi = [i for i in badi if met10[i] <= spec]; ci = [i for i in mi if its[i]['bad'] in its[i]['colf']]
    fc = sum(1 for it in its if it['bad'] < 0 and it['colf']); _tot10['agg'] += 0 if (badi, mi, ci, fc) == (X['bad'], X['miss'], X['caught'], X['false_col']) else 1
    nd = [it for it in its if it['c']['df']]; fnd = sum(1 for it in nd if [it['c']['df'][0]['px'], it['c']['df'][0]['py']] in it['ptf'])
    _per10.append({'nbad': len(badi), 'miss': len(mi), 'caught': len(ci), 'fc': fc, 'found': fnd, 'spec': spec, 'mixed': sum(q[2] < 0.5 for q in qz), 'ndef': len(nd), 'defin': sum(1 for it, m in zip(its, met10) if it['c']['df'] and m <= spec),
                   'pairdiff': best[0], 'ngood': len(good)})
_nz = np.concatenate([n.ravel() for n in _tot10['noise']])
chk('S10 성분 일곱 묶음의 합 = 한 식으로 쓴 전체 장(마스크 72장 × 시드 1~200, 최대 오차 < 1e-9) · JS ppaField 와도 같음', _tot10['recon'] < 1e-9 and _tot10['fld'] < 1e-9, f'묶음 합 오차 최대 {_tot10["recon"]:.1e} · ppaField 오차 {_tot10["fld"]:.1e}')
chk('S10 측정값 − 잡음 없는 장 = 측정 잡음(대표 시드 72장 × 154값, 평균 ≈ 0, σ ≈ 0.25)', abs(_nz.mean()) < 0.01 and abs(_nz.std() - 0.25) < 0.01, f'평균 {_nz.mean():+.4f} · σ {_nz.std():.4f} · n={_nz.size}')
chk('S10 JS 와 Python 일치: |평균|+3σ 지표(dx·dy)·성분 몫·주된 성분·spec(불량 스틱 없는 마스크 지표의 95 백분위)·불량/놓침/잡음 집계', _tot10['met'] < 1e-9 and _tot10['sh'] < 1e-9 and _tot10['dom'] == 0 and _tot10['spec'] < 1e-9 and _tot10['agg'] == 0, f'지표 {_tot10["met"]:.1e} · 몫 {_tot10["sh"]:.1e} · 주된 성분 불일치 {_tot10["dom"]} · spec {_tot10["spec"]:.1e} · 집계 불일치 {_tot10["agg"]}')
chk('S10 JS 와 Python 일치: 열 단면 z(최대 오차)·표시된 열·튀는 점 표시(시드 200 × 72장)', _tot10['colz'] < 1e-9 and _tot10['colf'] == 0 and _tot10['ptf'] == 0, f'z 오차 {_tot10["colz"]:.1e} · 열 표시 불일치 {_tot10["colf"]} · 점 표시 불일치 {_tot10["ptf"]}')
chk('S10 짝 규칙(판정이 같고 주된 성분이 다른 짝 중 |지표 차| 최소)·문항 규칙(성분 몫 최대)을 Python 이 다시 풀어 200개 시드 모두 JS 와 같은 짝·같은 일곱 유리', _tot10['pair'] == 0 and _tot10['quiz'] == 0, f'짝 불일치 {_tot10["pair"]} · 문항 불일치 {_tot10["quiz"]}')
_pd = lambda k: np.array([r[k] for r in _per10], float); _q3 = lambda a: f'{np.median(a):.3g} (10~90%: {np.quantile(a, .1):.3g}~{np.quantile(a, .9):.3g})'
_nb10 = _pd('nbad'); _mr = _pd('miss') / _nb10
chk('S10 분포(시드 200): 불량 스틱 마스크가 모든 시드에 있고(최소 1), 지표(spec 안)만 보면 놓치는 비율의 중앙값 > 0 — 설계서 기대 성립', _nb10.min() >= 1 and np.median(_mr) > 0, f'불량 스틱 마스크 {_q3(_nb10)}장 · 놓친 수 {_q3(_pd("miss"))} · 놓치는 비율 {_q3(_mr)}')
_cr = _pd('caught') / np.maximum(_pd('miss'), 1)
chk('S10 분포: 지표가 놓친 불량 스틱 가운데 열 단면(z ≥ 3.5)이 잡는 수는 평균 > 0 이지만 대부분을 잡지는 못함(중앙값 비율 < 0.5) · 열 단면이 정상 마스크에 헛표시하는 마스크 수 > 0', _pd('caught').mean() > 0 and np.median(_cr) < 0.5 and _pd('fc').mean() > 0,
    f'잡은 수 {_q3(_pd("caught"))} · 놓친 것 중 잡은 비율 {_q3(_cr)} · 헛표시 마스크 {_q3(_pd("fc"))}/약 {_pd("ngood").mean():.0f}장')
chk('S10 분포: 국소 결함 마스크 대부분은 지표가 spec 안(중앙값 비율 > 0.8)인데 튀는 점 찾기(z ≥ 4)는 그 점을 중앙값 60% 이상 찾음', np.median(_pd('defin') / _pd('ndef')) > 0.8 and np.median(_pd('found') / _pd('ndef')) >= 0.6,
    f'결함 마스크 {_q3(_pd("ndef"))}장 · 지표 spec 안 비율 {_q3(_pd("defin") / _pd("ndef"))} · 찾은 비율 {_q3(_pd("found") / _pd("ndef"))}')
_qs = np.array([[q['share'] for q in X['quiz']] for X in _S10])
chk('S10 분포: 문항 몫 — 평행이동·배율·스틱 문항은 몫 중앙값 ≥ 0.5, 직교도·고차 문항은 가장 큰 유리도 몫 중앙값 < 0.5(섞인 맵으로 표시되는 것이 정상)', np.median(_qs[:, [0, 2, 5]], axis=0).min() >= 0.5 and np.median(_qs[:, [3, 4]], axis=0).max() < 0.5,
    '성분별 문항 몫 중앙값 ' + ' · '.join(f'{k} {np.median(_qs[:, i])*100:.0f}%' for i, k in enumerate(_CK)))
_ms10 = ['nbad', 'miss', 'caught', 'fc', 'found', 'spec', 'mixed']; _nm10 = ['불량 스틱 마스크 수', '지표가 놓친 수', '열 단면이 잡은 수', '열 단면 헛표시 마스크 수', '튀는 점이 찾은 결함 수', 'spec(µm)', '섞인 문항 수']
def _rk10(m, i): a = _pd(m); return float(((a < a[i]).sum() + 0.5 * (a == a[i]).sum()) / len(a))
_sum10 = np.array([sum(abs(_rk10(m, i) * 100 - 50) for m in _ms10) for i in range(200)])
chk('S10 대표 시드: 기본 시드는 일곱 지표 백분위의 Σ|백분위−50| 이 가장 작은 시드이고, 일곱 지표가 모두 시드 1~200 분포의 25~75% 안', int(np.argmin(_sum10)) + 1 == _s10def and all(0.25 <= _rk10(m, _s10def - 1) <= 0.75 for m in _ms10),
    f'시드 {_s10def}(Σ {_sum10[_s10def-1]:.1f}): ' + ' · '.join(f'{n} {_per10[_s10def-1][m]:.4g}→{_rk10(m, _s10def - 1)*100:.0f}%' for m, n in zip(_ms10, _nm10)))
_c10 = rd('ppa_s10.csv'); _Z0 = _S10[_s10def - 1]['items']
_cdx = _c10.dx_um.to_numpy().reshape(72, 77); _jdx = np.array([it['dx'] for it in _Z0]); _cdy = _c10.dy_um.to_numpy().reshape(72, 77); _jdy = np.array([it['dy'] for it in _Z0])
chk('S10 ppa_s10.csv: 72장 × 77점, 값이 JS 대표 시드와 0.0001 이내, 마스크 id 순서·불량 스틱 정답 열 일치', len(_c10) == 5544 and float(np.abs(_cdx - _jdx).max()) < 6e-5 and float(np.abs(_cdy - _jdy).max()) < 6e-5 and list(_c10.mask_id.iloc[::77]) == [it['id'] for it in _Z0] and list(_c10.bad_stick.iloc[::77]) == [it['bad'] for it in _Z0],
    f'최대 차 {max(float(np.abs(_cdx - _jdx).max()), float(np.abs(_cdy - _jdy).max())):.1e} · 열 {len(_c10.columns)}개')

# 0301 페이지의 Python 블록: 그대로 실행한 출력 = 페이지에 적힌 출력, 출력의 숫자 = JS 대표 시드의 값(두 유리 지표·spec·불량 스틱 집계·튀는 점 찾기 집계)
import html as _html2, re as _re2, tempfile as _tf2
_pg3 = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'labs', '0301-ppa-vector-field.html'), encoding='utf-8').read()
_code3 = _html2.unescape(_re2.search(r'<pre id="pyCode">(.*?)</pre>', _pg3, _re2.S).group(1)); _out3 = _html2.unescape(_re2.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg3, _re2.S).group(1)).strip()
with _tf2.TemporaryDirectory() as _td3:
    shutil.copy(os.path.join(D, 'ppa_s10.csv'), _td3); open(os.path.join(_td3, 'lab0301.py'), 'w', encoding='utf-8').write(_code3)
    _run3 = subprocess.run([sys.executable, '-I', 'lab0301.py'], cwd=_td3, capture_output=True, text=True)
chk('0301 페이지의 Python 블록을 CSV 에 그대로 실행한 출력 = 페이지에 적힌 출력', _run3.returncode == 0 and _run3.stdout.strip() == _out3, f'종료 {_run3.returncode} · 출력 {len(_run3.stdout.splitlines())}줄' + ('' if _run3.stdout.strip() == _out3 else ' · 다름: ' + _run3.stdout.strip()[:200]))
_X0 = _S10[_s10def - 1]; _pr = _X0['pair']; _ia, _ib = _X0['items'][_pr['i']], _X0['items'][_pr['j']]; _p0 = _per10[_s10def - 1]
_exp3 = [f"{_ia['id']}", f"dx 지표 {_ia['met']['dx_metric']:.3f} · dy 지표 {_ia['met']['dy_metric']:.3f}", f"{_ib['id']}", f"dx 지표 {_ib['met']['dx_metric']:.3f} · dy 지표 {_ib['met']['dy_metric']:.3f}",
         f"spec {_p0['spec']:.3f} · 불량 스틱 {_p0['nbad']}장 · 지표가 spec 안 {_p0['miss']}장 · 그중 열 단면이 짚음 {_p0['caught']}장 · 정상인데 열 단면이 표시 {_p0['fc']}장",
         f"국소 결함이 있는 유리 {_p0['ndef']}장 · 튀는 점 찾기가 그 점을 짚음 {_p0['found']}장"]
chk('0301 Python 출력의 숫자 = JS 대표 시드(두 유리 지표·spec·불량 스틱·열 단면·튀는 점 집계)와 소수 셋째 자리까지 일치, 코드 속 유리 번호 = JS 짝', all(e in _run3.stdout for e in _exp3) and f'A, B = "S10-{_s10def}-{_ia["id"]}", "S10-{_s10def}-{_ib["id"]}"' in _code3, ' · '.join(_exp3[:2]))

# ============================================================
# S10 (0302) — 성분 분해(최소제곱): 설계 행렬·최소제곱·표준오차·단순 평균법·점 누락 프리셋·식별(rank)을 numpy 로 독립 구현해 시드 1~200 × 72장을 JS 와 대조
# ============================================================
_T2_EXPORT = r"""const M=require(%s);const T=M.s10tools;const out=[];
for(let sd=1;sd<=200;sd++){const S=M.scenario('S10',{seed:sd});const sm=T.fitSummary(S);
 out.push({seed:sd,spec:S.spec,items:S.items.map((it,i)=>{const f=T.fit(it.grid),pf=M.ppaFit(it.grid),l4=T.fit(it.grid,{terms:T.CORR_TERMS}),nv=T.naive(it.grid),pre={};
  Object.keys(T.PRESETS).forEach(k=>{const ex=T.PRESETS[k];pre[k]={l4:T.fit(it.grid,{terms:T.CORR_TERMS,exclude:ex}).coef,nv:T.naive(it.grid,ex).coef};});
  const s=sm.items[i];
  return {coef:f.coef,se:f.se,sk:f.se_known,rss:f.rss,n:f.n,p:f.p,pf:pf,l4:l4.coef,nv:nv.coef,pre:pre,mm:s.metric_meas,ma:s.metric_align,mx:s.metric_all,colr:s.col_flag_resid,
   rs:f.resid.map(g=>[g.dx_um,g.dy_um]),fit:f.fitted.map(g=>[g.dx_um,g.dy_um])};})});}
const S0=M.scenario('S10');
const stick=S0.items.map(it=>{const r={};['none','sum0','ends'].forEach(c=>{const q=T.stickFit(it.grid,c);r[c]={p:q.p,rank:q.rank,def:q.deficiency,rc:q.rank_with_constraints,coef:q.coef||null,off:q.offsets||null};});return r;});
const idn=T.stickFit(S0.items[0].grid,'none');
console.log(JSON.stringify({seeds:out,stick:stick,presets:T.PRESETS}))"""
_T2 = json.loads(subprocess.run([_node, '-e', _T2_EXPORT % json.dumps(_mf)], capture_output=True, text=True, check=True, env=dict(os.environ, NODE_OPTIONS='--max-old-space-size=4096')).stdout)
_CO = ['Tx', 'Ty', 'theta', 'Mx', 'My', 'K', 'Cx', 'Cy']
_TERM_C = {'T': ['Tx', 'Ty'], 'rot': ['theta'], 'mag': ['Mx', 'My'], 'ortho': ['K'], 'high': ['Cx', 'Cy']}
_xm10, _ym10 = _X10 / 1000, _Y10 / 1000
_DXC = {'Tx': np.ones(77), 'Ty': np.zeros(77), 'theta': -_ym10, 'Mx': _xm10, 'My': np.zeros(77), 'K': _ym10, 'Cx': _xm10 * _ym10, 'Cy': np.zeros(77)}
_DYC = {'Tx': np.zeros(77), 'Ty': np.ones(77), 'theta': _xm10, 'Mx': np.zeros(77), 'My': _ym10, 'K': np.zeros(77), 'Cx': np.zeros(77), 'Cy': _xm10 ** 2}
def py2_names(terms): return [c for c in _CO if any(c in _TERM_C[t] for t in terms)]
def py2_X(names, keep): return np.vstack([np.column_stack([_DXC[c] for c in names])[keep], np.column_stack([_DYC[c] for c in names])[keep]])
def py2_fit(dx, dy, terms, keep=None):
    keep = np.arange(77) if keep is None else np.asarray(keep); nm = py2_names(terms); X = py2_X(nm, keep); y = np.r_[np.asarray(dx)[keep], np.asarray(dy)[keep]]
    b = np.linalg.lstsq(X, y, rcond=None)[0]; r = y - X @ b; rss = float(r @ r); G = np.linalg.inv(X.T @ X); sg = np.sqrt(rss / (len(y) - len(nm)))
    return dict(zip(nm, b)), dict(zip(nm, sg * np.sqrt(np.diag(G)))), dict(zip(nm, 0.25 * np.sqrt(np.diag(G)))), rss, X
def py2_naive(dx, dy, keep=None):
    keep = np.arange(77) if keep is None else np.asarray(keep); x, y, a, b = _xm10[keep], _ym10[keep], np.asarray(dx)[keep], np.asarray(dy)[keep]
    th = (x * b).sum() / (x * x).sum(); return {'Tx': a.mean(), 'Ty': b.mean(), 'theta': th, 'Mx': (x * a).sum() / (x * x).sum(), 'My': (y * b).sum() / (y * y).sum(), 'K': (y * a).sum() / (y * y).sum() + th}
def py2_field(co):
    g = lambda k: co.get(k, 0.0)
    return np.c_[g('Tx') - g('theta') * _ym10 + g('Mx') * _xm10 + g('K') * _ym10 + g('Cx') * _xm10 * _ym10, g('Ty') + g('theta') * _xm10 + g('My') * _ym10 + g('Cy') * _xm10 ** 2]
def py2_err(co, truth):
    d = py2_field({k: co[k] for k in ['Tx', 'Ty', 'theta', 'Mx', 'My', 'K']}) - py2_field({k: truth[k] for k in ['Tx', 'Ty', 'theta', 'Mx', 'My', 'K']}); return float(np.sqrt((d ** 2).sum() / 77))
def py2_metric(dx, dy): return abs(np.mean(dx)) + 3 * np.std(dx, ddof=1)
_pre_keep = {k: np.array([i for i in range(77) if i not in set(v)]) for k, v in _T2['presets'].items()}
_t2 = {'coef': 0.0, 'se': 0.0, 'sk': 0.0, 'rss': 0.0, 'pf': 0.0, 'l4': 0.0, 'nv': 0.0, 'nveq': 0.0, 'pre': 0.0, 'met': 0.0, 'res': 0.0, 'colr': 0}
_rows2 = []                                                                              # 시드마다 한 줄(대표 시드 백분위·분포용)
_ratio_all = {c: [] for c in _CO}; _rat_my_bad = []; _share = {k: [] for k in _pre_keep}; _symdiff = 0.0; _asym = {k: [] for k in _pre_keep}
for X2, XS in zip(_T2['seeds'], _S10):
    sd_ = X2['seed']; errs = {c: [] for c in _CO}; errg = {c: [] for c in _CO}; errb = {c: [] for c in _CO}; rat = {c: [] for c in _CO}
    ma, mx_, mm_ = [], [], []; e4 = []; pr_l = {k: [] for k in _pre_keep}; pr_n = {k: [] for k in _pre_keep}
    for it, jt in zip(XS['items'], X2['items']):
        dx, dy = np.array(it['dx']), np.array(it['dy']); cf, se, sk, rss, _X = py2_fit(dx, dy, ['T', 'rot', 'mag', 'ortho', 'high'])
        _t2['coef'] = max(_t2['coef'], max(abs(cf[c] - jt['coef'][c]) for c in _CO)); _t2['se'] = max(_t2['se'], max(abs(se[c] - jt['se'][c]) for c in _CO)); _t2['sk'] = max(_t2['sk'], max(abs(sk[c] - jt['sk'][c]) for c in _CO)); _t2['rss'] = max(_t2['rss'], abs(rss - jt['rss']))
        pf = jt['pf']; _t2['pf'] = max(_t2['pf'], abs(cf['Tx'] - pf['Tx']), abs(cf['Ty'] - pf['Ty']), abs(cf['Mx'] - pf['Mx']), abs(cf['My'] - pf['My']), abs(cf['Cx'] - pf['Cx']), abs(cf['Cy'] - pf['Cy']), abs(cf['theta'] - pf['theta']), abs(cf['K'] - (pf['K_minus_theta'] + pf['theta'])))
        l4, _, _, _, _ = py2_fit(dx, dy, ['T', 'rot', 'mag', 'ortho']); nv = py2_naive(dx, dy)
        _t2['l4'] = max(_t2['l4'], max(abs(l4[c] - jt['l4'][c]) for c in l4)); _t2['nv'] = max(_t2['nv'], max(abs(nv[c] - jt['nv'][c]) for c in nv)); _t2['nveq'] = max(_t2['nveq'], max(abs(nv[c] - l4[c]) for c in nv))
        tr = it['c']; tr = dict(tr, theta=tr['theta'])
        for c in _CO: e_ = cf[c] - tr[c]; errs[c].append(e_); (errb if it['bad'] >= 0 else errg)[c].append(e_); rat[c].append(abs(e_) / sk[c])
        if it['bad'] >= 0: _rat_my_bad.append(abs(cf['My'] - tr['My']) / sk['My'])
        fld = py2_field(cf); rs = np.c_[dx, dy] - fld; _t2['res'] = max(_t2['res'], float(np.abs(rs - np.array(jt['rs'])).max()), float(np.abs(fld - np.array(jt['fit'])).max()))
        al = np.c_[dx, dy] - py2_field({k: cf[k] for k in ['Tx', 'Ty', 'theta']}); m1, m2, m3 = py2_metric(dx, dy), py2_metric(al[:, 0], al[:, 1]), py2_metric(rs[:, 0], rs[:, 1])
        _t2['met'] = max(_t2['met'], abs(m1 - jt['mm']), abs(m2 - jt['ma']), abs(m3 - jt['mx'])); ma.append(m2); mx_.append(m3); mm_.append(m1)
        _t2['colr'] += (py10_col(list(rs[:, 0]))[1] != jt['colr'])
        e4.append(py2_err(l4, tr))
        for k, kp in _pre_keep.items():
            pl, _, _, _, _ = py2_fit(dx, dy, ['T', 'rot', 'mag', 'ortho'], kp); pn = py2_naive(dx, dy, kp)
            _t2['pre'] = max(_t2['pre'], max(abs(pl[c] - jt['pre'][k]['l4'][c]) for c in pl), max(abs(pn[c] - jt['pre'][k]['nv'][c]) for c in pn))
            pr_l[k].append(py2_err(pl, tr)); pr_n[k].append(py2_err(pn, tr))
            if k == 'corners': _symdiff = max(_symdiff, max(abs(pl[c] - pn[c]) for c in pn))
    for c in _CO: _ratio_all[c].extend(rat[c])
    for k in _pre_keep: _share[k].append(float(np.mean(np.array(pr_l[k]) < np.array(pr_n[k])))); _asym[k].append(float(np.median(np.array(pr_n[k]) - np.array(pr_l[k]))))
    tol = 0.25
    _rows2.append({'tx_sd': float(np.std(errs['Tx'], ddof=1)), 'mx_sd': float(np.std(errs['Mx'], ddof=1)), 'my_bad': float(np.std(errb['My'], ddof=1)) if len(errb['My']) > 1 else float('nan'), 'my_good': float(np.std(errg['My'], ddof=1)),
                   'rtx': float(np.median(rat['Tx'])), 'rmx': float(np.median(rat['Mx'])), 'rmy': float(np.median(rat['My'])), 'm_meas': float(np.median(mm_)), 'm_align': float(np.median(ma)), 'm_all': float(np.median(mx_)),
                   'share_r': _share['right_col'][-1], 'over_l': int(np.sum(np.array(pr_l['right_col']) > tol)), 'over_n': int(np.sum(np.array(pr_n['right_col']) > tol)), 'over_full': int(np.sum(np.array(e4) > tol))})
chk('0302 최소제곱: numpy lstsq 로 독립 재현한 계수 8개·표준오차(σ̂ 기반·CFG.NOISE 기반)·잔차제곱합이 JS 와 1e-9 이내(시드 1~200 × 72장 = 14400장)', max(_t2['coef'], _t2['se'], _t2['sk']) < 1e-9 and _t2['rss'] < 1e-8, f'계수 {_t2["coef"]:.1e} · 표준오차 {_t2["se"]:.1e}·{_t2["sk"]:.1e} · 잔차제곱합 {_t2["rss"]:.1e}')
chk('0302 JS 의 모델이 그린 장·잔차 154값이 numpy 와 같고, 잔차에 한 열 단면 표시가 JS 와 같으며, T·회전만 뺀 지표·전부 뺀 잔차 지표도 일치', _t2['res'] < 1e-9 and _t2['met'] < 1e-9 and _t2['colr'] == 0, f'장·잔차 {_t2["res"]:.1e} · 지표 {_t2["met"]:.1e} · 열 표시 불일치 {_t2["colr"]}')
chk('0302 전부 항 최소제곱 = 기존 ppaFit (K = K_minus_theta + theta 포함, 1e-9)', _t2['pf'] < 1e-9, f'최대 차 {_t2["pf"]:.1e}')
chk('0302 단순 평균법(독립 구현)이 JS 와 일치하고, 온전한 격자에서는 [T·회전·배율·직교도] 최소제곱과 같음(1e-9)', _t2['nv'] < 1e-9 and _t2['l4'] < 1e-9 and _t2['nveq'] < 1e-9, f'JS 일치 {_t2["nv"]:.1e} · 최소제곱 4항 일치 {_t2["l4"]:.1e} · 단순 평균법 − 최소제곱 {_t2["nveq"]:.1e}')
_sh = {k: np.array(v) for k, v in _share.items()}; _as = {k: np.array(v) for k, v in _asym.items()}
chk('0302 점 누락 프리셋(JS 와 numpy 계수 일치 1e-9): 비대칭 누락(오른쪽 끝 열·오른쪽 위 세 점)에서는 단순 평균법과 최소제곱이 달라지고 최소제곱의 오차가 더 작은 유리가 과반(시드별 비율의 중앙값 > 0.5) · 대칭 누락(네 모서리)은 둘이 같음(1e-9)',
    _t2['pre'] < 1e-9 and all(np.median(_sh[k]) > 0.5 for k in ['right_col', 'top_right']) and _symdiff < 1e-9,
    ' · '.join(f'{k}: 최소제곱 오차가 더 작은 유리 비율 {_q3(_sh[k])}, 오차 차(naive−lsq) 중앙값 {np.median(_as[k]):.3f}µm' for k in _sh) + f' · 네 모서리 계수 차 {_symdiff:.1e}')
_ratio_med = {c: float(np.median(_ratio_all[c])) for c in _CO}
chk('0302 오차/표준오차(se_known) 배율(설계서 기대 보정): 스틱이 누설되는 Tx·Mx 는 중앙값 > 2, My 는 불량 스틱 마스크에서만 > 2(전체 중앙값은 2 아래) · 나머지 다섯은 잡음만의 표준오차와 맞음(중앙값 < 1.2, 반정규 분포의 0.67 근처)', all(_ratio_med[c] > 2 for c in ['Tx', 'Mx']) and _ratio_med['My'] < 2 and np.median(_rat_my_bad) > 2 and all(_ratio_med[c] < 1.2 for c in ['Ty', 'theta', 'K', 'Cx', 'Cy']),
    ' · '.join(f'{c} {_ratio_med[c]:.2f}' for c in _CO) + f' · 불량 스틱 마스크의 My {np.median(_rat_my_bad):.2f}(n={len(_rat_my_bad)}) · 전체 8계수 중앙값 {np.median(np.concatenate([_ratio_all[c] for c in _CO])):.2f}')
# 식별: 열마다 상수 11개를 넣으면 계수(rank) 부족, 약속 두 개로 해소, 약속에 따라 평행이동의 뜻이 바뀜(대표 시드 72장 전부)
_idok = True; _dtx = []; _dtxm = []
for jt_s, it in zip(_T2['stick'], _S10[_s10def - 1]['items']):
    dx, dy = np.array(it['dx']), np.array(it['dy']); nm = py2_names(['T', 'rot', 'mag', 'ortho']); Xs = py2_X(nm, np.arange(77)); stk = np.zeros((154, 11)); stk[np.arange(77), _PX10] = 1; Xf = np.hstack([Xs, stk])
    Csum = np.zeros((2, 17)); Csum[0, 6:] = 1; Csum[1, 6:] = _X10[:11] / 1000; Cend = np.zeros((2, 17)); Cend[0, 6] = 1; Cend[1, 16] = 1
    _idok &= (np.linalg.matrix_rank(Xf) == 15 == jt_s['none']['rank'] and jt_s['none']['def'] == 2 and np.linalg.matrix_rank(np.vstack([Xf, Csum])) == 17 and np.linalg.matrix_rank(np.vstack([Xf, Cend])) == 17 and jt_s['sum0']['rc'] == 17 and jt_s['ends']['rc'] == 17)
    y = np.r_[dx, dy]
    for conv, Cm in (('sum0', Csum), ('ends', Cend)):
        Kk = np.block([[Xf.T @ Xf, Cm.T], [Cm, np.zeros((2, 2))]]); sol = np.linalg.solve(Kk, np.r_[Xf.T @ y, np.zeros(2)])
        _idok &= max(abs(sol[i] - jt_s[conv]['coef'][c]) for i, c in enumerate(nm)) < 1e-9 and np.abs(sol[6:17] - np.array(jt_s[conv]['off'])).max() < 1e-9
    c4, _, _, _, _ = py2_fit(dx, dy, ['T', 'rot', 'mag', 'ortho']); _dtx.append(abs(jt_s['sum0']['coef']['Tx'] - c4['Tx'])); _dtxm.append(abs(jt_s['ends']['coef']['Tx'] - c4['Tx']))
chk('0302 식별: 열마다 상수 11개를 더하면 설계 행렬 17열의 계수(rank)가 15 로 2 부족(numpy matrix_rank 와 JS 일치), 약속 두 개(합 0·가로 기울기 0 / 양 끝 열 0)를 걸면 17 로 풀리고 해가 numpy KKT 와 같음 · 합 0 약속의 평행이동은 스틱 열 없이 푼 값과 같고, 양 끝 0 약속은 다름(약속에 따라 평행이동의 뜻이 바뀜)',
    _idok and max(_dtx) < 1e-9 and np.median(_dtxm) > 1e-3, f'72장 모두 rank 15/17 → 17/17 · 합 0 약속 − 스틱 없는 Tx 최대 {max(_dtx):.1e} · 양 끝 0 약속 − 스틱 없는 Tx 중앙값 {np.median(_dtxm):.3f}µm')
# 대표 시드(SEEDS.S10) 백분위: 0302 가 본문에서 말하는 지표
_m2 = ['tx_sd', 'mx_sd', 'my_bad', 'rtx', 'rmx', 'rmy', 'm_meas', 'm_align', 'm_all', 'share_r', 'over_l', 'over_n', 'over_full']
_nm2 = ['Tx 오차 sd', 'Mx 오차 sd', '불량 스틱 My 오차 sd', 'Tx 배율 중앙값', 'Mx 배율 중앙값', 'My 배율 중앙값', '측정 지표 중앙값', 'T·회전 보정 후 중앙값', '전부 뺀 잔차 지표 중앙값', '오른쪽 열 누락에서 최소제곱이 더 나은 유리 비율', '오른쪽 열 누락 최소제곱 허용초과', '오른쪽 열 누락 단순 평균법 허용초과', '전부 격자 허용초과']
_A2 = {m: np.array([r[m] for r in _rows2], float) for m in _m2}
def _rk2(m, i): a = _A2[m]; ok = ~np.isnan(a); a = a[ok]; v = _A2[m][i]; return float(((a < v).sum() + 0.5 * (a == v).sum()) / len(a))
_out2 = [n for m, n in zip(_m2, _nm2) if not 0.25 <= _rk2(m, _s10def - 1) <= 0.75]
chk('0302 대표 시드(SEEDS.S10 = 128 유지): 0302 가 본문에서 말하는 열세 지표의 시드 1~200 백분위를 기록(25~75% 밖의 지표는 본문이 분포로 말해야 함)', all(np.isfinite(_A2[m][_s10def - 1]) for m in _m2),
    '25~75% 밖: ' + (' · '.join(f'{n} {_rk2(m, _s10def-1)*100:.0f}%' for m, n in zip(_m2, _nm2) if n in _out2) or '없음') + ' / 안: ' + ' · '.join(f'{n} {_rk2(m, _s10def-1)*100:.0f}%' for m, n in zip(_m2, _nm2) if n not in _out2))
_p2 = lambda m: f'{np.nanmedian(_A2[m]):.3g} (10~90%: {np.nanquantile(_A2[m], .1):.3g}~{np.nanquantile(_A2[m], .9):.3g})'
chk('0302 분포(시드 200) 기록: 오차 sd·배율·보정 효과·허용 초과 유리 수(최소제곱 대 단순 평균법)', all(np.isfinite(np.nanmedian(_A2[m])) for m in _m2),
    ' · '.join(f'{n} {_p2(m)}' for m, n in zip(_m2, _nm2)))
chk('0302 보정 효과 분포: 지표 중앙값이 측정 > T·회전 보정 후 > 전부 뺀 잔차 순으로 줄고(모든 시드), 전부 뺀 잔차는 측정의 절반 이하(중앙값)', bool(np.all(_A2['m_meas'] > _A2['m_align']) and np.all(_A2['m_align'] > _A2['m_all'])) and np.median(_A2['m_all'] / _A2['m_meas']) < 0.5,
    f'측정 {_p2("m_meas")} → T·회전 후 {_p2("m_align")} → 잔차 {_p2("m_all")}')

# 0302 페이지의 Python 블록: 그대로 실행한 출력 = 페이지에 적힌 출력, 출력의 숫자 = JS 대표 시드의 값
_pg4 = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'labs', '0302-ppa-least-squares.html'), encoding='utf-8').read()
_code4 = _html2.unescape(_re2.search(r'<pre id="pyCode">(.*?)</pre>', _pg4, _re2.S).group(1)); _out4 = _html2.unescape(_re2.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg4, _re2.S).group(1)).strip()
with _tf2.TemporaryDirectory() as _td4:
    shutil.copy(os.path.join(D, 'ppa_s10.csv'), _td4); open(os.path.join(_td4, 'lab0302.py'), 'w', encoding='utf-8').write(_code4)
    _run4 = subprocess.run([sys.executable, '-I', 'lab0302.py'], cwd=_td4, capture_output=True, text=True)
chk('0302 페이지의 Python 블록을 CSV 에 그대로 실행한 출력 = 페이지에 적힌 출력', _run4.returncode == 0 and _run4.stdout.strip() == _out4, f'종료 {_run4.returncode} · 출력 {len(_run4.stdout.splitlines())}줄' + ('' if _run4.stdout.strip() == _out4 else ' · 다름: ' + (_run4.stderr or _run4.stdout).strip()[:300]))
_T2d = _T2['seeds'][_s10def - 1]; _XA = _X0['items'][_pr['i']]; _jA = _T2d['items'][_pr['i']]; _jB = _T2d['items'][_pr['j']]
_exp4 = [f'{_jA["coef"][c]:+.3f}' for c in ['Tx', 'Mx', 'My']] + [f'{_jA["se"]["Tx"]:.3f}', f'{_jA["mm"]:.3f}', f'{_jA["ma"]:.3f}', f'{_jA["mx"]:.3f}', f'{_jB["mx"]:.3f}', f'{_jA["pre"]["right_col"]["nv"]["Mx"]:+.3f}', f'{_jA["pre"]["right_col"]["l4"]["Mx"]:+.3f}']
chk('0302 Python 출력의 숫자(유리 A 의 Tx·Mx·My 추정, 표준오차, 지표 세 단계, 유리 B 잔차 지표, 오른쪽 열 누락의 단순 평균법·최소제곱 Mx) = JS 대표 시드와 소수 셋째 자리까지 일치, 코드 속 유리 번호 = JS 짝', all(e in _run4.stdout for e in _exp4) and f'A, B = "S10-{_s10def}-{_ia["id"]}", "S10-{_s10def}-{_ib["id"]}"' in _code4, ' · '.join(_exp4[:5]))

# ============================================================
# S11 (0303) — 열변형과 턴 누적: 유리 1728장 계수·join·다중 회귀·온도 보정·리페어 경보를 numpy 로 독립 구현해 시드 1~200 을 JS 와 대조한다
# ============================================================
_S11_EXPORT = r"""const M=require(%s);const T=M.s11tools;const C=M.CFG;const out=[];let ref=null,flag=true;
for(let sd=1;sd<=200;sd++){const S=M.scenario('S11',{seed:sd});const R=S.coefRows,F=S.truth;const m=T.metrics(S);
 const fm={};S.fdcRows.forEach(r=>{fm[r.glass_id]=r.fdc_temp;});
 const key=R.map(r=>r.glass_id.replace(/^S11-\d+-/,''));if(ref===null)ref=key;else if(key.join()!==ref.join())flag=false;
 out.push({seed:sd,mx:R.map(r=>r.Mx_hat),my:R.map(r=>r.My_hat),fdc:R.map(r=>fm[r.glass_id]===undefined?null:fm[r.glass_id]),
  mxt:R.map(r=>F[r.glass_id].Mx_true),tt:R.map(r=>F[r.glass_id].T_true),age:R.map(r=>F[r.glass_id].Mx_age),th:R.map(r=>F[r.glass_id].Mx_th),js:m,nf:S.fdcRows.length});}
const S1=M.scenario('S11'),gr=[];
[1,177].forEach(sd=>{ // 격자 단계 점검: ppa 를 같은 호출로 다시 만들어 격자째 내보낸다
 const S=M.scenario('S11',{seed:sd});const rows=S.coefRows;const items=[];
 S.masks.forEach(mk0=>{const mk=M.makeMask(mk0.mask_id,null,'S11-'+sd);const pm=M.parseMaskId(mk0.mask_id);
  for(let turn=1;turn<=24;turn++){const season=0.3*(turn-1)/23;[5,20,40,60,90,120].forEach(git=>{const gid='S11-'+sd+'-'+mk0.mask_id+'-T'+String(turn).padStart(2,'0')+'-G'+String(git).padStart(3,'0');
   const ctx={glass_id:gid,block:mk.block,chamber:mk.chamber,mask_set:mk.set,turn:turn,glass_in_turn:git,chamber_temp:M.chamberTemp(pm.chamber,git,{season:season})};
   const r=M.ppa(ctx,mk);items.push({gid:gid,dx:r.grid.map(g=>g.dx_um),dy:r.grid.map(g=>g.dy_um)});});}});
 gr.push({seed:sd,items:items,rows:rows.map(r=>[r.Tx_hat,r.Ty_hat,r.theta_hat,r.Mx_hat,r.My_hat,r.K_hat,r.Cx_hat,r.Cy_hat,r.se_Mx,r.se_My,r.sigma]),gid:rows.map(r=>r.glass_id)});});
const T10=M.s10tools,S0=M.scenario('S11',{seed:3}),dmax={c:0,s:0};  // s11fit = s10fit(전부 항) 확인: 한 시드의 첫 200장
{const mk=M.makeMask('B03-A2',null,'S11-3');for(let g=0;g<200;g++){const ctx={glass_id:'chk'+g,block:'B03',chamber:'CH2',mask_set:'A',turn:1+g%%24,glass_in_turn:1+g%%120,chamber_temp:80+g*0.01};const r=M.ppa(ctx,mk);const a=T10.fit(r.grid),b=T.fit(r.grid);
 for(const k in a.coef){dmax.c=Math.max(dmax.c,Math.abs(a.coef[k]-b.coef[k]));dmax.s=Math.max(dmax.s,Math.abs(a.se[k]-b.se[k]));}}}
const wide={};[0,0.6].forEach(K=>{const S=M.scenario('S11',{seed:177,season_K:K});wide[K]=T.metrics(S);});
const csvChk=M.scenario('S11'),def=M.SEEDS.S11;
const pgj=(function(){const S=csvChk,J=T.join(S.coefRows,S.fdcRows),rows=J.rows.map(r=>Object.assign({},r,{dT:r.fdc_temp==null?null:r.fdc_temp-C.T0})),ok=rows.filter(r=>r.fdc_temp!=null),mk=T.pickMask(ok).mask_id,rx=T.regress(ok,'Mx_hat',['dT','turn'],{perMask:true});
 const comp=T.compensate(rows,rx.coef.dT,C.T0),ar=T.alarms(rows,{field:'Mx_hat'}),ac=T.alarms(comp,{field:'Mx_comp'}),a=ar.find(x=>x.mask_id===mk),b=ac.find(x=>x.mask_id===mk);
 return {mk:mk,raw12:a.change[11],comp12:b.change[11],raw_turn:a.turn,comp_turn:b.turn,m:T.metrics(S),missed:J.missed,joined:J.joined,unm:J.fdc_unmatched};})();
console.log(JSON.stringify({seeds:out,ordered:flag,key:ref,grids:gr,fit_vs_s10:dmax,wide:wide,def:def,defmx:csvChk.coefRows.map(r=>r.Mx_hat),defgid:csvChk.coefRows.map(r=>r.glass_id),cfg:{am:C.ALPHA_M,ag:C.ALPHA_G,T0:C.T0,age:C.AGE_PPM_PER_TURN,clean:C.CLEAN_STEP_PPM,rise:C.TEMP_RISE},
  pg:pgj,ids:T.IDS,gits:T.GITS,K:T.SEASON_K,review:T.REVIEW,limit:T.LIMIT}));"""
_s11 = json.loads(subprocess.run([_node, '-e', _S11_EXPORT % json.dumps(_mf)], capture_output=True, text=True, check=True, env=dict(os.environ, NODE_OPTIONS='--max-old-space-size=4096')).stdout)
_c11 = _s11['cfg']; _ids11 = _s11['ids']; _key11 = [k.split('-') for k in _s11['key']]          # 'B02-A1-T01-G005' → [B02, A1, T01, G005]
_mi11 = np.array([_ids11.index(k[0] + '-' + k[1]) for k in _key11]); _tn11 = np.array([int(k[2][1:]) for k in _key11]); _gt11 = np.array([int(k[3][1:]) for k in _key11])
# 격자 설계 행렬(0302 와 같은 모델 판): 계수 Tx,Ty,θ,Mx,My,K,Cx,Cy
_x11 = (-750 + 150 * np.tile(np.arange(11), 7)) / 1000; _y11 = (-462.5 + (925 / 6) * np.repeat(np.arange(7), 11)) / 1000; _o11, _z11 = np.ones(77), np.zeros(77)
_X11 = np.vstack([np.column_stack([_o11, _z11, -_y11, _x11, _z11, _y11, _x11 * _y11, _z11]), np.column_stack([_z11, _o11, _x11, _z11, _y11, _z11, _z11, _x11 ** 2])])
_G11 = np.linalg.inv(_X11.T @ _X11)
def py11_fit(dx, dy):
    y = np.r_[dx, dy]; b = np.linalg.lstsq(_X11, y, rcond=None)[0]; r = y - _X11 @ b; sg = np.sqrt(float(r @ r) / (154 - 8)); return b, sg * np.sqrt(np.diag(_G11)), sg
def py11_ols(X, y):                                                                  # numpy lstsq + σ̂ 기반 표준오차
    b = np.linalg.lstsq(X, y, rcond=None)[0]; r = y - X @ b; sg = np.sqrt(float(r @ r) / (len(y) - X.shape[1])); return b, sg * np.sqrt(np.diag(np.linalg.inv(X.T @ X))), float(r @ r)
def py11_reg(yv, fdc, cols, per_mask=True, tvar=None):                                # 마스크별 절편 + cols(이름: 값) 다중 회귀. FDC 온도가 없는 행은 뺀다
    ok = ~np.isnan(fdc) if tvar is None else np.ones(len(yv), bool)      # 세 회귀 모두 FDC 온도가 있는 행만
    D = [(_mi11 == m).astype(float) for m in range(12)] if per_mask else [np.ones(len(yv))]
    X = np.column_stack(D + [c for c in cols.values()])[ok]; b, se, rss = py11_ols(X, yv[ok]); nI = len(D); return {k: (b[nI + i], se[nI + i]) for i, k in enumerate(cols)}, rss, int(ok.sum())
def py11_alarm(v, limit, upto):                                                       # 마스크별 기준선(턴 1 평균) 대비 턴 평균이 limit 넘게 내려간 첫 턴, 없으면 0
    out = []
    for m in range(12):
        ok = (_mi11 == m) & ~np.isnan(v); base = v[ok & (_tn11 == 1)].mean(); first = 0
        for t in range(2, upto + 1):
            if v[ok & (_tn11 == t)].mean() - base < -limit: first = t; break
        out.append(first)
    return out
_t11 = {'ident': 0.0, 'grid_c': 0.0, 'grid_se': 0.0, 'reg': 0.0, 'regse': 0.0, 'cnt': 0, 'th': 0.0, 'sg': 0.0}
for _g in _s11['grids']:                                                                # 1) 격자 → 계수: 두 시드 × 1728장 전부 numpy lstsq 로 다시
    for _it, _r in zip(_g['items'], _g['rows']):
        b, se, sg = py11_fit(_it['dx'], _it['dy'])
        _t11['grid_c'] = max(_t11['grid_c'], max(abs(b[i] - _r[i]) for i in range(8))); _t11['grid_se'] = max(_t11['grid_se'], abs(se[3] - _r[8]), abs(se[4] - _r[9]), abs(sg - _r[10]))
_rows11 = []
_AT = lambda a: np.array([np.nan if v is None else v for v in a], float)
for _d in _s11['seeds']:                                                                # 2) 시드 200개 전부: 회귀·보정·경보를 다시 구현
    mx, my, fdc, mxt, tt, age, th = (_AT(_d[k]) for k in ['mx', 'my', 'fdc', 'mxt', 'tt', 'age', 'th']); dT = fdc - _c11['T0']; tn = _tn11.astype(float); js = _d['js']
    cx, rss1, n1 = py11_reg(mx, fdc, {'dT': dT, 'turn': tn}); ct, _, _ = py11_reg(mx, fdc, {'turn': tn}); cy, _, _ = py11_reg(my, fdc, {'dT': dT, 'turn': tn})
    for nm, py, jv in [('thermal', cx['dT'], 'thermal'), ('turn', cx['turn'], 'turn'), ('turn_only', ct['turn'], 'turn_only'), ('my_thermal', cy['dT'], 'my_thermal'), ('my_turn', cy['turn'], 'my_turn')]:
        _t11['reg'] = max(_t11['reg'], abs(py[0] - js[jv]))
    _t11['regse'] = max(_t11['regse'], abs(cx['dT'][1] - js['thermal_se']), abs(cx['turn'][1] - js['turn_se']), abs(ct['turn'][1] - js['turn_only_se']), abs(cy['turn'][1] - js['my_turn_se']))
    comp = mx - cx['dT'][0] * dT
    ab, aa, at = py11_alarm(mx, 0.3, 12), py11_alarm(comp, 0.3, 12), py11_alarm(age, 0.3, 12)
    fb, fa = sum(1 for x in ab if x), sum(1 for x in aa if x)
    cf = lambda a, t: dict(hit=sum(1 for x, y in zip(a, t) if x and y), false_alarm=sum(1 for x, y in zip(a, t) if x and not y), miss=sum(1 for x, y in zip(a, t) if not x and y), quiet=sum(1 for x, y in zip(a, t) if not x and not y))
    _t11['cnt'] += int(fb != js['alarm_before'] or fa != js['alarm_after'] or sum(1 for x in at if x) != js['alarm_truth'] or cf(ab, at) != js['conf_before'] or cf(aa, at) != js['conf_after'])
    ok = ~np.isnan(fdc); cor = float(np.corrcoef(fdc[ok], tn[ok])[0, 1]); _t11['th'] = max(_t11['th'], abs(cor - js['corr_tt']), abs(cy['dT'][0] / cx['dT'][0] - js['ratio']))
    ctrue, _, _ = py11_reg(mxt, tt, {'dT': tt - _c11['T0'], 'turn': tn}, tvar=True)
    cglob, _, _ = py11_reg(mx, fdc, {'dT': dT, 'turn': tn}, per_mask=False)
    cdl, _, _ = py11_reg(dT, fdc, {'turn': tn}); _t11['ident'] = max(_t11.get('ident', 0.0), abs(ct['turn'][0] - (cx['turn'][0] + cx['dT'][0] * cdl['turn'][0])))
    e = mx - mxt; ew = e - np.array([e[_mi11 == m].mean() for m in range(12)])[_mi11]
    _rows11.append({'seed': _d['seed'], 'thermal': js['thermal'], 'turn': js['turn'], 'turn_only': js['turn_only'], 'ratio': js['ratio'], 'alarm_before': js['alarm_before'], 'alarm_after': js['alarm_after'], 'alarm_truth': js['alarm_truth'],
                    'my_turn': js['my_turn'], 'my_turn_se': js['my_turn_se'], 'corr': js['corr_tt'], 'missed': js['missed'], 'nf': _d['nf'], 'tru_th': ctrue['dT'][0], 'tru_turn': ctrue['turn'][0], 'glob_th': cglob['dT'][0], 'glob_turn': cglob['turn'][0],
                    'within': float(ew.std()), 'total': float(e.std()), 'th_exact': float(np.abs(th - (_c11['am'] - _c11['ag']) * (tt - _c11['T0']) * 1e6).max()), 'fdc_sd': float(np.nanstd(fdc - tt)), 'age_exact': float(np.abs(age - (_c11['age'] * _tn11 + _c11['clean'])).max())})
_R11 = {k: np.array([r[k] for r in _rows11], float) for k in _rows11[0]}
_p11 = lambda a: f'{np.median(a):.4g} (10~90%: {np.quantile(a, .1):.4g}~{np.quantile(a, .9):.4g})'
_n11 = len(_s11['seeds'][0]['mx'])
chk('S11 구조: 마스크 12장 × 24턴 × 6장 = 1728장(모든 시드), 시드마다 같은 순서, 턴 안 순번 5·20·40·60·90·120, 고유한 유리 번호', _n11 == 1728 == 12 * 24 * 6 and _s11['ordered'] and sorted(set(_gt11.tolist())) == [5, 20, 40, 60, 90, 120] and len(set(_s11['key'])) == 1728 and _s11['ids'] == ['B02-A1', 'B02-A2', 'B02-A3', 'B02-A4', 'B03-A1', 'B03-A2', 'B03-A3', 'B03-A4', 'B04-A1', 'B04-A2', 'B04-A3', 'B04-A4'],
    f'유리 {_n11}장 · 마스크 {len(_ids11)}장 · 턴 {int(_tn11.max())} · 순번 {sorted(set(_gt11.tolist()))}')
chk('S11 격자 → 계수: numpy lstsq 로 독립 재현한 계수 8개·Mx·My 표준오차·σ̂ 가 JS 와 1e-9 이내(시드 1·177 × 1728장 = 3456장), 빠른 해법 s11fit = s10tools.fit(전부 항) 1e-9', max(_t11['grid_c'], _t11['grid_se']) < 1e-9 and _s11['fit_vs_s10']['c'] < 1e-9 and _s11['fit_vs_s10']['s'] < 1e-9, f'계수 {_t11["grid_c"]:.1e} · 표준오차 {_t11["grid_se"]:.1e} · s11fit−s10fit {_s11["fit_vs_s10"]["c"]:.1e}')
_gd = _s11['grids'][0]; _fd = _s11['seeds'][0]
chk('S11 측정 표(계수·FDC)가 정답 표와 맞음: 열변형 정답 Mx_th = (α마스크 − α유리)·(참 온도 − T0)·10⁶ 1e-9, 턴 누적 정답 Mx_age = −0.02·턴 − 0.05 1e-9, FDC 온도 − 참 온도의 표준편차 ≈ 0.04', float(_R11['th_exact'].max()) < 1e-9 and float(_R11['age_exact'].max()) < 1e-9 and abs(np.median(_R11['fdc_sd']) - 0.04) < 0.003,
    f'열변형 식 최대 차 {_R11["th_exact"].max():.1e} · 턴 누적 식 최대 차 {_R11["age_exact"].max():.1e} · FDC 잡음 sd 중앙값 {np.median(_R11["fdc_sd"]):.4f}')
_dc = rd('ppa_coef_s11.csv'); _df = rd('fdc_temp_s11.csv'); _mg = _dc.merge(_df, on='glass_id', how='left')
chk('S11 join: CSV 두 개를 glass_id 로 이으면 계수 1728행 중 FDC 가 없는 행 수 = JS 가 센 못 이은 행 수, FDC 표에 주인 없는 행 0, CSV 의 Mx̂ = 대표 시드 JS 값(1e-6)', len(_dc) == 1728 and int(_mg.fdc_temp.isna().sum()) == _R11['missed'][_s11['def'] - 1] == 1728 - len(_df) and _df.glass_id.isin(_dc.glass_id).all() and _dc.glass_id.is_unique and _df.glass_id.is_unique and list(_dc.glass_id) == _s11['defgid'] and np.abs(_dc.Mx_hat.values - np.array(_s11['defmx'])).max() < 1e-6,
    f'계수 {len(_dc)}행 · FDC {len(_df)}행 · 못 이은 행 {int(_mg.fdc_temp.isna().sum())} (시드별 {_p11(_R11["missed"])}) · CSV − JS Mx̂ 최대 {np.abs(_dc.Mx_hat.values - np.array(_s11["defmx"])).max():.1e}')
chk('S11 다중 회귀: numpy lstsq 로 독립 재현한 열변형·턴·턴만·My 기울기가 JS 와 1e-9, 표준오차 1e-9, 온도–턴 상관·My/Mx 비도 일치(시드 1~200)', _t11['reg'] < 1e-9 and _t11['regse'] < 1e-9 and _t11['th'] < 1e-9, f'기울기 {_t11["reg"]:.1e} · 표준오차 {_t11["regse"]:.1e} · 상관·비 {_t11["th"]:.1e}')
chk('S11 보정·경보: 온도 보정 Mx̂ − 기울기·(FDC 온도 − 80), 마스크별 기준선(턴 1)·12턴 판정을 다시 구현해 경보 마스크 수(보정 전·후·정답)와 혼동표 네 칸이 JS 와 같음(시드 1~200)', _t11['cnt'] == 0, f'불일치 시드 {_t11["cnt"]}개')
_adj = lambda a: (np.median(a), np.quantile(a, .1), np.quantile(a, .9))
chk('S11 설계서 기대 1 — 다중 회귀 열변형 기울기의 시드 분포 중앙값이 −2 근처(±0.3): 정답은 (1.5 − 3.5)·10⁻⁶·10⁶ = −2.0 ppm/K', abs(np.median(_R11['thermal']) + 2) < 0.3 and abs(_R11['thermal'] + 2).max() < 0.3, f'열변형 기울기 {_p11(_R11["thermal"])} ppm/K · 최악 {_R11["thermal"][np.argmax(abs(_R11["thermal"] + 2))]:.4f}')
chk('S11 열변형 기울기가 정답 −2 보다 조금 작게(절댓값) 나옴: FDC 온도의 측정 잡음(0.04 K) 때문 — 참 온도로 회귀하면 −2 에 맞고(차 < 0.05), FDC 온도로는 참 온도 회귀보다 절댓값이 작은 시드가 95% 이상', abs(np.median(_R11['tru_th']) + 2) < 0.05 and np.mean(abs(_R11['thermal']) < abs(_R11['tru_th'])) >= 0.95,
    f'참 온도 회귀 {_p11(_R11["tru_th"])} · FDC 온도 회귀 {_p11(_R11["thermal"])} · FDC 쪽이 더 작은 시드 비율 {np.mean(abs(_R11["thermal"]) < abs(_R11["tru_th"])):.2f}')
chk('S11 설계서 기대 2 — 교란 방향: 턴만 넣은 기울기가 둘 다 넣은 기울기보다 더 음수(모든 시드)이고, 그 차 ≈ 계절 몫 −2·0.3/23 = −0.026(±0.005), 둘 다 넣으면 정답 −0.02 근처(±0.003)', bool(np.all(_R11['turn_only'] < _R11['turn'])) and abs(np.median(_R11['turn_only'] - _R11['turn']) + 2 * _s11['K'] / 23) < 0.005 and abs(np.median(_R11['turn'] + 0.02)) < 0.003,
    f'턴만 {_p11(_R11["turn_only"])} · 둘 다 {_p11(_R11["turn"])} (정답 −0.02) · 차 {_p11(_R11["turn_only"] - _R11["turn"])} · 온도–턴 상관 {_p11(_R11["corr"])}')
chk('S11 설계서 기대 3 — My 열변형 기울기 / Mx 열변형 기울기 ≈ 0.5(중앙값 0.45~0.55), My 의 턴 기울기는 0 근처(|중앙값| < 0.002 — Mx 의 턴 기울기 0.02 의 10분의 1 미만)', 0.45 < np.median(_R11['ratio']) < 0.55 and abs(np.median(_R11['my_turn'])) < 0.002,
    f'비 {_p11(_R11["ratio"])} · My 턴 기울기 {_p11(_R11["my_turn"])} (표준오차 중앙값 {np.median(_R11["my_turn_se"]):.4f}) · |기울기|/표준오차 중앙값 {np.median(abs(_R11["my_turn"]) / _R11["my_turn_se"]):.2f}')
chk('S11 마스크별 절편이 스틱 누설(마스크마다 일정한 치우침)을 흡수: 추정 오차(Mx̂ − 정답)의 마스크 안 표준편차가 전체 표준편차의 60% 미만(중앙값), 절편을 하나만 두면 열변형·턴 기울기 오차가 커지는 시드가 과반', np.median(_R11['within'] / _R11['total']) < 0.6 and np.mean(abs(_R11['glob_th'] + 2) > abs(_R11['thermal'] + 2)) > 0.5,
    f'오차 sd 마스크 안/전체 {_p11(_R11["within"] / _R11["total"])} · 절편 하나일 때 열변형 기울기 {_p11(_R11["glob_th"])} (마스크별 {_p11(_R11["thermal"])}) · 턴 기울기 {_p11(_R11["glob_turn"])} · 절편 하나가 더 나쁜 시드 비율 {np.mean(abs(_R11["glob_th"] + 2) > abs(_R11["thermal"] + 2)):.2f}')
_cb = [r for r in _rows11]; _fa_b = np.array([_d['js']['conf_before']['false_alarm'] for _d in _s11['seeds']]); _fa_a = np.array([_d['js']['conf_after']['false_alarm'] for _d in _s11['seeds']]); _ms_a = np.array([_d['js']['conf_after']['miss'] for _d in _s11['seeds']])
chk('S11 리페어 경보(한계 0.3 ppm, 12턴 판정): 정답(Mx_age 만)은 12턴 안에 경보 0 이므로, 보정 전 헛경보 마스크 수 > 보정 후(모든 시드에서 ≥, 중앙값은 큼), 보정 후 놓침 0', bool(np.all(_R11['alarm_truth'] == 0)) and bool(np.all(_fa_b >= _fa_a)) and np.median(_fa_b) > np.median(_fa_a) and int(_ms_a.max()) == 0,
    f'정답 경보 {_p11(_R11["alarm_truth"])} · 보정 전 헛경보 {_p11(_fa_b)} (12장 모두인 시드 {int((_fa_b == 12).sum())}/200) · 보정 후 헛경보 {_p11(_fa_a)} · 보정 후 놓침 최대 {int(_ms_a.max())}')
# 계절 슬라이더(탐구 모드): 0 → 0.3 → 0.6 으로 올리면 온도–턴 상관과 교란 크기가 함께 커지고, 계절 0 이면 교란이 거의 없음
_w0, _w6 = _s11['wide']['0'], _s11['wide']['0.6']; _wd = [(_w['turn_only'] - _w['turn']) for _w in (_w0, _s11['seeds'][_s11['def'] - 1]['js'], _w6)]
chk('S11 계절 슬라이더: 계절 0·0.3·0.6 K 로 올리면 온도–턴 상관이 커지고, 교란 크기(턴만 − 둘 다)가 0 → −0.026 → −0.052 근처로 단조롭게 커짐, 계절 0 이면 둘 다 정답 −0.02 근처', _w0['corr_tt'] < _s11['seeds'][_s11['def'] - 1]['js']['corr_tt'] < _w6['corr_tt'] and abs(_wd[0]) < 0.005 and _wd[0] > _wd[1] > _wd[2] and abs(_wd[2] + 0.052) < 0.01 and abs(_w0['turn_only'] + 0.02) < 0.003,
    f'상관 {_w0["corr_tt"]:.3f} → {_s11["seeds"][_s11["def"] - 1]["js"]["corr_tt"]:.3f} → {_w6["corr_tt"]:.3f} · 교란 {_wd[0]:+.4f} → {_wd[1]:+.4f} → {_wd[2]:+.4f} ppm/턴')
chk('S11 교란의 식: 턴만 넣은 기울기 = 둘 다 넣은 턴 기울기 + 열변형 기울기 × (온도를 턴에 회귀한 기울기), 시드 1~200 전부 1e-9 (빠뜨린 변수 몫의 정확한 식)', _t11['ident'] < 1e-9, f'최대 차 {_t11["ident"]:.1e}')
# 대표 시드: 여섯 지표(열변형·턴·턴만·My/Mx 비·보정 전 경보·보정 후 경보)의 시드 1~200 백분위, Σ|백분위−50| 최소 = SEEDS.S11
_m11 = ['thermal', 'turn', 'turn_only', 'ratio', 'alarm_before', 'alarm_after']; _nm11 = ['다중 회귀 열변형 기울기', '다중 회귀 턴 기울기', '턴만 넣은 턴 기울기', 'My/Mx 열변형 기울기 비', '보정 전 경보 마스크 수', '보정 후 경보 마스크 수']
def _rk11(m, i): a = _R11[m]; v = a[i]; return float(((a < v).sum() + 0.5 * (a == v).sum()) / len(a))
_sc11 = np.array([sum(abs(_rk11(m, i) * 100 - 50) for m in _m11) for i in range(200)]); _ds = _s11['def'] - 1
chk('S11 대표 시드(SEEDS.S11): 여섯 지표 백분위의 Σ|백분위−50| 이 시드 1~200 중 가장 작은 시드이고, 25~75% 밖 지표를 기록(본문은 그 지표를 분포로 말해야 함)', int(np.argmin(_sc11)) == _ds,
    f'SEEDS.S11 = {_s11["def"]}, Σ = {_sc11[_ds]:.1f} · 25~75% 밖: ' + (' · '.join(f'{n} {_rk11(m, _ds)*100:.0f}%' for m, n in zip(_m11, _nm11) if not 0.25 <= _rk11(m, _ds) <= 0.75) or '없음') + ' / 안: ' + ' · '.join(f'{n} {_rk11(m, _ds)*100:.0f}%' for m, n in zip(_m11, _nm11) if 0.25 <= _rk11(m, _ds) <= 0.75))
chk('S11 분포(시드 200) 기록: 여섯 지표와 못 이은 행 수', all(np.isfinite(_R11[m]).all() for m in _m11), ' · '.join(f'{n} {_p11(_R11[m])}' for m, n in zip(_m11, _nm11)) + f' · 못 이은 행 {_p11(_R11["missed"])}')

# 0303 페이지의 Python 블록: 그대로 실행한 출력 = 페이지에 적힌 출력, 출력의 숫자 = JS 대표 시드의 값
import html as _html3, re as _re3, tempfile as _tf3
_pg11 = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'labs', '0303-thermal-turn.html'), encoding='utf-8').read()
_code11 = _html3.unescape(_re3.search(r'<pre id="pyCode">(.*?)</pre>', _pg11, _re3.S).group(1)); _out11 = _html3.unescape(_re3.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg11, _re3.S).group(1)).strip()
with _tf3.TemporaryDirectory() as _td11:
    shutil.copy(os.path.join(D, 'ppa_coef_s11.csv'), _td11); shutil.copy(os.path.join(D, 'fdc_temp_s11.csv'), _td11); open(os.path.join(_td11, 'lab0303.py'), 'w', encoding='utf-8').write(_code11)
    _run11 = subprocess.run([sys.executable, '-I', 'lab0303.py'], cwd=_td11, capture_output=True, text=True)
chk('0303 페이지의 Python 블록을 CSV 에 그대로 실행한 출력 = 페이지에 적힌 출력', _run11.returncode == 0 and _run11.stdout.strip() == _out11, f'종료 {_run11.returncode} · 출력 {len(_run11.stdout.splitlines())}줄' + ('' if _run11.stdout.strip() == _out11 else ' · 다름: ' + (_run11.stderr[-200:] or _run11.stdout[-200:])))
_pg = _s11['pg']; _pm = _pg['m']
_exp11 = [f'이은 행 {_pg["joined"]} · 못 이은 행 {_pg["missed"]} · FDC 표에 주인이 없는 행 {_pg["unm"]}', f'{_pm["thermal"]:+.3f} ± {_pm["thermal_se"]:.3f}', f'{_pm["turn"]:+.4f} ± {_pm["turn_se"]:.4f}', f'잔차제곱합 {_pm["rss"]:.2f}', f'{_pm["turn_only"]:+.4f} ± {_pm["turn_only_se"]:.4f}',
          f'{_pm["my_thermal"]:+.3f} ± {_pm["my_thermal_se"]:.3f}', f'{_pm["my_turn"]:+.4f} ± {_pm["my_turn_se"]:.4f}', f'비 {_pm["ratio"]:.3f}', f'보정 전 {_pm["alarm_before"]}장 · 보정 후 {_pm["alarm_after"]}장', f'{_pg["raw12"]:+.3f} → 보정 후 {_pg["comp12"]:+.3f}',
          f'첫 경보 턴 {_pg["raw_turn"]} → {_pg["comp_turn"] or "없음"}']
chk('0303 Python 출력의 숫자(이은·못 이은 행, 열변형·턴·턴만·My 기울기와 표준오차, 잔차제곱합, 경보 마스크 수, 문제 마스크의 12턴 변화와 첫 경보 턴) = JS 대표 시드와 일치, 코드 속 마스크 번호 = JS 가 고른 마스크', all(e in _run11.stdout for e in _exp11) and f'M = "{_pg["mk"]}"' in _code11, ' · '.join(_exp11[:3]))

# ============================================================
# S12 (0304) — 보정할까 리페어할까: 유리 192장 계수·보정 후 지표·3단 판정·튄 점·반복 위치·우연 반복 확률·리페어 전후 비교를 numpy·scipy 로 독립 구현해 JS 와 대조한다
# ============================================================
_S12_EXPORT = r"""const M=require(%s);const T=M.s12tools;const FULL=[1,153,200],out=[],full=[];
const pack=g=>({id:g.glass_id,git:g.glass_in_turn,fdc:g.fdc_temp,dx:g.grid.map(q=>q.dx_um),dy:g.grid.map(q=>q.dy_um),c:[g.coef.Tx,g.coef.Ty,g.coef.theta,g.coef.Mx,g.coef.My,g.coef.K,g.coef.Cx,g.coef.Cy],fl:g.flagged.map(f=>[f.px,f.py]),pm:g.post_metric.dx_metric});
for(let sd=1;sd<=200;sd++){const S=M.scenario('S12',{seed:sd});const m=T.metrics(S);
 out.push({seed:sd,spec:S.spec,ps:S.p_single,k:S.k_default,pick:S.pick_repair,m:m,
  items:S.items.map(it=>({id:it.mask_id,turn:it.turn,met:it.metric,post:it.post_metric,tm:it.truth_metric,tpm:it.truth_post_metric,act:it.action,tact:it.truth_action,kind:it.kind,tkind:it.truth_kind,counts:it.counts,defs:it.mask_defects.map(d=>[d.px,d.py]),bad:it.bad_stick,g0:it.glasses[0].flagged.length,fpg:it.flag_per_glass,treat:it.treat,nrep:it.repeat?it.repeat.length:0,
   eff:it.effect?{pt:it.effect.paired.t,pp:it.effect.paired.p,pd:it.effect.paired.diff,wt:it.effect.welch.t,wp:it.effect.welch.p,wd:it.effect.welch.diff}:null,after_counts:it.after?it.after.counts:null}))});
 if(FULL.indexOf(sd)>=0)full.push({seed:sd,items:S.items.map(it=>({id:it.mask_id,glasses:it.glasses.map(pack),after:it.after?it.after.glasses.map(pack):null}))});}
const b=T.bT();
console.log(JSON.stringify({seeds:out,full:full,bt:b,def:M.SEEDS.S12,gits:T.GITS,keep:T.KEEP,ids:T.IDS}));"""
_s12 = json.loads(subprocess.run([_node, '-e', _S12_EXPORT % json.dumps(_mf)], capture_output=True, text=True, check=True, env=dict(os.environ, NODE_OPTIONS='--max-old-space-size=4096')).stdout)
_NP12 = 77
def py12_metric(dx): dx = np.asarray(dx, float); return abs(dx.mean()) + 3 * dx.std(ddof=1)
def py12_corr(dxm, dym, fdc, c8, bt, ratio):                                          # 측정 − 보정 가능 몫(평행이동·회전·열변형). x·y 는 mm, 계수 단위는 µm·ppm
    Tx, Ty, th = c8[0], c8[1], c8[2]; dT = fdc - 80; mxc = bt * dT; myc = ratio * bt * dT
    return np.asarray(dxm) - (Tx - th * _Y10 * 1e-3 + mxc * _X10 * 1e-3), np.asarray(dym) - (Ty + th * _X10 * 1e-3 + myc * _Y10 * 1e-3)
def py12_glass(g, bt, ratio):
    b, se, sg = py11_fit(g['dx'], g['dy']); y = np.r_[g['dx'], g['dy']]; r = y - _X11 @ b; pdx, pdy = py12_corr(g['dx'], g['dy'], g['fdc'], b, bt, ratio)
    return {'b': b, 'pdx': pdx, 'pdy': pdy, 'fl': sorted([int(j), int(i)] for j, i in py10_pts(r[:_NP12], r[_NP12:], 4)), 'pm': py12_metric(pdx)}
def py12_chance(p, n, k, m=77): t = float(stats.binom.sf(k - 1, n, p)); return t, 1 - (1 - t) ** m
# 0303 의 다중 회귀 기울기를 CSV 두 개에서 독립으로 다시 구한다(마스크별 절편 + FDC 온도 차 + 턴, FDC 가 없는 행 제외)
_cc12 = rd('ppa_coef_s11.csv').merge(rd('fdc_temp_s11.csv'), on='glass_id', how='left').dropna(subset=['fdc_temp'])
_D12 = np.column_stack([(_cc12.mask_id == m).astype(float).values for m in sorted(_cc12.mask_id.unique())] + [(_cc12.fdc_temp - 80).values, _cc12.turn.values.astype(float)])
_bx12 = np.linalg.lstsq(_D12, _cc12.Mx_hat.values, rcond=None)[0]; _by12 = np.linalg.lstsq(_D12, _cc12.My_hat.values, rcond=None)[0]
_bt12, _ratio12 = float(_bx12[-2]), float(_by12[-2] / _bx12[-2])
_BT, _RT = _s12['bt']['thermal'], _s12['bt']['ratio']                              # S12 가 받아 쓰는 JS 값(CSV 는 소수 6자리로 반올림돼 있어 CSV 에서 구한 값과 1e-6 쯤 다름)
chk('S12 열변형 기울기 b̂T·My/Mx 비: 0303 의 CSV 두 개(계수 표·FDC 표)에서 numpy 로 다시 구한 값이 JS 의 scenario("S11") 대표 시드 값과 CSV 반올림 오차(1e-4) 안에서 같음 (S12 는 이 값을 받아 쓴다 — 숫자를 박지 않음)', abs(_bt12 - _BT) < 1e-4 and abs(_ratio12 - _RT) < 1e-4,
    f'b̂T {_bt12:+.4f} ppm/K (JS {_s12["bt"]["thermal"]:+.4f}) · 비 {_ratio12:.4f} (JS {_s12["bt"]["ratio"]:.4f})')
_t12 = {'coef': 0.0, 'post': 0.0, 'mean': 0.0, 'meanpost': 0.0, 'spec': 0.0, 'act': 0, 'fl': 0, 'cnt': 0, 'ps': 0.0, 'k': 0, 'chance': 0.0, 'eff': 0.0, 'nglass': 0, 'nmask': 0, 'neff': 0}
for _F in _s12['full']:
    _S = next(x for x in _s12['seeds'] if x['seed'] == _F['seed']); _mets, _posts, _fpg = [], [], []
    for _it, _ji in zip(_F['items'], _S['items']):
        _pg = [py12_glass(g, _BT, _RT) for g in _it['glasses']]; _t12['nglass'] += len(_pg)
        for g, p in zip(_it['glasses'], _pg):
            _t12['coef'] = max(_t12['coef'], float(np.abs(p['b'] - np.array(g['c'])).max())); _t12['post'] = max(_t12['post'], abs(p['pm'] - g['pm'])); _t12['fl'] += int(p['fl'] != sorted(g['fl']))
        _mdx = np.mean([g['dx'] for g in _it['glasses']], 0); _pdx = np.mean([p['pdx'] for p in _pg], 0)
        _mets.append(py12_metric(_mdx)); _posts.append(py12_metric(_pdx)); _t12['mean'] = max(_t12['mean'], abs(_mets[-1] - _ji['met'])); _t12['meanpost'] = max(_t12['meanpost'], abs(_posts[-1] - _ji['post']))
        _cn = np.zeros(77, int)
        for p in _pg:
            for j, i in p['fl']: _cn[i * 11 + j] += 1
        _t12['cnt'] += int(not np.array_equal(_cn, np.array(_ji['counts']))); _fpg.append(sum(len(p['fl']) for p in _pg) / 8); _t12['nmask'] += 1
        if _it['after'] is not None and _ji['eff'] is not None:
            _pa = [py12_glass(g, _BT, _RT) for g in _it['after']]
            _a = np.mean([np.hypot(p['pdx'], p['pdy']) for p in _pg], 0); _b = np.mean([np.hypot(p['pdx'], p['pdy']) for p in _pa], 0)
            _tp = stats.ttest_rel(_b, _a); _tw = stats.ttest_ind([p['pm'] for p in _pa], [p['pm'] for p in _pg], equal_var=False)
            _t12['eff'] = max(_t12['eff'], abs(_tp.statistic - _ji['eff']['pt']), abs(_tp.pvalue - _ji['eff']['pp']), abs(float(np.mean(_b - _a)) - _ji['eff']['pd']), abs(_tw.statistic - _ji['eff']['wt']), abs(_tw.pvalue - _ji['eff']['wp'])); _t12['neff'] += 1
    _good = [m for m, j in zip(_mets, _S['items']) if j['bad'] < 0]; _spec = float(np.quantile(_good, 0.95)); _t12['spec'] = max(_t12['spec'], abs(_spec - _S['spec']))
    _dec = lambda m, p: 'none' if m <= _spec else ('correct' if p <= _spec else 'repair')
    _t12['act'] += sum(_dec(m, p) != j['act'] for m, p, j in zip(_mets, _posts, _S['items']))
    _ps = float(np.median(_fpg)) / 77; _t12['ps'] = max(_t12['ps'], abs(_ps - _S['ps'])); _kk = next((k for k in range(1, 9) if py12_chance(_ps, 8, k)[1] < 0.01), 9); _t12['k'] += int(_kk != _S['k'])
chk('S12 격자 → 계수·보정 후 지표: 세 시드(1·대표·200) 유리 576장을 numpy lstsq 로 독립 재현한 계수 8개가 JS 와 1e-9, 보정 후 유리 지표 1e-9, 8장 평균 장의 측정·보정 후 지표 1e-9', _t12['nglass'] == 3 * 24 * 8 and _t12['coef'] < 1e-9 and _t12['post'] < 1e-9 and _t12['mean'] < 1e-9 and _t12['meanpost'] < 1e-9,
    f'유리 {_t12["nglass"]}장 · 계수 {_t12["coef"]:.1e} · 보정 후 유리 지표 {_t12["post"]:.1e} · 평균 장 지표 {_t12["mean"]:.1e} / {_t12["meanpost"]:.1e}')
chk('S12 판정·반복 위치: spec(불량 스틱 없는 마스크 측정 지표의 95 백분위)·3단 판정·튄 점(이웃 중앙값 로버스트 z ≥ 4, 전부 항 적합 잔차)·위치별 장 수·한 장당 튄 점 비율·기본 k 를 독립 구현해 JS 와 같음(세 시드)', _t12['spec'] < 1e-9 and _t12['act'] == 0 and _t12['fl'] == 0 and _t12['cnt'] == 0 and _t12['ps'] < 1e-12 and _t12['k'] == 0,
    f'spec 차 {_t12["spec"]:.1e} · 판정 불일치 {_t12["act"]} · 튄 점 불일치 {_t12["fl"]} · 위치 횟수 불일치 {_t12["cnt"]} · 한 장당 비율 차 {_t12["ps"]:.1e} · 기본 k 불일치 {_t12["k"]}')
chk('S12 리페어 전후 비교: 점별 |d| 8장 평균 77쌍의 대응 비교(scipy.ttest_rel)와 유리별 지표 8 대 8 의 Welch(scipy.ttest_ind equal_var=False)가 JS 의 t·p·차와 1e-9 (세 시드의 조치 마스크 전부)', _t12['neff'] > 0 and _t12['eff'] < 1e-9, f'조치 마스크 {_t12["neff"]}장 · 최대 차 {_t12["eff"]:.1e}')
# 시드 1~200 전부: JS 가 낸 마스크별 값에서 지표 여섯 개와 우연 반복 확률을 Python 으로 다시 셈한다
_R12 = []; _bad12 = {'agree': 0, 'useless': 0, 'def': 0, 'false': 0, 'single': 0, 'repeat': 0, 'chance': 0.0, 'k': 0, 'pp': 0, 'ps': 0.0}
for _S in _s12['seeds']:
    _it = _S['items']; _spec = _S['spec']; n = len(_it); k = _S['k']; m = _S['m']
    _ag = sum(j['act'] == j['tact'] for j in _it) / n; _us = sum(j['met'] > _spec for j in _it) - sum(j['act'] == 'repair' for j in _it)
    dt = dc = fm = so = ro = 0
    for j in _it:
        org = {d[1] * 11 + d[0]: 1 for d in j['defs']}
        if j['bad'] >= 0: org.update({r * 11 + j['bad']: 1 for r in range(7)})
        rp = [i for i, c in enumerate(j['counts']) if c >= k]
        for d in j['defs']: dt += 1; dc += int(d[1] * 11 + d[0] in rp)
        fm += int(any(i not in org for i in rp)); tm = len(org) > 0; so += int((j['g0'] > 0) == tm); ro += int((len(rp) > 0) == tm)
    _pp = [j['eff']['pp'] for j in _it if j['eff']]; _pm = float(np.median(_pp)) if _pp else float('nan')
    _ch = py12_chance(_S['ps'], 8, k)[1]; _kk = next((q for q in range(1, 9) if py12_chance(_S['ps'], 8, q)[1] < 0.01), 9); _ps = float(np.median([j['fpg'] / 77 for j in _it]))
    _row = {'agree': _ag, 'useless': _us, 'def_ratio': dc / dt if dt else float('nan'), 'false_mask': fm, 'single_ok': so / n, 'repeat_ok': ro / n, 'pp': _pm, 'n_repair': sum(j['act'] == 'repair' for j in _it), 'over': sum(j['met'] > _spec for j in _it), 'k': k, 'n_treat': sum(1 for j in _it if j['treat']), 'chance': _ch}
    _R12.append(_row)
    _bad12['agree'] += abs(_ag - m['agree']) > 1e-12; _bad12['useless'] += _us != m['useless']; _bad12['def'] += (dt != m['def_total'] or dc != m['def_caught']); _bad12['false'] += fm != m['false_mask']
    _bad12['single'] += abs(so / n - m['single_ok']) > 1e-12; _bad12['repeat'] += abs(ro / n - m['repeat_ok']) > 1e-12; _bad12['chance'] = max(_bad12['chance'], abs(_ch - m['chance'])); _bad12['k'] += _kk != k
    _bad12['pp'] += (m['paired_p_median'] is None) != bool(np.isnan(_pm)) or (m['paired_p_median'] is not None and abs(_pm - m['paired_p_median']) > 1e-12); _bad12['ps'] = max(_bad12['ps'], abs(_ps - _S['ps']))
_A12 = {k: np.array([r[k] for r in _R12], float) for k in _R12[0]}
chk('S12 시드 1~200 지표 재계산: 판정 일치율·쓸데없는 리페어 수·마스크 기인 결함 중 반복으로 잡힌 비율·잘못 잡힌 마스크 수·유리 한 장 판정 정답률·전후 대응 비교 p 중앙값·한 장당 튄 점 비율·기본 k·우연 반복 확률(scipy.stats.binom)을 마스크별 값에서 다시 셈해 JS 와 같음', all(v == 0 for k, v in _bad12.items() if k not in ('chance', 'ps')) and _bad12['chance'] < 1e-12 and _bad12['ps'] < 1e-12,
    f'불일치 {({k: v for k, v in _bad12.items() if v})} (모두 0 이어야 함) · 우연 반복 확률 최대 차 {_bad12["chance"]:.1e}')
_m12 = ['agree', 'useless', 'def_ratio', 'false_mask', 'single_ok', 'pp']; _nm12 = ['판정 일치율', '쓸데없는 리페어 수', '마스크 기인 결함 중 반복으로 잡힌 비율', '반복 위치 잘못 잡힌 마스크 수', '유리 한 장 판정 정답률', '조치 마스크 전후 대응 비교 p 중앙값']
def _rk12(m, i):
    a = _A12[m]; a = a[~np.isnan(a)]; v = _A12[m][i]
    return float('nan') if np.isnan(v) else float(((a < v).sum() + 0.5 * (a == v).sum()) / len(a))
_sc12 = np.array([sum(abs(_rk12(m, i) * 100 - 50) for m in _m12) if not any(np.isnan(_A12[m][i]) for m in _m12) else np.inf for i in range(200)]); _d12 = _s12['def'] - 1
chk('S12 대표 시드(SEEDS.S12): 여섯 지표 백분위의 Σ|백분위−50| 이 시드 1~200 중 가장 작은 시드(지표가 정의되지 않는 시드는 후보에서 뺌)이고, 25~75% 밖 지표를 기록(본문은 그 지표를 분포로 말해야 함)', int(np.argmin(_sc12)) == _d12,
    f'SEEDS.S12 = {_s12["def"]}, Σ = {_sc12[_d12]:.1f} · 25~75% 밖: ' + (' · '.join(f'{n} {_rk12(m, _d12)*100:.0f}%' for m, n in zip(_m12, _nm12) if not 0.25 <= _rk12(m, _d12) <= 0.75) or '없음') + ' / 안: ' + ' · '.join(f'{n} {_rk12(m, _d12)*100:.0f}%' for m, n in zip(_m12, _nm12) if 0.25 <= _rk12(m, _d12) <= 0.75))
_p12 = lambda a: f'{np.nanmedian(a):.4g} (10~90%: {np.nanquantile(a, .1):.4g}~{np.nanquantile(a, .9):.4g})'
chk('S12 분포(시드 200) 기록: 여섯 지표와 기본 k·우연 반복 확률', np.isfinite(_A12['agree']).all(), ' · '.join(f'{n} {_p12(_A12[m])}' for m, n in zip(_m12, _nm12)) + f' · 기본 k {_p12(_A12["k"])} · 우연 반복 확률 {_p12(_A12["chance"])}')
_def12 = _R12[_d12]
chk('S12 설계 기대 1 — 3단 규칙이 측정 지표만으로 판정할 때보다 리페어 수가 적다: 모든 시드에서 규칙의 리페어 수 ≤ 측정 지표가 spec 을 넘은 마스크 수, 규칙이 더 적은 시드 비율 기록', bool(np.all(_A12['n_repair'] <= _A12['over'])),
    f'규칙이 더 적은 시드 {int((_A12["n_repair"] < _A12["over"]).sum())}/200 · 넘은 마스크 수 {_p12(_A12["over"])} · 규칙의 리페어 수 {_p12(_A12["n_repair"])}')
chk('S12 관찰(설계 예상과 다름) — 이 가상 공정에서는 보정 후 지표가 spec 을 넘어 3단 규칙이 리페어를 내리는 시드가 거의 없다(5% 미만): spec 이 보정 안 한 지표의 95 백분위라 보정 가능 몫이 큰 값을 정하고, 남는 몫(스틱·결함·배율 노화·직교도·고차)은 그보다 훨씬 작다 — 그래서 조치 대상은 반복 위치(이물 제거)가 잡힌 마스크까지 넓혀 전후를 비교한다', float((_A12['n_repair'] > 0).mean()) < 0.05,
    f'리페어 판정이 있는 시드 {int((_A12["n_repair"] > 0).sum())}/200 · 조치 대상(리페어 판정 또는 반복 위치) 마스크 수 {_p12(_A12["n_treat"])} · 보정 후 지표 대 spec 비(대표 시드 최대) {max(j["post"] for j in _s12["seeds"][_d12]["items"]) / _s12["seeds"][_d12]["spec"]:.2f}')
chk('S12 설계 기대 2 — 반복 위치로 마스크 기인(결함·불량 스틱 보유)을 맞히는 비율이 유리 한 장 판정보다 높다: 정답률 중앙값과 반복 쪽이 더 높은 시드 비율', np.median(_A12['repeat_ok']) > np.median(_A12['single_ok']) and float((_A12['repeat_ok'] > _A12['single_ok']).mean()) > 0.8,
    f'반복 위치 판정 {_p12(_A12["repeat_ok"])} · 유리 한 장 판정 {_p12(_A12["single_ok"])} · 반복 쪽이 더 높은 시드 {int((_A12["repeat_ok"] > _A12["single_ok"]).sum())}/200 · 같은 시드 {int((_A12["repeat_ok"] == _A12["single_ok"]).sum())}/200')
chk('S12 우연 반복 확률: 기본 k 에서 우연 반복 확률 < 1% 이고 k−1 에서는 ≥ 1% (모든 시드, k 가 1 이면 이 비교 생략), 한 장당 튄 점 비율 p 가 클수록 우연 반복 확률이 커짐(k 고정)', bool(np.all(_A12['chance'] < 0.01)) and all(py12_chance(s['ps'], 8, s['k'] - 1)[1] >= 0.01 for s in _s12['seeds'] if s['k'] > 1) and py12_chance(0.002, 8, 3)[1] < py12_chance(0.01, 8, 3)[1] < py12_chance(0.05, 8, 3)[1],
    f'기본 k {_p12(_A12["k"])} · 우연 반복 확률 {_p12(_A12["chance"])} · 한 장당 튄 점 비율 중앙값 {np.median([s["ps"] for s in _s12["seeds"]]):.4f}')
_rp = [(j['id'], j['treat'], j['nrep']) for j in _s12['seeds'][_d12]['items'] if j['treat']]
_effall = [(j['eff']['pp'], j['eff']['wp'], j['eff']['pd'], j['eff']['wd']) for X in _s12['seeds'] for j in X['items'] if j['eff']]
chk('S12 리페어 전후: 조치 마스크의 점별 대응 비교 p 가 유리별 Welch p 보다 작은 쌍의 비율(점끼리 독립이 아니라 대응이 훨씬 민감 — 0103 회수)과 둘 다 개선 방향(차 < 0)인 비율 기록', len(_effall) > 0 and np.mean([e[0] < e[1] for e in _effall]) > 0.5,
    f'조치 마스크 {len(_effall)}장(시드 200개 전체) · 대응 p < Welch p 인 쌍 {np.mean([e[0] < e[1] for e in _effall]):.2f} · 점별 대응 차 < 0 인 쌍 {np.mean([e[2] < 0 for e in _effall]):.2f} · 유리별 차 < 0 인 쌍 {np.mean([e[3] < 0 for e in _effall]):.2f} · 대응 p 중앙값 {np.median([e[0] for e in _effall]):.2g} · Welch p 중앙값 {np.median([e[1] for e in _effall]):.2g}')

# 0304 페이지의 Python 블록: 그대로 실행한 출력 = 페이지에 적힌 출력, 출력의 숫자 = JS 대표 시드의 값
_pg12 = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'labs', '0304-correct-or-repair.html'), encoding='utf-8').read()
_code12 = _html3.unescape(_re3.search(r'<pre id="pyCode">(.*?)</pre>', _pg12, _re3.S).group(1)); _out12 = _html3.unescape(_re3.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg12, _re3.S).group(1)).strip()
with _tf3.TemporaryDirectory() as _td12:
    shutil.copy(os.path.join(D, 'ppa_s12.csv'), _td12); open(os.path.join(_td12, 'lab0304.py'), 'w', encoding='utf-8').write(_code12)
    _run12 = subprocess.run([sys.executable, '-I', 'lab0304.py'], cwd=_td12, capture_output=True, text=True)
chk('0304 페이지의 Python 블록을 CSV 에 그대로 실행한 출력 = 페이지에 적힌 출력', _run12.returncode == 0 and _run12.stdout.strip() == _out12, f'종료 {_run12.returncode} · 출력 {len(_run12.stdout.splitlines())}줄' + ('' if _run12.stdout.strip() == _out12 else ' · 다름: ' + (_run12.stderr[-200:] or _run12.stdout[-200:])))
_mk12 = _re3.search(r'^M = "([^"]+)"', _code12, _re3.M).group(1)
_PG12_JS = r"""const M=require(%s);const T=M.s12tools;const S=M.scenario('S12');const it=S.items.find(x=>x.mask_id===%s);const first=it.glasses.slice(0,4).map(g=>g.post),last=it.glasses.slice(4).map(g=>g.post);const e=T.repairEffect(first,last);
const over=S.items.filter(x=>x.metric>S.spec);const A=over.slice().sort((a,b)=>b.metric-a.metric)[0];
console.log(JSON.stringify({spec:S.spec,over:over.length,post_over:S.items.filter(x=>x.post_metric>S.spec).length,act:['none','correct','repair'].map(a=>S.items.filter(x=>x.action===a).length),ps:S.p_single,c2:T.chance(S.p_single,8,2).any,c3:T.chance(S.p_single,8,3).any,k:S.k_default,
 rep:S.items.filter(x=>T.repeat(x.counts,S.k_default).length>0).map(x=>[x.mask_id,T.repeat(x.counts,S.k_default).length]),met:it.metric,post:it.post_metric,action:it.action,kind:it.kind,KO:T.KIND_KO,pos:T.repeat(it.counts,S.k_default).map(q=>[q.px,q.py]),aa:{d:e.paired.diff,p:e.paired.p,wp:e.welch.p},A:A.mask_id,bt:S.bT.thermal,ratio:S.bT.ratio}));"""
_pj12 = json.loads(subprocess.run([_node, '-e', _PG12_JS % (json.dumps(_mf), json.dumps(_mk12))], capture_output=True, text=True, check=True).stdout)
_KO12 = {'mag': '배율 노화', 'ortho': '직교도', 'high': '고차 성분', 'stick': '스틱', 'local': '국소 결함'}; _LB12 = {'none': '조치 없음', 'correct': '보정만', 'repair': '리페어'}
_lit12 = lambda nm: float(_re3.search(r'^' + nm + r' = (-?[0-9.]+)', _code12, _re3.M).group(1))
_exp12 = ['유리 192장 · 마스크 24장 · 마스크마다 8장 (턴 안 순번 15~120)',
          f'spec {_pj12["spec"]:.3f} µm · 측정 지표가 spec 을 넘은 마스크 {_pj12["over"]}장 · 보정 후에도 넘는 마스크 {_pj12["post_over"]}장 (24장 중)',
          '판정: ' + ' · '.join(f'{k} {v}장' for k, v in zip(['조치 없음', '보정만', '리페어'], _pj12['act'])),
          f'한 장당 튄 점 비율 p = {_pj12["ps"]:.4f} · 우연 반복 확률 k=2 {_pj12["c2"]:.4f}, k=3 {_pj12["c3"]:.4f} → 기본 k = {_pj12["k"]}',
          f'반복 위치가 잡힌 마스크 {len(_pj12["rep"])}장: ' + ' · '.join(f'{m}({n}곳)' for m, n in _pj12['rep']),
          f'{_mk12}: 측정 지표 {_pj12["met"]:.2f} → 보정 후 {_pj12["post"]:.2f} µm · 판정 {_LB12[_pj12["action"]]} · 남은 몫 중 최대 {_KO12[_pj12["kind"]]} · 반복 위치 {sorted(tuple(p) for p in _pj12["pos"])}',
          f'점별 대응 비교 차 {_pj12["aa"]["d"]:+.3f} µm, p = {_pj12["aa"]["p"]:.2f} · 유리별 Welch p = {_pj12["aa"]["wp"]:.2f}']
_miss12 = [e for e in _exp12 if e not in _run12.stdout]
chk('0304 Python 출력의 숫자(유리·마스크 수, spec, 넘은 마스크 수, 판정 갈래별 마스크 수, 한 장당 튄 점 비율, 우연 반복 확률, 기본 k, 반복 위치 마스크, 문제 마스크의 지표·남은 몫·반복 위치, 대조의 대응 비교·Welch) = JS 대표 시드와 일치, 코드 속 spec·열변형 기울기·비·마스크 번호 = JS 값(반올림)', not _miss12 and abs(_lit12('SPEC') - _pj12['spec']) < 5e-4 and abs(_lit12('B_T') - _pj12['bt']) < 5e-7 and abs(_lit12('MY_RATIO') - _pj12['ratio']) < 5e-7 and _mk12 == _pj12['A'], ' · '.join(_exp12[1:3]) + ('' if not _miss12 else ' · 불일치: ' + ' | '.join(_miss12)))

# ============================================================
# S13 (0305) — 가상 계측: FDC 로 PPA 예측. 유리 1728장 계수·직선 회귀·회귀 트리(sklearn 대조)·시간순/섞어 나누기·측정 우선순위·EWMA 감시·시드 분포를 numpy·sklearn 으로 독립 구현해 JS 와 대조한다
# ============================================================
from sklearn.tree import DecisionTreeRegressor as _DTR
_S13_EXPORT = r"""const M=require(%s);const T=M.s13tools;const C=M.CFG;
const S0=M.scenario('S13',{seed:1});
const fixed={turn:S0.rows.map(r=>r.turn),git:S0.rows.map(r=>r.glass_in_turn),mask:S0.rows.map(r=>r.mask_no),mid:S0.rows.map(r=>r.mask_id)};
const seeds=[],SUB=[],detail={};let same=true,ref=null;for(let i=1;i<=40;i++)SUB.push(i);SUB.push(M.SEEDS.S13,200);
const nest=n=>n.feat<0?{f:-1,n:n.n}:{f:n.feat,t:n.thr,n:n.n,l:nest(n.left),r:nest(n.right)};
for(let sd=1;sd<=200;sd++){const S=M.scenario('S13',{seed:sd});const key=S.rows.map(r=>r.turn+'/'+r.glass_in_turn+'/'+r.mask_no).join();if(ref===null)ref=key;else if(key!==ref)same=false;
 const V=T.view(S);const m=T.metrics(S);const js={};Object.keys(m).forEach(k=>{if(typeof m[k]==='number'||typeof m[k]==='boolean')js[k]=m[k];});js.tree_valid=m.tree_valid;js.tree_test=m.tree_test;
 const o={seed:sd,v1:S.rows.map(r=>r.fdc_v1),dep:S.rows.map(r=>r.dep_rate),pr:S.rows.map(r=>r.pressure),mx:S.rows.map(r=>r.Mx_hat),js:js};
 if(SUB.indexOf(sd)>=0){o.preds=[];o.trees=[];for(let d=1;d<=8;d++){const tree=T.cart(T.range(V,1,12),d);o.preds.push(V.map(r=>T.treePred(tree,r,d)));o.trees.push(nest(tree));}}
 seeds.push(o);}
const dS=M.scenario('S13'),dV=T.view(dS),D=M.SEEDS.S13;
const mk=id=>M.makeMask(id,null,'S13-'+D);
function grids(sd,step){const S=M.scenario('S13',{seed:sd}),out=[];S.rows.forEach((r,i)=>{if(i%%step!==0)return;const mkk=M.makeMask(r.mask_id,null,'S13-'+sd),pm=M.parseMaskId(r.mask_id),t=S.truth[r.glass_id].T_true;
  const ctx={glass_id:r.glass_id,block:mkk.block,chamber:mkk.chamber,mask_set:mkk.set,turn:r.turn,glass_in_turn:r.glass_in_turn,chamber_temp:t};const g=M.ppa(ctx,mkk).grid;out.push({i:i,dx:g.map(q=>q.dx_um),dy:g.map(q=>q.dy_um),mx:r.Mx_hat});});return out;}
const lin={};[1,D,200].forEach(sd=>{const S=M.scenario('S13',{seed:sd}),V=T.view(S),f=T.lin(T.range(V,1,12),['dT','turn']).fit;lin[sd]={names:f.names,coef:f.names.map(n=>f.coef[n]),se:f.names.map(n=>f.se[n]),rss:f.rss,n:f.n};});
const dl={};[0,0.05,0.1,0.2,0.3,0.45,0.6].forEach(d=>{const m=T.metrics(dS,{delta:d});dl[d]={first:m.drift_first,delay:m.drift_delay,none:m.drift_none,pre:m.drift_pre,rec:m.rec_test};});
const tr=dS.truth;
console.log(JSON.stringify({fixed:fixed,same:same,seeds:seeds,def:D,L:T.L(),gridsD:grids(D,72),grids1:grids(1,72),lin:lin,dl:dl,
 truth:{T:dS.rows.map(r=>tr[r.glass_id].T_true),Mx:dS.rows.map(r=>tr[r.glass_id].Mx_true),th:dS.rows.map(r=>tr[r.glass_id].Mx_th),age:dS.rows.map(r=>tr[r.glass_id].Mx_age),mask:dS.rows.map(r=>tr[r.glass_id].Mx_mask)},
 csvRows:dS.csvRows().length,cfg:{am:C.ALPHA_M,ag:C.ALPHA_G,T0:C.T0,age:C.AGE_PPM_PER_TURN,clean:C.CLEAN_STEP_PPM},
 consts:{limit:T.LIMIT,q:T.Q,lam:T.LAM,calTurn:T.CAL_TURN,calDelta:T.CAL_DELTA,minleaf:T.MINLEAF,maxdepth:T.MAXDEPTH}}));"""
_s13 = json.loads(subprocess.run([_node, '-e', _S13_EXPORT % json.dumps(_mf)], capture_output=True, text=True, check=True, env=dict(os.environ, NODE_OPTIONS='--max-old-space-size=4096')).stdout)
_tn13 = np.array(_s13['fixed']['turn']); _gi13 = np.array(_s13['fixed']['git']); _mk13 = np.array(_s13['fixed']['mask']); _N13 = len(_tn13)
_tr13, _va13, _te13 = _tn13 <= 12, (_tn13 >= 13) & (_tn13 <= 16), _tn13 >= 17
_k13 = _s13['consts']; _d13 = _s13['def']; _L13 = py_L(_k13['lam'])
def py13_rm(y, p): return float(np.sqrt(np.mean((y - p) ** 2)))
def py13_lin(dT, y, sel, extra=()):                                                      # 마스크별 절편 12개 + 온도 + 턴(+ 추가 열), numpy lstsq
    D13 = np.column_stack([(_mk13 == m).astype(float) for m in range(12)] + [dT, _tn13.astype(float)] + list(extra))
    b = np.linalg.lstsq(D13[sel], y[sel], rcond=None)[0]; return D13 @ b, b
def py13_ewma(z, lam, L, reset_before):                                                  # 0204 의 EWMA: U = L·√(λ/(2−λ)), 변화 전 알람은 헛알람으로 세고 통계량을 0 으로
    U = L * np.sqrt(lam / (2 - lam)); w = 0.0; first = None; pre = []
    for i, v in enumerate(z):
        w = lam * v + (1 - lam) * w
        if abs(w) > U:
            if i + 1 < reset_before: pre.append(i + 1); w = 0.0
            elif first is None: first = i + 1
    return first, pre
def py13_drift(v1, y, b1, cal):
    rec = v1 + cal * (_tn13 >= _k13['calTurn']); D13 = np.column_stack([(_mk13 == m).astype(float) for m in range(12)] + [rec - 80, _tn13.astype(float)]); err = y - D13 @ b1
    o = np.lexsort((_gi13, _mk13, _tn13)); sel = o[_tn13[o] >= 13]; e = err[sel]; ev = e[_tn13[sel] <= 16]; z = (e - ev.mean()) / ev.std(ddof=1)
    shift = int(np.sum(_tn13[sel] < _k13['calTurn'])); first, pre = py13_ewma(z, _k13['lam'], _L13, shift + 1)
    return {'first': first, 'delay': (first - shift) if first else len(z) - shift + 1, 'none': first is None, 'pre': len(pre), 'rec': py13_rm(y[_te13], (D13 @ b1)[_te13])}
def py13_seed(s):
    v1 = np.array(s['v1']); dep = np.array(s['dep']); pr = np.array(s['pr']); y = np.array(s['mx']); dT = v1 - 80
    p1, b1 = py13_lin(dT, y, _tr13); p2, _ = py13_lin(dT, y, _tr13, (dep - 1, pr - 300))
    X = np.column_stack([v1, _tn13, _gi13, dep, pr, _mk13]); tv, tt, ttr = [], [], []
    for d in range(1, 9):
        p = _DTR(random_state=0, min_samples_leaf=_k13['minleaf'], max_depth=d).fit(X[_tr13], y[_tr13]).predict(X)
        ttr.append(py13_rm(y[_tr13], p[_tr13])); tv.append(py13_rm(y[_va13], p[_va13])); tt.append(py13_rm(y[_te13], p[_te13]))
    dp = int(np.argmin(tv)) + 1; msk = (np.arange(_N13) % 10) < 7
    ps, _ = py13_lin(dT, y, msk); shl = py13_rm(y[~msk], ps[~msk])
    sht = py13_rm(y[~msk], _DTR(random_state=0, min_samples_leaf=_k13['minleaf'], max_depth=dp).fit(X[msk], y[msk]).predict(X[~msk]))
    lt = py13_rm(y[_te13], p1[_te13]); tmn, tmx = v1[_tr13].min(), v1[_tr13].max()
    base = np.array([y[(_mk13 == m) & (_tn13 == 1)].mean() for m in range(12)])[_mk13]; ti = np.where(_te13)[0]
    pd_ = np.abs(p1[ti] - base[ti]); ex = (np.abs(y[ti] - base[ti]) > _k13['limit']).astype(int); mm = int(np.floor(_k13['q'] * len(ti) + 0.5)); order = np.argsort(-pd_, kind='stable')
    cap = ex[order[:mm]].sum() / ex.sum(); dr = py13_drift(v1, y, b1, _k13['calDelta'])
    return {'lin_train': py13_rm(y[_tr13], p1[_tr13]), 'lin_valid': py13_rm(y[_va13], p1[_va13]), 'lin_test': lt, 'lin2_test': py13_rm(y[_te13], p2[_te13]), 'depth': dp, 'tree_test_best': tt[dp - 1], 'tree_minus_lin': tt[dp - 1] - lt,
            'shuf_lin': shl, 'shuf_tree': sht, 'ratio_lin': shl / lt, 'ratio_tree': sht / tt[dp - 1], 'irrelevant_delta': py13_rm(y[_te13], p2[_te13]) - lt, 'out_frac': float(np.mean((v1[_te13] < tmn) | (v1[_te13] > tmx))),
            'capture': float(cap), 'gain': float(cap - mm / len(ti)), 'n_exceed': int(ex.sum()), 'drift_first': dr['first'], 'drift_delay': dr['delay'], 'drift_none': dr['none'], 'drift_pre': dr['pre'], 'rec_test': dr['rec'], 'tree_valid': tv, 'tree_test': tt}
# --- 1) 구조: 1728장, 시드마다 같은 순서, CSV = JS 행, 교정 변화 표시값 ---
_csv13 = rd('vm_s13.csv'); _sd13 = _s13['seeds'][_d13 - 1]
chk('S13 구조: 마스크 12장 × 24턴 × 6장 = 1728장(모든 시드), 시드마다 같은 순서, 턴 안 순번 5·20·40·60·90·120, CSV 행 수 = 1728 이고 glass_id 가 고유', _N13 == 1728 == 12 * 24 * 6 and _s13['same'] and sorted(set(_gi13.tolist())) == [5, 20, 40, 60, 90, 120] and len(_csv13) == 1728 == _s13['csvRows'] and _csv13.glass_id.is_unique, f'행 {_N13} · CSV 행 {len(_csv13)}')
_rec13 = np.array(_sd13['v1']) + _k13['calDelta'] * (_tn13 >= _k13['calTurn'])
chk('S13 센서 교정 변화: CSV 의 fdc_temp = 교정 변화 없는 표시값 + δ·[턴 ≥ 20](δ=0.3), cal_ver = [턴 ≥ 20], Mx̂·압력·증착률은 CSV 와 JS 대표 시드가 같음(소수 4~6자리)', np.abs(_csv13.fdc_temp.values - _rec13).max() < 2e-4 and (_csv13.cal_ver.values == (_tn13 >= _k13['calTurn'])).all() and np.abs(_csv13.Mx_hat.values - np.array(_sd13['mx'])).max() < 1e-9 and np.abs(_csv13.pressure.values - np.array(_sd13['pr'])).max() < 1e-9 and np.abs(_csv13.dep_rate.values - np.array(_sd13['dep'])).max() < 1e-9,
    f'fdc_temp 최대 차 {np.abs(_csv13.fdc_temp.values - _rec13).max():.1e}')
# --- 2) 정답 표와 무관 특징 ---
_tr13d = _s13['truth']; _cf13 = _s13['cfg']; _T13 = np.array(_tr13d['T']); _Mx13 = np.array(_tr13d['Mx']); _v1d = np.array(_sd13['v1']); _dpd = np.array(_sd13['dep']); _prd = np.array(_sd13['pr']); _mxd = np.array(_sd13['mx'])
_th13 = (_cf13['am'] - _cf13['ag']) * (_T13 - _cf13['T0']) * 1e6; _age13 = _cf13['age'] * _tn13 + _cf13['clean']
_cr13 = lambda a, b: float(np.corrcoef(a, b)[0, 1]); _res13 = _mxd - np.array(_tr13d['Mx']); _resw13 = _res13 - np.array([_res13[_mk13 == m].mean() for m in range(12)])[_mk13]
_crs13 = [_cr13(np.array(s['pr']), np.array(s['v1'])) for s in _s13['seeds']]
chk('S13 정답 표: 열변형 Mx_th = (α마스크 − α유리)·(참 온도 − 80)·10⁶ 1e-9, 턴 누적 Mx_age = −0.02·턴 − 0.05 1e-9, FDC 온도 − 참 온도의 표준편차 ≈ 0.04(±0.004), 마스크 안에서 Mx̂ − 참 Mx 의 표준편차 < 0.15 ppm(마스크마다 일정한 치우침은 스틱 누설이라 마스크별 절편이 흡수)',
    np.abs(np.array(_tr13d['th']) - _th13).max() < 1e-9 and np.abs(np.array(_tr13d['age']) - _age13).max() < 1e-9 and abs(float(np.std(_v1d - _T13)) - 0.04) < 0.004 and float(np.std(_resw13)) < 0.15, f'Mx_th 오차 {np.abs(np.array(_tr13d["th"]) - _th13).max():.1e} · FDC 잡음 sd {np.std(_v1d - _T13):.4f} · 마스크 안 Mx̂ 오차 sd {np.std(_resw13):.3f} (전체 {np.std(_res13):.3f})')
chk('S13 무관 특징: 증착률(평균 1, 표준편차 0.03)은 Mx̂ 오차(Mx̂ − 참 Mx)와 상관 0 근처(|r| < 0.1), 압력은 FDC 온도와 상관 약 0.5(시드 1~200 의 중앙값 0.45~0.55) 이면서 Mx̂ 오차와는 상관 0 근처(|r| < 0.1)',
    abs(_dpd.mean() - 1) < 0.005 and abs(_dpd.std() - 0.03) < 0.003 and abs(_cr13(_dpd, _res13)) < 0.1 and abs(_cr13(_prd, _res13)) < 0.1 and 0.45 < np.median(_crs13) < 0.55, f'증착률 평균 {_dpd.mean():.4f} sd {_dpd.std():.4f} · r(증착률, 오차) {_cr13(_dpd, _res13):+.3f} · r(압력, 오차) {_cr13(_prd, _res13):+.3f} · r(압력, FDC 온도) 중앙값 {np.median(_crs13):.3f} (범위 {min(_crs13):.2f}~{max(_crs13):.2f})')
# --- 3) 격자 → Mx̂: numpy lstsq 독립 재현 ---
_g13 = _s13['gridsD'] + _s13['grids1']; _gd13 = max(abs(np.linalg.lstsq(_X11, np.r_[g['dx'], g['dy']], rcond=None)[0][3] - g['mx']) for g in _g13)
chk('S13 격자 → Mx̂: 시드 %d·1 의 유리 24장씩(총 %d장)을 77점 격자에서 numpy lstsq 로 다시 푼 Mx 가 표의 Mx̂ 와 소수 6자리(5e-7) 안에서 같음' % (_d13, len(_g13)), len(_g13) == 48 and _gd13 < 5e-7, f'최대 차 {_gd13:.1e}')
# --- 4) 직선 계수 ---
_ld13 = 0.0; _lse13 = 0.0
for sd_, rec_ in _s13['lin'].items():
    s_ = _s13['seeds'][int(sd_) - 1]; y_ = np.array(s_['mx']); dT_ = np.array(s_['v1']) - 80
    D_ = np.column_stack([(_mk13 == m).astype(float) for m in range(12)] + [dT_, _tn13.astype(float)])[_tr13]; b_ = np.linalg.lstsq(D_, y_[_tr13], rcond=None)[0]; r_ = y_[_tr13] - D_ @ b_; sg_ = np.sqrt(float(r_ @ r_) / (len(r_) - 14)); se_ = sg_ * np.sqrt(np.diag(np.linalg.inv(D_.T @ D_)))
    _ld13 = max(_ld13, float(np.abs(b_ - np.array(rec_['coef'])).max())); _lse13 = max(_lse13, float(np.abs(se_ - np.array(rec_['se'])).max()))
chk('S13 직선 계수: 마스크별 절편 12개 + 온도 + 턴(학습 턴 1~12)을 numpy lstsq 로 독립 재현한 계수 14개·표준오차가 JS 와 1e-9 (시드 1·대표 시드·200)', _ld13 < 1e-9 and _lse13 < 1e-9, f'계수 최대 차 {_ld13:.1e} · 표준오차 최대 차 {_lse13:.1e}')
# --- 5) JS CART vs sklearn DecisionTreeRegressor(random_state=0, min_samples_leaf=5): 깊이 1~8, 시드 1~40·150·200 ---
def py13_cmp(jn, sk, sid, X32, idx, depth, dmax):                                         # 같은 분할이거나, 달라도 이 노드의 표본을 똑같이 둘로 가르는(왼쪽·오른쪽이 서로 바뀌어도 같은 묶음) 동점 분할이면 참
    js_leaf = jn['f'] < 0 or depth >= dmax; sk_leaf = sk.children_left[sid] == -1
    if js_leaf and sk_leaf: return 'same' if int(sk.n_node_samples[sid]) == jn['n'] else 'bad'
    if js_leaf != sk_leaf: return 'bad'
    f_s, t_s = int(sk.feature[sid]), float(sk.threshold[sid]); same = jn['f'] == f_s and abs(jn['t'] - t_s) < 1e-9
    Lj = X32[idx, jn['f']] <= jn['t']; Ls = X32[idx, f_s] <= t_s
    if same: a = py13_cmp(jn['l'], sk, sk.children_left[sid], X32, idx[Lj], depth + 1, dmax); b = py13_cmp(jn['r'], sk, sk.children_right[sid], X32, idx[~Lj], depth + 1, dmax)
    elif np.array_equal(Lj, Ls): a = py13_cmp(jn['l'], sk, sk.children_left[sid], X32, idx[Lj], depth + 1, dmax); b = py13_cmp(jn['r'], sk, sk.children_right[sid], X32, idx[~Lj], depth + 1, dmax)
    elif np.array_equal(Lj, ~Ls): a = py13_cmp(jn['l'], sk, sk.children_right[sid], X32, idx[Lj], depth + 1, dmax); b = py13_cmp(jn['r'], sk, sk.children_left[sid], X32, idx[~Lj], depth + 1, dmax)
    else: return 'bad'
    if 'bad' in (a, b): return 'bad'
    return 'same' if (same and a == 'same' and b == 'same') else 'tie'
_cexact = _ctie = _cbad = 0; _cn = 0; _cmax = 0.0; _crep = True
for s_ in _s13['seeds']:
    if 'preds' not in s_: continue
    X_ = np.column_stack([s_['v1'], _tn13, _gi13, s_['dep'], s_['pr'], _mk13]); y_ = np.array(s_['mx']); X32 = X_.astype(np.float32).astype(np.float64); worst = 'same'; mxd = 0.0
    for d in range(1, 9):
        m_ = _DTR(random_state=0, min_samples_leaf=5, max_depth=d).fit(X_[_tr13], y_[_tr13]); p_ = m_.predict(X_); mxd = max(mxd, float(np.abs(p_ - np.array(s_['preds'][d - 1])).max()))
        c_ = py13_cmp(s_['trees'][d - 1], m_.tree_, 0, X32[_tr13], np.arange(int(_tr13.sum())), 0, d)
        worst = 'bad' if c_ == 'bad' or worst == 'bad' else ('tie' if 'tie' in (c_, worst) else 'same')
    _cn += 1; _cmax = max(_cmax, mxd)
    if worst == 'same': _cexact += 1
    elif worst == 'tie': _ctie += 1
    else: _cbad += 1
    if s_['seed'] == _d13 and mxd > 1e-9: _crep = False
chk('S13 회귀 트리(CART) = sklearn DecisionTreeRegressor(random_state=0, min_samples_leaf=5): 대표 시드는 깊이 1~8 모두 시험 구간 포함 전 유리의 예측이 같고, 다른 시드(1~40·200)는 모두 (같은 분할이거나) 같은 표본을 똑같이 둘로 가르는 두 특징이 동점일 때 고른 특징만 다른 경우 — 구조가 어긋난 시드 0',
    _crep and _cbad == 0 and _cn >= 40, f'시드 {_cn}개 × 깊이 8개: 모든 깊이에서 완전 일치 {_cexact}개 · 동점으로만 다름 {_ctie}개 · 어긋남 {_cbad}개 · 예측 최대 차 {_cmax:.3f} (동점이면 sklearn 은 무작위 순서로 훑은 특징 가운데 먼저 뽑힌 쪽을 쓰는데, JS 는 그 순서를 따라 하되 동점끼리의 합이 끝자리(1e-16)에서 달라지면 다르게 고를 수 있음)')
# --- 6) 지표 독립 재현(시드 1~200) ---
_P13 = [py13_seed(s) for s in _s13['seeds']]
_nt13 = ['lin_train', 'lin_valid', 'lin_test', 'lin2_test', 'shuf_lin', 'ratio_lin', 'irrelevant_delta', 'out_frac', 'capture', 'gain', 'n_exceed', 'drift_delay', 'drift_pre', 'rec_test']
_bad13 = {k: max(abs(float(P[k]) - float(s['js'][k])) for P, s in zip(_P13, _s13['seeds'])) for k in _nt13}
_bad13['drift_first_none'] = sum((P['drift_first'] is None) != s['js']['drift_none'] for P, s in zip(_P13, _s13['seeds']))
chk('S13 시드 1~200 지표 재계산(직선·직선+무관 특징 시험 RMSE, 섞어 나누기 RMSE 와 비, 시험 구간 학습 범위 밖 온도 비율, 측정 우선순위 포착률, EWMA 첫 알람 지연·헛알람 수, 교정 변화 뒤 시험 RMSE): numpy 로 독립 구현해 JS 와 1e-9',
    all(v < 1e-9 for v in _bad13.values()), '최대 차 ' + ' · '.join(f'{k} {v:.0e}' for k, v in _bad13.items() if k != 'drift_first_none') + f' · 알람 유무 불일치 {_bad13["drift_first_none"]}시드')
_dtree13 = np.array([abs(P['tree_test_best'] - s['js']['tree_test_best']) for P, s in zip(_P13, _s13['seeds'])]); _dd13 = np.array([P['depth'] == s['js']['depth'] for P, s in zip(_P13, _s13['seeds'])])
_dts13 = np.array([abs(P['shuf_tree'] - s['js']['shuf_tree']) for P, s in zip(_P13, _s13['seeds'])])
chk('S13 트리 지표(검증 구간으로 고른 깊이·시험 RMSE·섞어 나눈 트리 RMSE): sklearn 값과 JS 값이 대표 시드에서 1e-9 로 같고 다른 시드에서는 동점 분할 때문에 조금 다를 수 있음 — 시험 RMSE 차의 최대·중앙값, 깊이가 같은 시드 수를 기록, 모든 시드에서 차 < 0.03',
    _dtree13[_d13 - 1] < 1e-9 and _dts13[_d13 - 1] < 1e-9 and _dtree13.max() < 0.03, f'시험 RMSE 차 최대 {_dtree13.max():.4f} · 중앙값 {np.median(_dtree13):.1e} · 완전히 같은 시드 {(_dtree13 < 1e-9).sum()}개/200 · 깊이 같은 시드 {int(_dd13.sum())}개/200 · 섞어 나눈 트리 RMSE 차 최대 {_dts13.max():.4f}')
chk('S13 EWMA 한계: JS 의 L(λ=0.2) = Python 독립 이분법과 1e-3 이내, 그 값에서 ARL0 = 370.4±1 (0204 와 같은 설정)', abs(_s13['L'] - _L13) < 1e-3 and abs(py_arl_ewma(_k13['lam'], _s13['L'], 0) - 370.4) < 1, f'JS {_s13["L"]:.4f} · Python {_L13:.4f}')
_dlv13 = {float(k): v for k, v in _s13['dl'].items()}; _dpy13 = {d: py13_drift(np.array(_sd13['v1']), np.array(_sd13['mx']), py13_lin(np.array(_sd13['v1']) - 80, np.array(_sd13['mx']), _tr13)[1], d) for d in _dlv13}
_dls13 = sorted(_dlv13)
chk('S13 교정 변화 슬라이더(δ 0~0.6): 대표 시드에서 δ 마다 첫 알람·헛알람 수·교정 변화 뒤 시험 RMSE 가 Python 독립 구현과 같고, δ 가 커질수록 알람 지연이 줄거나 같고(단조) 시험 RMSE 는 늘어남(δ = 0 에서 난 알람은 교정 변화가 없으니 헛알람)',
    all(_dlv13[d]['first'] == _dpy13[d]['first'] and _dlv13[d]['pre'] == _dpy13[d]['pre'] and abs(_dlv13[d]['rec'] - _dpy13[d]['rec']) < 1e-9 for d in _dls13) and all(_dlv13[a]['delay'] >= _dlv13[b]['delay'] for a, b in zip(_dls13, _dls13[1:])) and all(_dlv13[a]['rec'] < _dlv13[b]['rec'] for a, b in zip(_dls13, _dls13[1:])),
    ' · '.join(f'δ {d}: 지연 {_dlv13[d]["delay"]} · 헛알람 {_dlv13[d]["pre"]} · 시험 RMSE {_dlv13[d]["rec"]:.3f}' for d in _dls13))
# --- 7) 분포·대표 시드 ---
_m13 = ['lin_test', 'tree_minus_lin', 'ratio_lin', 'irrelevant_delta', 'gain', 'drift_delay']; _nm13 = ['직선 시험 RMSE', '트리 − 직선 시험 RMSE', '섞어 나누기 ÷ 시간순 RMSE', '무관 특징을 넣어 생긴 시험 RMSE 변화', '측정 우선순위 포착률 − 무작위', '드리프트 첫 알람 지연']
_A13 = {m: np.array([P[m] for P in _P13], float) for m in _m13}; _A13j = {m: np.array([s['js'][m] for s in _s13['seeds']], float) for m in _m13}
def _rk13(A, m, i): a = A[m]; return float(((a < a[i]).sum() + 0.5 * (a == a[i]).sum()) / len(a))
_sc13 = np.array([sum(abs(_rk13(_A13, m, i) * 100 - 50) for m in _m13) for i in range(200)]); _scj13 = np.array([sum(abs(_rk13(_A13j, m, i) * 100 - 50) for m in _m13) for i in range(200)])
chk('S13 대표 시드(SEEDS.S13): 여섯 지표 백분위의 Σ|백분위−50| 이 시드 1~200 중 가장 작은 시드이고(sklearn 으로 잰 값과 JS 로 잰 값 모두), 25~75% 밖 지표를 기록(본문은 그 지표를 분포로 말해야 함)', int(np.argmin(_sc13)) == _d13 - 1 and int(np.argmin(_scj13)) == _d13 - 1,
    f'SEEDS.S13 = {_d13}, Σ = {_sc13[_d13 - 1]:.1f} (JS 값 {_scj13[_d13 - 1]:.1f}) · 25~75% 밖: ' + (' · '.join(f'{n} {_rk13(_A13, m, _d13 - 1)*100:.0f}%' for m, n in zip(_m13, _nm13) if not 0.25 <= _rk13(_A13, m, _d13 - 1) <= 0.75) or '없음') + ' / 안: ' + ' · '.join(f'{n} {_rk13(_A13, m, _d13 - 1)*100:.0f}%' for m, n in zip(_m13, _nm13) if 0.25 <= _rk13(_A13, m, _d13 - 1) <= 0.75))
_p13 = lambda a: f'{np.median(a):.4g} (10~90%: {np.quantile(a, .1):.4g}~{np.quantile(a, .9):.4g})'
chk('S13 분포(시드 200) 기록: 여섯 지표와 검증으로 고른 트리 깊이·시험 구간 학습 범위 밖 온도 비율·변화 전 헛알람 수', all(np.isfinite(_A13[m]).all() for m in _m13), ' · '.join(f'{n} {_p13(_A13[m])}' for m, n in zip(_m13, _nm13)) + f' · 깊이 {_p13([P["depth"] for P in _P13])} · 범위 밖 온도 {_p13([P["out_frac"] for P in _P13])} · 헛알람 {_p13([P["drift_pre"] for P in _P13])}')
# --- 8) 설계서 기대 vs 실제 ---
_fl13 = float(np.mean([P['ratio_lin'] < 1 for P in _P13])); _ft13 = float(np.mean([P['ratio_tree'] < 1 for P in _P13])); _tl13 = float(np.mean([P['tree_minus_lin'] > 0 for P in _P13]))
chk('S13 설계 기대 1 — 섞어 나누기 RMSE < 시간순 RMSE 인 시드 비율: 회귀 트리는 거의 모든 시드(≥ 95%)에서 섞어 나눈 쪽이 작아 낙관 편향이 뚜렷하고, 직선은 그렇지 않음(비 ≈ 1: 중앙값이 0.95~1.05, 시드 비율 30~70%)', _ft13 >= 0.95 and 0.3 <= _fl13 <= 0.7 and 0.95 < np.median(_A13['ratio_lin']) < 1.05,
    f'트리: 섞어 나눈 쪽이 작은 시드 {_ft13*100:.0f}% (비 {_p13([P["ratio_tree"] for P in _P13])}) · 직선: {_fl13*100:.0f}% (비 {_p13(_A13["ratio_lin"])})')
chk('S13 설계 기대 2 — 트리 − 직선 시험 RMSE > 0 인 시드 비율 ≥ 95% (이 공정은 배율이 온도·턴에 직선이고 마스크 절편은 정수 번호로는 트리가 쓰기 어려움), 시험 구간에서 학습 범위 밖 온도인 유리가 있음(중앙값 > 0)', _tl13 >= 0.95 and np.median([P['out_frac'] for P in _P13]) > 0, f'트리가 직선보다 나쁜 시드 {_tl13*100:.0f}% · 트리 − 직선 {_p13(_A13["tree_minus_lin"])} · 범위 밖 온도 {_p13([P["out_frac"] for P in _P13])}')
chk('S13 설계 기대 3 — 측정 우선순위(예측 편차 큰 순 상위 20%)의 포착률이 무작위(20%)보다 높음(모든 시드), 무관 특징(증착률·압력)을 넣어도 시험 RMSE 변화가 작음(|변화| < 0.01, 모든 시드)', bool((_A13['gain'] > 0).all()) and bool((np.abs(_A13['irrelevant_delta']) < 0.01).all()), f'포착률 − 무작위 {_p13(_A13["gain"])} · 무관 특징 시험 RMSE 변화 {_p13(_A13["irrelevant_delta"])}')
chk('S13 설계 기대 4 — 교정 변화(+0.3 K) 뒤 EWMA 가 모든 시드에서 알람을 내고 지연 중앙값이 5장 이하, 교정 변화 뒤 시험 RMSE 가 변화 전 시험 RMSE 보다 큼(모든 시드)', all(not P['drift_none'] for P in _P13) and np.median(_A13['drift_delay']) <= 5 and all(P['rec_test'] > P['lin_test'] for P in _P13),
    f'알람 지연 {_p13(_A13["drift_delay"])} · 교정 변화 뒤 시험 RMSE {_p13([P["rec_test"] for P in _P13])} (변화 없을 때 {_p13(_A13["lin_test"])})')

# --- 9) 0305 페이지의 Python 블록: 그대로 실행한 출력 = 페이지에 적힌 출력, 출력의 숫자 = JS 대표 시드의 값 ---
_pg13 = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'labs', '0305-virtual-metrology.html'), encoding='utf-8').read()
_code13 = _html3.unescape(_re3.search(r'<pre id="pyCode">(.*?)</pre>', _pg13, _re3.S).group(1)); _out13 = _html3.unescape(_re3.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg13, _re3.S).group(1)).strip()
with _tf3.TemporaryDirectory() as _td13:
    shutil.copy(os.path.join(D, 'vm_s13.csv'), _td13); open(os.path.join(_td13, 'lab0305.py'), 'w', encoding='utf-8').write(_code13)
    _run13 = subprocess.run([sys.executable, '-I', 'lab0305.py'], cwd=_td13, capture_output=True, text=True)
chk('0305 페이지의 Python 블록을 CSV 에 그대로 실행한 출력 = 페이지에 적힌 출력', _run13.returncode == 0 and _run13.stdout.strip() == _out13, f'종료 {_run13.returncode} · 출력 {len(_run13.stdout.splitlines())}줄' + ('' if _run13.stdout.strip() == _out13 else ' · 다름: ' + (_run13.stderr[-200:] or _run13.stdout[-200:])))
_PG13_JS = r"""const M=require(%s);const T=M.s13tools;const S=M.scenario('S13');const V=T.view(S),tr=T.range(V,1,12),va=T.range(V,13,16),te=T.range(V,17,24);
const L1=T.lin(tr,['dT','turn']),LA=T.lin(V,['dT','turn']),sh=T.shuffle(V),LS=T.lin(sh.train,['dT','turn']);const tv=[];let dep=1;const TT=[];
for(let d=1;d<=8;d++){const t=T.cart(tr,d);tv.push(T.rmse(va,r=>T.treePred(t,r,d)));TT.push(T.rmse(te,r=>T.treePred(t,r,d)));if(tv[d-1]<tv[dep-1])dep=d;}
const ta=T.cart(V,dep),ts=T.cart(sh.train,dep);let lo=1e9,hi=-1e9;tr.forEach(r=>{lo=Math.min(lo,r.temp);hi=Math.max(hi,r.temp);});
const out=te.filter(r=>r.temp<lo||r.temp>hi).length;const p=T.priority(te,L1.pred,T.base(V),T.LIMIT,T.Q);const dr=T.drift(S,L1.pred,{});
console.log(JSON.stringify({lall:T.rmse(V,LA.pred),lsh:T.rmse(sh.test,LS.pred),lte:T.rmse(te,L1.pred),ltr:T.rmse(tr,L1.pred),lva:T.rmse(va,L1.pred),bT:L1.fit.coef.dT,bN:L1.fit.coef.turn,tv:tv,dep:dep,tall:T.rmse(V,r=>T.treePred(ta,r,dep)),tsh:T.rmse(sh.test,r=>T.treePred(ts,r,dep)),tte:TT[dep-1],lo:lo,hi:hi,out:out/te.length,cap:p.capture,rnd:p.random,nex:p.n_exceed,
 rec:T.rmse(T.range(T.view(S,{recorded:true}),17,24),L1.pred),first:dr.first,shift:dr.shift_at,pre:dr.pre.length,L:T.L()}));"""
_pj13 = json.loads(subprocess.run([_node, '-e', _PG13_JS % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
_exp13 = ['유리 1728장 · 마스크 12장 · 턴 1~24 · 센서 교정 이력: 턴 20 부터 +0.3 K',
          f'같은 자료로 잰 RMSE {_pj13["lall"]:.3f} · 섞어 나눈 시험 {_pj13["lsh"]:.3f} · 시간순 시험 {_pj13["lte"]:.3f} ppm (학습 {_pj13["ltr"]:.3f} · 검증 {_pj13["lva"]:.3f})',
          f'직선 계수: 열변형 {_pj13["bT"]:+.3f} ppm/K · 턴 {_pj13["bN"]:+.4f} ppm/턴',
          '트리 깊이 1~8 의 검증 RMSE: ' + ' '.join(f'{v:.3f}' for v in _pj13['tv']) + f' → 고른 깊이 {_pj13["dep"]}',
          f'트리(깊이 {_pj13["dep"]}): 같은 자료로 잰 RMSE {_pj13["tall"]:.3f} · 섞어 나눈 시험 {_pj13["tsh"]:.3f} · 시간순 시험 {_pj13["tte"]:.3f} ppm → 직선보다 {_pj13["tte"] - _pj13["lte"]:+.3f}',
          f'학습 구간 온도 범위 {_pj13["lo"]:.2f}~{_pj13["hi"]:.2f} °C · 시험 유리 중 범위 밖 {_pj13["out"]:.1%}',
          f'한계를 넘은 유리 {_pj13["nex"]}장 중 포착률 {_pj13["cap"]:.3f} · 무작위 기대 {_pj13["rnd"]:.3f}',
          f'교정 변화 뒤 시험 RMSE: 표시값 그대로 {_pj13["rec"]:.3f} · 교정 이력으로 되돌린 값 {_pj13["lte"]:.3f} ppm',
          f'변화 전 헛알람 {_pj13["pre"]}건 · 교정 변화 뒤 {_pj13["first"] - _pj13["shift"] + 1}번째 유리에서 첫 알람']
_lit13 = lambda nm: float(_re3.search(r'^' + nm + r' = ([0-9.]+)', _code13, _re3.M).group(1))
_miss13 = [e for e in _exp13 if e not in _run13.stdout]
chk('0305 Python 출력의 숫자(직선의 같은 자료·섞어 나눈·시간순 RMSE와 계수, 트리 검증 RMSE·고른 깊이·세 가지 방식, 학습 온도 범위와 범위 밖 비율, 포착률, 교정 변화 뒤 RMSE, 헛알람·첫 알람 지연) = JS 대표 시드와 일치, 코드 속 한계·먼저 잴 비율·λ·L·교정 이력 = JS 값', not _miss13 and f"LIMIT, Q = {_k13['limit']}, {_k13['q']}" in _code13 and abs(_pj13['L'] - 2.8599) < 5e-5 and 'CAL_TURN, CAL_SHIFT = %d, %s' % (_k13['calTurn'], _k13['calDelta']) in _code13, ' · '.join(_exp13[1:2]) + ('' if not _miss13 else ' · 불일치: ' + ' | '.join(_miss13)))


# ============================================================
# S14 (0306) — 마스크 수명 예측: 보정 후 턴 평균·마스크별/공통 기울기·이질성 F·예측 구간·잔여 수명·일정 모의 세 규칙·시드 분포를 numpy·scipy 로 독립 구현해 JS 와 대조한다
# ============================================================
_S14_EXPORT = r"""const M=require(%s);const T=M.s14tools;const C=M.CFG;const crypto=require('crypto');
const out=[];let ref=null,same=true;
function pack(S,o){const fit=T.fit(S.table),sim=T.sim(S,fit,o||{});return {fit:fit,sim:sim};}
for(let sd=1;sd<=200;sd++){const S=M.scenario('S14',{seed:sd});const key=S.glass.map(r=>r.mask_id+'/'+r.turn+'/'+r.glass_in_turn).join();if(ref===null)ref=key;else if(key!==ref)same=false;
 const P=pack(S),m=T.metrics(S);
 out.push({seed:sd,masks:S.masks.map(k=>[k.a0,k.record?1:0,k.age_base]),y:S.masks.map(k=>S.table.y[k.mask_id]),base:S.masks.map(k=>S.table.baseline[k.mask_id]),js:m,noise:P.sim.noise,
  early:P.sim.est.map(e=>e.r.judged?e.r.early:null),late:P.sim.est.map(e=>e.r.judged?e.r.late:null),khat:P.sim.est.map(e=>e.r.judged?e.r.k_hat:null),
  A:[P.sim.A.exceed,P.sim.A.repairs,P.sim.A.waste,P.sim.A.out_turns],B:[P.sim.B.exceed,P.sim.B.repairs,P.sim.B.waste,P.sim.B.out_turns],Cc:[P.sim.C.exceed,P.sim.C.repairs,P.sim.C.waste,P.sim.C.out_turns],
  fit:{bp:P.fit.b_pool,sep:P.fit.se_pool,F:P.fit.F,p:P.fit.p,sp:P.fit.s_pool,df:P.fit.df_pool}});}
const def=M.SEEDS.S14,S0=M.scenario('S14'),fit0=T.fit(S0.table);
const variants=[];[[0.5,1,2],[0.5,2,2],[0.5,3,2],[0.3,1,2],[0.8,1,2],[0.5,1,4],[0.5,2,1],[0.65,3,3]].forEach(v=>{const sm=T.sim(S0,fit0,{limit:v[0],capacity:v[1],out:v[2]});
 variants.push({v:v,A:[sm.A.exceed,sm.A.repairs,sm.A.waste,sm.A.out_turns,sm.A.grid.map(g=>g.join(''))],B:[sm.B.exceed,sm.B.repairs,sm.B.waste,sm.B.out_turns,sm.B.grid.map(g=>g.join(''))],C:[sm.C.exceed,sm.C.repairs,sm.C.waste,sm.C.out_turns,sm.C.grid.map(g=>g.join(''))],N:sm.N,life:sm.life,
  early:sm.est.map(e=>e.r.judged?e.r.early:null),noise:sm.noise});});
const mask=T.sim(S0,fit0,{model:'mask'}),maskEst=mask.est.map(e=>e.r.judged?{early:e.r.early,late:e.r.late,k:e.r.k_hat,ciE:e.r.ci_early,ciL:e.r.ci_late}:null),poolEst=T.sim(S0,fit0,{}).est.map(e=>e.r.judged?{early:e.r.early,late:e.r.late,k:e.r.k_hat,ciE:e.r.ci_early,ciL:e.r.ci_late}:null);
const grids=[];[1,def].forEach(sd=>{const S=M.scenario('S14',{seed:sd});S.glass.forEach((r,i)=>{if(i%%48!==0)return;const mk=M.makeMask(r.mask_id,null,'S14-'+sd),pm=M.parseMaskId(r.mask_id);mk.age_base=S.masks.find(x=>x.mask_id===r.mask_id).age_base;
 const ctx={glass_id:r.glass_id,block:mk.block,chamber:mk.chamber,mask_set:mk.set,turn:r.cal_turn,glass_in_turn:r.glass_in_turn,chamber_temp:S.truth[r.glass_id].T_true};const g=M.ppa(ctx,mk).grid;grids.push({dx:g.map(q=>q.dx_um),dy:g.map(q=>q.dy_um),mx:r.Mx_hat});});
 S.base.forEach((r,i)=>{if(i%%16!==0)return;const mk=M.makeMask(r.mask_id,null,'S14-'+sd),pm=M.parseMaskId(r.mask_id);mk.age_base=S.masks.find(x=>x.mask_id===r.mask_id).age_base;
 const ctx={glass_id:r.glass_id,block:mk.block,chamber:mk.chamber,mask_set:mk.set,turn:r.cal_turn,glass_in_turn:r.glass_in_turn,chamber_temp:S.truth[r.glass_id].T_true};const g=M.ppa(ctx,mk).grid;grids.push({dx:g.map(q=>q.dx_um),dy:g.map(q=>q.dy_um),mx:r.Mx_hat});});});
const g0=S0.glass.map(r=>[r.mask_id,r.turn,r.glass_in_turn,r.fdc_temp,r.Mx_hat,r.Mx_comp]),b0=S0.base.map(r=>[r.mask_id,r.fdc_temp,r.Mx_hat,r.Mx_comp]);
const tr={};S0.glass.slice(0,60).concat(S0.base).forEach(r=>{tr[r.glass_id]=S0.truth[r.glass_id];});
const tinv={};[6,10,50,167,500].forEach(d=>[0.05,0.01,0.2].forEach(a=>{tinv[d+'_'+a]=T.tinv(d,a);}));
const h=s=>crypto.createHash('sha256').update(s).digest('hex'),hs={};for(let i=1;i<=13;i++)hs['S'+i]=h(JSON.stringify(M.scenario('S'+i)));hs.loss=h(JSON.stringify(M.simulateLoss()));
console.log(JSON.stringify({seeds:out,same:same,def:def,variants:variants,maskEst:maskEst,poolEst:poolEst,grids:grids,g0:g0,b0:b0,truth:tr,tinv:tinv,hs:hs,thermal:S0.params.thermal,params:S0.params,masks0:S0.masks.map(k=>({id:k.mask_id,a0:k.a0,rec:k.record,ab:k.age_base})),
  cfg:{age:C.AGE_PPM_PER_TURN,clean:C.CLEAN_STEP_PPM,T0:C.T0,N_TURN:C.N_TURN,am:C.ALPHA_M,ag:C.ALPHA_G},ids:T.IDS,gits:T.GITS,W:T.W,hz:T.HORIZON,tab0:S0.table.rows.map(r=>[r.mask_id,r.turn,r.age_known,r.Mx_comp,r.baseline])}));"""
_s14 = json.loads(subprocess.run([_node, '-e', _S14_EXPORT % json.dumps(_mf)], capture_output=True, text=True, check=True, env=dict(os.environ, NODE_OPTIONS='--max-old-space-size=4096')).stdout)
_d14 = _s14['def']; _P14 = _s14['params']; _c14 = _s14['cfg']; _W14 = _s14['W']; _H14 = _s14['hz']; _X14 = np.arange(1, _W14 + 1, dtype=float); _xb14 = _X14.mean(); _sxx14 = float(((_X14 - _xb14) ** 2).sum())
_ge14 = lambda a, i: a[i]
def py14_tinv(df, a): return float(stats.t.ppf(1 - a / 2, df))
def py14_fit(Y):                                                                  # Y (M,8): 마스크별 직선, 공통 기울기 + 마스크별 절편(numpy lstsq), 이질성 F·p(scipy)
    M_ = Y.shape[0]; yb = Y.mean(1); b_ = ((Y - yb[:, None]) * (_X14 - _xb14)).sum(1) / _sxx14; a_ = yb - b_ * _xb14
    rss_ = ((Y - (a_[:, None] + b_[:, None] * _X14)) ** 2).sum(1); s_ = np.sqrt(rss_ / (_W14 - 2)); se_ = s_ / np.sqrt(_sxx14)
    Xd = np.column_stack([np.kron(np.eye(M_), np.ones((_W14, 1))), np.tile(_X14, M_)]); yv = Y.reshape(-1); bb = np.linalg.lstsq(Xd, yv, rcond=None)[0]; rp = float(((yv - Xd @ bb) ** 2).sum())
    dfp = M_ * _W14 - (M_ + 1); sp = np.sqrt(rp / dfp); dfs = M_ * _W14 - 2 * M_; F = ((rp - rss_.sum()) / (M_ - 1)) / (rss_.sum() / dfs)
    return {'a': a_, 'b': b_, 's': s_, 'se': se_, 'bp': float(bb[-1]), 'ap': bb[:-1], 'sp': float(sp), 'sep': float(sp / np.sqrt(M_ * _sxx14)), 'dfp': dfp, 'F': float(F), 'p': float(stats.f.sf(F, M_ - 1, dfs)), 'M': M_}
def py14_cross(fn, line, kmax=100.0):
    if fn(0.0) <= line: return 0.0
    from scipy.optimize import brentq
    ks = np.arange(0.25, kmax + 1e-9, 0.25)
    for k in ks:
        if fn(float(k)) <= line: return float(brentq(lambda z: fn(z) - line, k - 0.25, float(k), xtol=1e-13, rtol=1e-13))
    return None
def py14_rem(a, b, s, df, sxx_eff, base, L, alpha=0.05):                          # 잔여 수명과 예측 구간·신뢰구간(미래 평균)의 이른·늦은 끝
    tq = py14_tinv(df, alpha); line = base - L; ycur = a + b * _W14
    hw = lambda k: tq * s * np.sqrt(1 + 1 / _W14 + (_W14 + k - _xb14) ** 2 / sxx_eff); mid = lambda k: a + b * (_W14 + k)
    cw = lambda k: tq * s * np.sqrt(1 / _W14 + (_W14 + k - _xb14) ** 2 / sxx_eff)
    return {'k': (line - ycur) / b if b < 0 else None, 'early': py14_cross(lambda k: mid(k) - hw(k), line), 'late': py14_cross(lambda k: mid(k) + hw(k), line), 'ciE': py14_cross(lambda k: mid(k) - cw(k), line), 'ciL': py14_cross(lambda k: mid(k) + cw(k), line)}
def py14_life(L): return round(1 + L / -_c14['age'], 9)
def py14_sim(a0, rec, early, noise, sig, L, cap, R, H):                            # 규칙 A·B·C 일정 모의(JS 와 같은 규칙을 파이썬으로 다시)
    life = py14_life(L); N = int(np.ceil(life)) - 1; Mn = len(a0); mage = lambda a: _c14['age'] * a + _c14['clean']; res = {}
    for rule in 'ABC':
        age = [a + 1 for a in a0]; outu = [0] * Mn; done = [False] * Mn; alarmed = []; grid = [[] for _ in range(Mn)]; ex = rp = outT = 0; wa = 0.0; plan = {}
        if rule == 'C':
            slots = {}; jobs = sorted([(1 if not rec[i] else max(1, (np.inf if early[i] is None else int(np.floor(early[i])) + 1)), i) for i in range(Mn)])
            for d, i in jobs:
                if d > H: continue
                pick = None
                for u in range(int(d), 0, -1):
                    if slots.get(u, 0) < cap: pick = u; break
                if pick is None:
                    for u in range(int(d) + 1, H + 1):
                        if slots.get(u, 0) < cap: pick = u; break
                if pick is not None: slots[pick] = slots.get(pick, 0) + 1; plan[i] = pick
        for j in range(1, H + 1):
            for i in range(Mn):
                if outu[i] == j: age[i] = 1
            if rule == 'A':
                el = [i for i in range(Mn) if not done[i] and outu[i] <= j and (not rec[i] or age[i] >= N)]
                el.sort(key=lambda i: (-(age[i] if rec[i] else np.inf) if rec[i] else -np.inf, i)); pulls = el[:cap]
            elif rule == 'B':
                alarmed.sort(key=lambda q: (q[1], q[2], q[0])); pulls = [q[0] for q in alarmed[:cap]]; alarmed = alarmed[cap:]
            else:
                pulls = [i for i in range(Mn) if plan.get(i) == j and not done[i]]
            for i in pulls: done[i] = True; rp += 1; wa += max(0.0, life - (age[i] - 1)); outu[i] = j + R
            for i in range(Mn):
                if outu[i] > j and done[i]: grid[i].append('o'); outT += 1; continue
                x = age[i] > life + 1e-9
                if x: ex += _c14['N_TURN']
                grid[i].append('x' if x else 'u')
                if rule == 'B' and not done[i] and all(q[0] != i for q in alarmed):
                    ref = 1 if rec[i] else a0[i] - _W14 + 1; z = mage(age[i]) - mage(ref) + noise[i][j] - noise[i][0]
                    if z < -L: alarmed.append((i, j, z))
                age[i] += 1
        res[rule] = (ex, rp, wa, outT, [''.join(g) for g in grid])
    return res, N, life
_HASH14 = {'S1': '6405b8f8b4cecff0f036f157d6d35b63a8dd5162feb057b1b6784e95be7b6118', 'S2': 'e351c3d283503a99cd200ed93b1a73aae6efd4cbe76f97b077415b008326bc6b', 'S3': '464bdb5daee0de53386801addffaa4f0c71e3922e9613d9e3fdbbc360b6532c5', 'S4': '24a3dd2540e2d9d8ff806e7988e40fe55e497fd52b8aa2717158ea2687667f98',
           'S5': 'ae609729e01e2c28293f4bc04aafe69dd8df73739fbec3303f91a98f87668161', 'S6': '669fd8d1a949d8e0cff131e41935d347829b69ea01906ffa7617de156e621eb0', 'S7': '8565a5431868afa81430f142c48b7535ff0c3003b8e77a11d5993df4bc5abe00', 'S8': '346ab31d422cc58c1c4437273a34dc3bf232b5f0ac501b0edef268a8a4f93979',
           'S9': '7bc8b2d06c72ffc0bf5a3150c00a877e1616d930eaa698c4b4ee8fe7ad4dec11', 'S10': '3a3f56628487eb661458a765eb2bfdd67c64a6c3984167f2785c382545631980', 'S11': '8aa5ff2731ee8fb341b768e06e1825b62ade6feeabdb9f140bef2002028a7799', 'S12': 'c2359805d59f9f7e774aa1c750e06cb5ebbffb8a1465dba0d176eb1455b591cc',
           'S13': '4eb3c883acb601578ec11ae9fd811255ef1a620edd904e0aa5ac12c78ac904c5', 'loss': 'a920ec0936eb4236c01c1a527d11013785cf1e7f7465971bef0b3e306a47f147'}   # 0306 작업 전에 떠 둔 기본 출력 해시(기존 함수 불변 확인)
chk('S14 기존 출력 불변: scenario("S1"~"S13") 기본 출력과 simulateLoss 기본 출력의 sha256 이 0306 작업 전에 떠 둔 값과 같음(S14 는 새 난수 줄기만 쓰고 기존 함수를 고치지 않음)', _s14['hs'] == _HASH14, f'일치 {sum(_s14["hs"][k] == v for k, v in _HASH14.items())}/{len(_HASH14)}')
_g14 = _s14['g0']; _ids14 = _s14['ids']; _M14 = len(_ids14)
chk('S14 구조: 마스크 24장(B02~B07 × 세트 A × 챔버 1~4) × 최근 8턴 × 유리 6장 = 1152장, 시드마다 같은 순서, 마지막 리페어 뒤 쓴 턴 a0 는 8~20 정수, 기록 있는 마스크 비율은 시드 평균 2/3 근처(0.60~0.73), 기록 있으면 기준 유리 6장(없으면 0), 모든 시드에서 마스크 수 24',
    len(_g14) == 1152 and _M14 == 24 and _s14['same'] and all(8 <= m[0] <= 20 for X in _s14['seeds'] for m in X['masks']) and 0.60 <= np.mean([m[1] for X in _s14['seeds'] for m in X['masks']]) <= 0.73 and len(_s14['b0']) == 6 * sum(m['rec'] for m in _s14['masks0']) and all(len(X['y']) == 24 for X in _s14['seeds']),
    f'유리 {len(_g14)}장 · 기준 유리 {len(_s14["b0"])}장 · 기록 있는 마스크 평균 비율 {np.mean([m[1] for X in _s14["seeds"] for m in X["masks"]]):.3f} · a0 {min(m[0] for X in _s14["seeds"] for m in X["masks"])}~{max(m[0] for X in _s14["seeds"] for m in X["masks"])}')
_gd14 = max(abs(py11_fit(np.array(g['dx']), np.array(g['dy']))[0][3] - g['mx']) for g in _s14['grids'])
chk('S14 격자 → Mx̂: 두 시드(1·대표)의 관측 유리·기준 유리 일부를 77점 격자에서 numpy lstsq 로 다시 푼 Mx 가 표의 Mx̂ 와 같음(소수 6자리 반올림 안: 5e-6)', len(_s14['grids']) >= 30 and _gd14 < 5e-6, f'{len(_s14["grids"])}장 · 최대 차 {_gd14:.1e}')
chk('S14 온도 보정 기울기: S14 가 받아 쓰는 열 기울기(0303 대표 시드 다중 회귀)가 0303 의 CSV 두 개에서 numpy 로 독립 구한 값과 같음(CSV 반올림 오차 1e-4)', abs(_s14['thermal'] - _bt12) < 1e-4 and abs(_s14['thermal'] - _P14['thermal']) < 1e-15,
    f'S14 {_s14["thermal"]:+.4f} ppm/K · CSV 독립 {_bt12:+.4f}')
_gdf14 = pd.DataFrame(_g14, columns=['mask', 'turn', 'git', 'fdc', 'mx', 'comp']); _gdf14['c2'] = _gdf14.mx - _s14['thermal'] * (_gdf14.fdc - _c14['T0'])
_tm14 = _gdf14.groupby(['mask', 'turn']).c2.mean().unstack().reindex(_ids14).values; _bs14 = pd.DataFrame(_s14['b0'], columns=['mask', 'fdc', 'mx', 'comp']); _bs14['c2'] = _bs14.mx - _s14['thermal'] * (_bs14.fdc - _c14['T0']); _bm14 = _bs14.groupby('mask').c2.mean()
_tab14 = pd.DataFrame(_s14['tab0'], columns=['mask', 'turn', 'age', 'comp', 'base']); _ty14 = _tab14.pivot(index='mask', columns='turn', values='comp').reindex(_ids14).values
_dm14 = float(np.abs(_tm14 - _ty14).max()); _bf14 = _tab14.drop_duplicates('mask'); _db14 = max(abs(_bm14[m] - b) for m, b in zip(_bf14['mask'], _bf14['base']) if b is not None and not pd.isna(b))
_age14 = _tab14.dropna(subset=['age']); _am14 = {m['id']: m for m in _s14['masks0']}
chk('S14 보정 후 턴 평균·기준: 유리 표에서 파이썬이 다시 낸 보정 후 턴 평균(마스크 24 × 턴 8)·기록 있는 마스크의 기준(기준 유리 6장 평균)이 표와 1e-9, age_known = a0 − 8 + 턴(기록 있는 마스크만)',
    _dm14 < 1e-9 and _db14 < 1e-9 and all(r.age == _am14[r.mask]['a0'] - _W14 + r.turn and _am14[r.mask]['rec'] for r in _age14.itertuples()) and len(_age14) == 8 * sum(m['rec'] for m in _s14['masks0']), f'턴 평균 최대 차 {_dm14:.1e} · 기준 최대 차 {_db14:.1e} · 나이 기록 {len(_age14)}행')
_tr14 = _s14['truth']; _dev14 = [abs(_tr14[k]['Mx_age'] - (_c14['age'] * _tr14[k]['age'] + _c14['clean'])) for k in _tr14]
chk('S14 정답 표: 참 Mx_age = −0.02 × 나이 − 0.05 (나이 ≥ 1) 1e-12, 나이 = 달력 턴 − age_base, 참 수명(한계에 닿는 나이) = 1 + L/0.02, 기본 한계 0.5 에서 26',
    max(_dev14) < 1e-12 and min(_tr14[k]['age'] for k in _tr14) >= 1 and abs(py14_life(0.5) - 26) < 1e-9 and abs(_P14['limit'] - 0.5) < 1e-15, f'정답 유리 {len(_tr14)}장 · 최대 차 {max(_dev14):.1e} · 나이 {min(_tr14[k]["age"] for k in _tr14)}~{max(_tr14[k]["age"] for k in _tr14)}')
_ti14 = _s14['tinv']; _tdev14 = max(abs(v - py14_tinv(int(k.split('_')[0]), float(k.split('_')[1]))) for k, v in _ti14.items())
chk('S14 t 임계값: JS 의 이분법 역함수(기존 tp2 재사용)가 scipy.stats.t.ppf 와 1e-9 (자유도 6·10·50·167·500, 양측 0.2·0.05·0.01)', _tdev14 < 1e-9, f'최대 차 {_tdev14:.1e}')
_fd14 = {'b': 0.0, 'se': 0.0, 'F': 0.0, 'p': 0.0, 'sp': 0.0}; _PF14 = []
for X in _s14['seeds']:
    Y = np.array(X['y']); f = py14_fit(Y); _PF14.append(f)
    _fd14['b'] = max(_fd14['b'], abs(f['bp'] - X['fit']['bp'])); _fd14['se'] = max(_fd14['se'], abs(f['sep'] - X['fit']['sep'])); _fd14['F'] = max(_fd14['F'], abs(f['F'] - X['fit']['F'])); _fd14['p'] = max(_fd14['p'], abs(f['p'] - X['fit']['p'])); _fd14['sp'] = max(_fd14['sp'], abs(f['sp'] - X['fit']['sp']))
chk('S14 회귀·이질성 검정: 시드 1~200 전부에서 공통 기울기 + 마스크별 절편(numpy lstsq)의 기울기·표준오차·잔차 표준편차와 기울기 이질성 F·p(scipy.stats.f.sf)가 JS 와 1e-9', max(_fd14.values()) < 1e-9, ' · '.join(f'{k} {v:.1e}' for k, v in _fd14.items()))
_Y0 = np.array([X['y'] for X in _s14['seeds'] if X['seed'] == _d14][0]); _f0 = py14_fit(_Y0); _B0 = [X['base'] for X in _s14['seeds'] if X['seed'] == _d14][0]
_rd14 = {'k': 0.0, 'e': 0.0, 'l': 0.0, 'nn': 0, 'n': 0}
for which, est in (('pool', _s14['poolEst']), ('mask', _s14['maskEst'])):
    for i in range(_M14):
        if _B0[i] is None: _rd14['nn'] += int(est[i] is not None); continue
        if which == 'pool': r = py14_rem(_f0['ap'][i], _f0['bp'], _f0['sp'], _f0['dfp'], _M14 * _sxx14, _B0[i], 0.5)
        else: r = py14_rem(_f0['a'][i], _f0['b'][i], _f0['s'][i], _W14 - 2, _sxx14, _B0[i], 0.5)
        j = est[i]; _rd14['n'] += 1
        if r['k'] is None or j['k'] is None: _rd14['e'] += int((r['k'] is None) != (j['k'] is None))
        else: _rd14['k'] = max(_rd14['k'], abs(r['k'] - j['k']))
        for key in ('early', 'late', 'ciE', 'ciL'):
            a_, b_ = r[key], j[key]
            if (a_ is None) != (b_ is None): _rd14['e'] += 1
            elif a_ is not None: _rd14['l'] = max(_rd14['l'], abs(a_ - b_))
chk('S14 잔여 수명·구간: 대표 시드의 기록 있는 마스크 전부(공통·마스크별 두 판)에서 (기준 − 한계 − 현재 예측)/기울기, t 분포 예측 구간과 평균 신뢰구간이 한계선과 만나는 이른·늦은 끝(scipy t.ppf + brentq)이 JS 와 같음(1e-6), 끝이 없는 쪽도 같음, 기록 없는 마스크는 판단 불가',
    _rd14['n'] > 20 and _rd14['k'] < 1e-9 and _rd14['l'] < 1e-6 and _rd14['e'] == 0 and _rd14['nn'] == 0, f'비교 {_rd14["n"]}건 · 점 추정 차 {_rd14["k"]:.1e} · 구간 끝 차 {_rd14["l"]:.1e} · 끝 유무 불일치 {_rd14["e"]} · 판단 불가 위반 {_rd14["nn"]}')
_vm14 = 0; _vd14 = 0.0
_a0s14 = [m['a0'] for m in _s14['masks0']]; _rcs14 = [bool(m['rec']) for m in _s14['masks0']]
for V in _s14['variants']:
    L_, c_, R_ = V['v']; r_, N_, life_ = py14_sim(_a0s14, _rcs14, V['early'], V['noise'], _f0['sp'], L_, c_, R_, _H14)
    for rule, key in (('A', 'A'), ('B', 'B'), ('C', 'C')):
        j = V[key]; p = r_[rule]; _vm14 += int(p[0] != j[0] or p[1] != j[1] or p[3] != j[3] or p[4] != j[4]); _vd14 = max(_vd14, abs(p[2] - j[2]))
    _vm14 += int(N_ != V['N'])
chk('S14 일정 모의: 규칙 A(고정 주기)·B(사후 대응)·C(예측)를 한계 L·능력 c·빠지는 턴 R 여덟 조합(대표 시드)에서 파이썬으로 다시 돌린 한계 초과 유리 수·리페어 횟수·빠진 턴·마스크 × 턴 상태표가 JS 와 일치, 버린 수명 1e-9',
    _vm14 == 0 and _vd14 < 1e-9, f'조합 {len(_s14["variants"])} × 규칙 3 · 불일치 {_vm14} · 버린 수명 차 {_vd14:.1e}')
_MM14 = ['se_ratio', 'het_p', 'life_err', 'cover', 'c_minus_b', 'c_minus_a_waste']; _NM14 = ['마스크별 기울기 SE 중앙값 ÷ 공통 SE', '이질성 검정 p', '잔여 수명 예측 오차(기록 있는 마스크)', '예측 구간 포함률', '규칙 C − B 한계 초과 유리 수', '규칙 C − A 버린 수명']
_A14 = {m: np.zeros(200) for m in _MM14}; _md14 = {m: 0.0 for m in _MM14}; _ed14 = 0.0; _sim14 = 0; _wd14 = 0.0
for X, f in zip(_s14['seeds'], _PF14):
    a0 = [m[0] for m in X['masks']]; rec = [bool(m[1]) for m in X['masks']]; er = []; cv = []; early = []
    for i in range(_M14):
        if not rec[i]: early.append(None); continue
        r = py14_rem(f['ap'][i], f['bp'], f['sp'], f['dfp'], _M14 * _sxx14, X['base'][i], 0.5); tk = 26.0 - a0[i]; early.append(r['early'])
        jl = X['late'][i]
        _ed14 = max(_ed14, abs(r['early'] - X['early'][i]), (0 if r['late'] is None and jl is None else (abs(r['late'] - jl) if (r['late'] is not None and jl is not None) else 1e9)))
        er.append(abs(r['k'] - tk)); cv.append(int(r['early'] is not None and tk >= r['early'] - 1e-9 and (r['late'] is None or tk <= r['late'] + 1e-9)))
    sm, _, _ = py14_sim(a0, rec, early, X['noise'], f['sp'], 0.5, 1, 2, _H14)
    _sim14 += int(sm['A'][0] != X['A'][0] or sm['B'][0] != X['B'][0] or sm['C'][0] != X['Cc'][0] or sm['A'][1] != X['A'][1] or sm['C'][1] != X['Cc'][1] or sm['B'][1] != X['B'][1] or sm['A'][3] != X['A'][3] or sm['B'][3] != X['B'][3] or sm['C'][3] != X['Cc'][3]); _wd14 = max(_wd14, abs(sm['A'][2] - X['A'][2]), abs(sm['B'][2] - X['B'][2]), abs(sm['C'][2] - X['Cc'][2]))
    vals = {'se_ratio': float(np.median(f['se']) / f['sep']), 'het_p': f['p'], 'life_err': float(np.median(er)), 'cover': float(np.mean(cv)), 'c_minus_b': sm['C'][0] - sm['B'][0], 'c_minus_a_waste': sm['C'][2] - sm['A'][2]}
    for m in _MM14: _A14[m][X['seed'] - 1] = vals[m]; _md14[m] = max(_md14[m], abs(vals[m] - X['js'][m]))
chk('S14 시드 1~200 지표 재계산(여섯 지표 + 세 규칙의 한계 초과·리페어·빠진 턴·버린 수명): 표만 받아 numpy·scipy 로 독립 구현한 값이 JS 와 같음(연속값 1e-6, 일정 모의 정수 일치, 구간 끝 1e-6)',
    max(_md14.values()) < 1e-6 and _ed14 < 1e-6 and _sim14 == 0 and _wd14 < 1e-9, ' · '.join(f'{m} {v:.1e}' for m, v in _md14.items()) + f' · 구간 끝 차 {_ed14:.1e} · 일정 모의 불일치 {_sim14} · 버린 수명 차 {_wd14:.1e}')
def _rk14(m, i): a = _A14[m]; return float(((a < a[i]).sum() + 0.5 * (a == a[i]).sum()) / len(a))
_sc14 = np.array([sum(abs(_rk14(m, i) * 100 - 50) for m in _MM14) for i in range(200)])
chk('S14 대표 시드(SEEDS.S14): 여섯 지표 백분위의 Σ|백분위−50| 이 시드 1~200 중 가장 작은 시드이고(파이썬 독립 계산), 25~75% 밖 지표를 기록(본문은 그 지표를 분포로 말해야 함)', int(np.argmin(_sc14)) == _d14 - 1,
    f'SEEDS.S14 = {_d14}, Σ = {_sc14[_d14 - 1]:.1f} · 25~75% 밖: ' + (' · '.join(f'{n} {_rk14(m, _d14 - 1) * 100:.0f}%' for m, n in zip(_MM14, _NM14) if not 0.25 <= _rk14(m, _d14 - 1) <= 0.75) or '없음'))
_pc14 = lambda a: f'중앙 {np.median(a):.4g} (10~90%: {np.percentile(a, 10):.4g}~{np.percentile(a, 90):.4g})'
chk('S14 분포(시드 200) 기록: 여섯 지표의 중앙값·10~90%', all(np.isfinite(_A14[m]).all() for m in _MM14), ' · '.join(f'{n} {_pc14(_A14[m])}' for m, n in zip(_MM14, _NM14)))
_het14 = float(np.mean(_A14['het_p'] < 0.05)); _cvm14 = float(np.mean(_A14['cover'])); _cw14 = float(np.median([X['js']['width_pool'] for X in _s14['seeds']])); _cwm14 = float(np.median([X['js']['width_mask'] for X in _s14['seeds']]))
chk('S14 설계 기대 1 — 공통 기울기 표준오차가 마스크별보다 작음: 모든 시드에서 마스크별 기울기 표준오차 중앙값 ÷ 공통 표준오차 > 1(중앙값은 이상적인 √24 ≈ 4.9 보다 작게 나옴: 마스크마다 잡음 크기가 달라 공통 모델의 이점이 일부 깎임)', bool((_A14['se_ratio'] > 1).all()) and 2.5 < np.median(_A14['se_ratio']) < 5.2, f'비 중앙값 {np.median(_A14["se_ratio"]):.2f} (최소 {_A14["se_ratio"].min():.2f})')
chk('S14 설계 기대 2 — 예측 구간 포함률이 95% 근처: 시드 평균 포함률(공통 판)이 0.90~0.99, 마스크별 판 평균도 0.90~0.99, 공통 구간 폭 중앙값 < 마스크별', 0.90 <= _cvm14 <= 0.99 and 0.90 <= np.mean([X['js']['cover_mask'] for X in _s14['seeds']]) <= 0.99 and _cw14 < _cwm14,
    f'포함률 공통 {_cvm14:.3f} · 마스크별 {np.mean([X["js"]["cover_mask"] for X in _s14["seeds"]]):.3f} · 구간 폭(턴) 중앙값 공통 {_cw14:.1f} · 마스크별 {_cwm14:.1f}')
chk('S14 설계 기대 3 — 이질성 검정은 같은 속도로 닳는 가상 공정에서 드물게 기각: 5% 수준 기각 시드 비율이 0.02~0.20(이상적 5% 보다 높음: 불량 스틱이 있는 마스크는 유리마다 잡음이 커서 잔차 분산이 마스크마다 같지 않음 — 있는 그대로 기록)', 0.02 <= _het14 <= 0.20, f'기각 시드 비율 {_het14:.3f} ({int((_A14["het_p"] < 0.05).sum())}/200) · 대표 시드 p {_A14["het_p"][_d14 - 1]:.3f}')
_cb14 = _A14['c_minus_b']; _cwa14 = _A14['c_minus_a_waste']
chk('S14 설계 기대 4 — 규칙 C(예측)는 B(사후 대응)보다 한계 초과 유리가 적음(시드의 95% 이상에서 C − B < 0, 중앙값 < 0; 일부 시드에서는 반대 — 있는 그대로 기록), 규칙 C − A 버린 수명은 양·음 둘 다 나옴(A 는 정답 수명으로 정한 가장 유리한 고정 주기이고 모든 마스크 수명이 같아 C 가 A 를 일관되게 앞서지 못함)', float((_cb14 < 0).mean()) >= 0.95 and np.median(_cb14) < 0 and (_cwa14 > 0).any() and (_cwa14 < 0).any(),
    f'C−B < 0 인 시드 {int((_cb14 < 0).sum())}/200 (> 0: {int((_cb14 > 0).sum())}, = 0: {int((_cb14 == 0).sum())}) · C−B 한계 초과 유리 중앙값 {np.median(_cb14):.0f}장 (최댓값 {_cb14.max():.0f}) · C−A 버린 수명 중앙값 {np.median(_cwa14):.1f}턴 · 양 {int((_cwa14 > 0).sum())} · 0 {int((_cwa14 == 0).sum())} · 음 {int((_cwa14 < 0).sum())}')
_cs14 = rd('life_s14.csv'); _tj14 = _tab14.copy()
chk('S14 CSV: life_s14.csv 192행 = JS 표(소수 6자리 반올림), 열 mask_id·turn·age_known·Mx_comp·baseline, 기록 없는 마스크는 age_known·baseline 이 빈칸', len(_cs14) == 192 and list(_cs14.columns) == ['mask_id', 'turn', 'age_known', 'Mx_comp', 'baseline'] and float(np.abs(_cs14.Mx_comp.values - _tj14.comp.values).max()) < 6e-7
    and (_cs14.age_known.isna().values == _tj14.age.isna().values).all() and (_cs14.baseline.isna().values == _tj14.base.isna().values).all() and float(np.nanmax(np.abs(_cs14.baseline.values - _tj14.base.astype(float).values))) < 6e-7, f'{len(_cs14)}행 · 기록 없는 행 {int(_cs14.baseline.isna().sum())}')

# --- 0306 페이지의 Python 블록: 그대로 실행한 출력 = 페이지에 적힌 출력, 출력의 숫자 = JS 대표 시드의 값 ---
_pg14 = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'labs', '0306-mask-life.html'), encoding='utf-8').read()
_code14 = _html3.unescape(_re3.search(r'<pre id="pyCode">(.*?)</pre>', _pg14, _re3.S).group(1)); _out14 = _html3.unescape(_re3.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg14, _re3.S).group(1)).strip()
with _tf3.TemporaryDirectory() as _td14:
    shutil.copy(os.path.join(D, 'life_s14.csv'), _td14); open(os.path.join(_td14, 'lab0306.py'), 'w', encoding='utf-8').write(_code14)
    _run14 = subprocess.run([sys.executable, '-I', 'lab0306.py'], cwd=_td14, capture_output=True, text=True)
chk('0306 페이지의 Python 블록을 CSV 에 그대로 실행한 출력 = 페이지에 적힌 출력', _run14.returncode == 0 and _run14.stdout.strip() == _out14, f'종료 {_run14.returncode} · 출력 {len(_run14.stdout.splitlines())}줄' + ('' if _run14.stdout.strip() == _out14 else ' · 다름: ' + (_run14.stderr[-200:] or _run14.stdout[-200:])))
_PG14_JS = r"""const M=require(%s);const T=M.s14tools;const S=M.scenario('S14');const fit=T.fit(S.table),ids=T.IDS,W=T.W;
const rec=S.masks.map((m,i)=>m.record?i:-1).filter(i=>i>=0);let k=rec[0];rec.forEach(i=>{if(fit.per[ids[i]].se_b>fit.per[ids[k]].se_b)k=i;});
const med=a=>{const b=a.slice().sort((x,y)=>x-y),n=b.length;return n%%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2;};
const R=(f,i)=>{const r=T.remaining(f,S.table.baseline[ids[i]],T.LIMIT,W);return {k:r.k_hat,e:r.early,l:r.late};};
const sm=T.sim(S,fit,{});const pulls=[];ids.forEach((id,i)=>{const t=sm.C.grid[i].indexOf('o');if(t>=0&&t+1<=10)pulls.push([t+1,id]);});pulls.sort((a,b)=>a[0]-b[0]||(a[1]<b[1]?-1:1));
console.log(JSON.stringify({M:ids.length,W:W,nrec:rec.length,medse:med(ids.map(d=>fit.per[d].se_b)),bp:fit.b_pool,sep:fit.se_pool,F:fit.F,df1:fit.df1,df2:fit.df_sep,p:fit.p,id:ids[k],bm:fit.per[ids[k]].b,bpk:fit.pool[ids[k]].b,rm:R(fit.per[ids[k]],k),rp:R(fit.pool[ids[k]],k),nun:ids.length-rec.length,pulls:pulls,
 lim:T.LIMIT,cap:T.CAP,out:T.OUT,kmax:T.KMAX}));"""
_pj14 = json.loads(subprocess.run([_node, '-e', _PG14_JS % json.dumps(_mf)], capture_output=True, text=True, check=True).stdout)
_sh14 = lambda v: f'{v:.1f}턴' if v is not None else f'{_pj14["kmax"]}턴 안에 닿지 않음'
_exp14 = [f'마스크 {_pj14["M"]}장 · 관측 {_pj14["W"]}턴 · 리페어 직후 기준 기록 있음 {_pj14["nrec"]}장 · 없음 {_pj14["nun"]}장',
          f'기울기 표준오차: 마스크별 중앙값 {_pj14["medse"]:.4f} · 공통 기울기 {_pj14["bp"]:+.4f} ± {_pj14["sep"]:.4f} ppm/턴 (비 {_pj14["medse"] / _pj14["sep"]:.2f})',
          f'기울기 이질성 검정: F({_pj14["df1"]}, {_pj14["df2"]}) = {_pj14["F"]:.3f} · p = {_pj14["p"]:.3f}',
          f'{_pj14["id"]} (마스크별 기울기 {_pj14["bm"]:+.4f}): 잔여 수명 {_sh14(_pj14["rm"]["k"])} · 예측 구간 이른 끝 {_sh14(_pj14["rm"]["e"])} ~ 늦은 끝 {_sh14(_pj14["rm"]["l"])}',
          f'{_pj14["id"]} (공통 기울기 {_pj14["bpk"]:+.4f}): 잔여 수명 {_sh14(_pj14["rp"]["k"])} · 예측 구간 이른 끝 {_sh14(_pj14["rp"]["e"])} ~ 늦은 끝 {_sh14(_pj14["rp"]["l"])}',
          f'판단 불가(기준 기록 없음) {_pj14["nun"]}장',
          f'예방 리페어 일정(능력 {_pj14["cap"]}장/턴, 리페어 {_pj14["out"]}턴) 다음 10턴: ' + ' '.join(f'{t}턴 {m}' for t, m in _pj14['pulls'])]
_miss14 = [e for e in _exp14 if e not in _run14.stdout]
chk('0306 Python 출력의 숫자(마스크 수·기준 기록 수, 기울기 표준오차와 공통 기울기, 이질성 F·p, 대표 마스크의 마스크별·공통 잔여 수명과 구간 끝, 판단 불가 수, 다음 10턴 일정) = JS 대표 시드와 일치, 코드 속 한계·능력·빠지는 턴 = JS 값', not _miss14 and f'LIMIT = {_pj14["lim"]}' in _code14 and f'CAPACITY, OUT_TURNS = {_pj14["cap"]}, {_pj14["out"]}' in _code14 and f'HORIZON, K_MAX = {_s14["hz"]}, {_pj14["kmax"]}' in _code14,
    ' · '.join(_exp14[1:3]) + ('' if not _miss14 else ' · 불일치: ' + ' | '.join(_miss14)))

w = max(len(r[0]) for r in res)
for n, ok, d in res: print(('OK  ' if ok else 'FAIL'), n.ljust(w), ' ', d)
print(f'\n{sum(r[1] for r in res)}/{len(res)} 통과')
sys.exit(0 if all(r[1] for r in res) else 1)
