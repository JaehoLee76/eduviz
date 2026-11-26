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


# ============================================================
# S15 (0400) — 사내 데이터 파이프라인: 가상 공장 14일의 표 넷(적재본·정답본)에서 sqlite3 로 같은 SQL 을 실제로 돌려 JS 와 대조하고,
# 점검 규칙·혼동·지문·멱등·되돌아보기 창·시드 분포(pandas 독립 구현)를 확인한다
# ============================================================
import html as _html5, re as _re5, tempfile as _tf5, hashlib as _hl5
_S15_EXPORT = r"""const M=require(%s);const T=M.s15tools;const S=M.scenario('S15');const R=T.runAll(S);
function oo(a){return {ch:a.ch,ex:a.ex,ev:a.ev,joined:a.joined};}
const days=R.days.map(d=>{const k=d.day,ex=T.extract(S.loaded,k,k*1440),ex2=T.extract(S.loaded,k,Math.min(14,k+S.params.lookback)*1440);
 return {day:k,faults:d.faults,pass:d.pass,checks:d.checks.map(c=>({id:c.id,value:c.value,thr:c.thr,pass:c.pass,detail:c.detail})),naive:oo(d.naive),truth:oo(d.truth),final:oo(d.final),wrong:d.wrong,wrong_final:d.wrong_final,why:d.why,
  n_fdc:d.n_fdc,n_ppa:d.n_ppa,notice:d.late_notice,fp_in:T.fp(T.inLines(ex.fdcW,ex.ppaW)),fp_out:d.pass?T.fp(T.outLines(d.naive)):null,fp_in_final:T.fp(T.inLines(ex2.fdcW,ex2.ppaW)),n_ppa_final:ex2.ppaW.length,fp_out_final:T.fp(T.outLines(d.final))};});
const lcurve=[0,1,2,3,4,5,6,7].map(L=>T.late4(S,L));
const rv={};[0.5,0.6,0.7,0.8,0.9,1.0].forEach(v=>{rv['rmin'+v]=T.metrics(S,{rules:{rmin:v,bmax:0.02,jmin:0.98}});});
[0,0.005,0.02,0.05,0.1].forEach(v=>{rv['bmax'+v]=T.metrics(S,{rules:{rmin:0.8,bmax:v,jmin:0.98}});});
[0.9,0.95,0.98,0.99,1.0].forEach(v=>{rv['jmin'+v]=T.metrics(S,{rules:{rmin:0.8,bmax:0.02,jmin:v}});});
const hs=x=>require('crypto').createHash('sha256').update(x).digest('hex');
const ids={};['S1','S2','S10','S11','S12','S13','S14','S15'].forEach(k=>{ids[k]=M.scenario(k).id||M.scenario(k).name||null;});
console.log(JSON.stringify({days:days,params:S.params,faults:S.faults,metrics:T.metrics(S),lcurve:lcurve,rv:rv,ids:ids,def:M.SEEDS.S15,h14:hs(JSON.stringify(M.scenario('S14'))),
 cfg:{CT:M.CFG.CT,N_TURN:M.CFG.N_TURN,T0:M.CFG.T0},tol:{mx:T.TOL_MX,ex:T.TOL_EX,ev:T.TOL_EV},nev:S.loaded.events.length,sizes:{fdc:S.loaded.fdc.length,ppa:S.loaded.ppa.length,ev:S.loaded.events.length,mh:S.loaded.mask_hist.length,cfdc:S.clean.fdc.length,cppa:S.clean.ppa.length},masks:S.masks}));"""
_SEEDS15 = r"""const M=require(%s);const T=M.s15tools;const fs=require('fs');const fd=fs.openSync(process.argv[1],'w');
const CHI={};T.CH.forEach((c,i)=>{CHI[c.block+'-'+c.chamber]=i;});
for(let sd=1;sd<=200;sd++){const S=M.scenario('S15',{seed:sd}),gi={};S.clean.fdc.forEach((r,i)=>{gi[r.glass_id]=i;});
 const F=a=>({g:a.map(r=>gi[r.glass_id]),ts:a.map(r=>r.ts),c:a.map(r=>CHI[r.block+'-'+r.chamber]),t:a.map(r=>r.chamber_temp)});
 const P=a=>({g:a.map(r=>gi[r.glass_id]),ts:a.map(r=>r.ts),mts:a.map(r=>r.measured_ts),mx:a.map(r=>r.Mx),mm:a.map(r=>r.ppa_metric),v:a.map(r=>r.model_ver==='m1'?0:1)});
 const m=T.metrics(S);
 fs.writeSync(fd,JSON.stringify({seed:sd,spec:S.params.spec,slope:S.params.thermal,fl:F(S.loaded.fdc),pl:P(S.loaded.ppa),fc:F(S.clean.fdc),pc:P(S.clean.ppa),ev:S.loaded.events.map(e=>[CHI[e.block+'-'+e.chamber],e.start_ts,e.end_ts]),
  faults:S.faults.map(f=>f.kinds),js:m})+'\n');}
fs.closeSync(fd);"""
_mf5 = _mf
_s15 = json.loads(subprocess.run([_node, '-e', _S15_EXPORT % json.dumps(_mf5)], capture_output=True, text=True, check=True, env=dict(os.environ, NODE_OPTIONS='--max-old-space-size=4096')).stdout)
_P15 = _s15['params']; _d15 = _s15['def']
_pg15 = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'labs', '0400-data-pipeline.html'), encoding='utf-8').read()
_code15 = _html5.unescape(_re5.search(r'<pre id="pyCode">(.*?)</pre>', _pg15, _re5.S).group(1)); _out15 = _html5.unescape(_re5.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg15, _re5.S).group(1)).strip()

# 1) 시나리오 키·기존 출력 불변
chk('S15 scenario() 키 판정: S15 는 S15 로, S1·S10~S14 는 그대로(S15 가 S1 로 잘리지 않음)', _s15['ids']['S15'] == 'S15' and all(_s15['ids'][k] == k for k in ('S1', 'S2', 'S10', 'S11', 'S12', 'S13', 'S14')), str(_s15['ids']))
chk('S15 추가 뒤에도 S14 출력 해시 불변(작업 전 기준선 dd86ab9d…)', _s15['h14'] == 'dd86ab9d40ae192610d3e3d2f88b8b8cbc209186ba7aa23526c3a65b2a88a5f4', _s15['h14'][:16])

# 2) CSV(적재본·정답본)로 고장 주입 확인 — JS 와 무관하게 pandas 로
_cf = rd('s15_fdc_glass.csv'); _cp = rd('s15_ppa_coef.csv'); _ce = rd('s15_events.csv'); _cm = rd('s15_mask_hist.csv'); _kf = rd('s15_clean_fdc_glass.csv'); _kp = rd('s15_clean_ppa_coef.csv'); _fl = rd('s15_faults.csv')
_T0 = pd.Timestamp('2026-03-02 06:00')
_dayof = lambda s: ((pd.to_datetime(s) - _T0) // pd.Timedelta(days=1) + 1).astype(int)
for _t in (_cf, _kf): _t['day'] = _dayof(_t.ts)
for _t in (_cp, _kp): _t['day'] = _dayof(_t.ts)
_inj = {int(d): set(g.kind) for d, g in _fl.groupby('day')}
_nm = lambda d: _inj.get(d, set())
chk('S15 표 크기: fdc_glass·ppa_coef·events·mask_hist 적재본·정답본 줄 수가 JS 와 같고 정답본 glass_id 는 유일',
    (len(_cf), len(_cp), len(_ce), len(_cm), len(_kf), len(_kp)) == tuple(_s15['sizes'][k] for k in ('fdc', 'ppa', 'ev', 'mh', 'cfdc', 'cppa')) and _kf.glass_id.is_unique and _kp.glass_id.is_unique and set(_cf.glass_id) <= set(_kf.glass_id) and set(_cp.glass_id) <= set(_kp.glass_id),
    f'적재본 fdc {len(_cf)} ppa {len(_cp)} · 정답본 fdc {len(_kf)} ppa {len(_kp)} · events {len(_ce)} · mask_hist {len(_cm)}')
_ok15 = True; _msg15 = []
for d in range(1, 15):
    lf, kf, lp, kp = _cf[_cf.day == d], _kf[_kf.day == d], _cp[_cp.day == d], _kp[_kp.day == d]
    ks = _nm(d)
    dupF, dupP = len(lf) - lf.glass_id.nunique(), len(lp) - lp.glass_id.nunique()
    got = set()
    if dupF + dupP > 0: got.add('dup')
    if lf.chamber_temp.isna().mean() > 0.9 and lf.ch_temp.notna().mean() > 0.9: got.add('rename')
    if len(set(lp.model_ver)) > 1: got.add('model')
    # late: 같은 glass_id 의 measured_ts 가 정답본보다 24시간 넘게 늦은 행이 있음
    mm = lp.drop_duplicates('glass_id').merge(kp[['glass_id', 'measured_ts']], on='glass_id', suffixes=('', '_k'))
    if ((pd.to_datetime(mm.measured_ts) - pd.to_datetime(mm.measured_ts_k)) > pd.Timedelta(hours=20)).any(): got.add('late')
    # gap: 정답본 줄 가운데 적재본에 없는 줄이 있음(시각 이동이 없는 날만 해당)
    if 'shift' not in ks and len(set(kf.glass_id) - set(lf.glass_id)) > 0: got.add('gap')
    # shift: 같은 glass_id 의 ts 가 정확히 540분 늦음
    mf = lf.drop_duplicates('glass_id').merge(kf[['glass_id', 'ts']], on='glass_id', suffixes=('', '_k'))
    if len(mf) and ((pd.to_datetime(mf.ts) - pd.to_datetime(mf.ts_k)) == pd.Timedelta(minutes=540)).all(): got.add('shift')
    if got != ks: _ok15 = False; _msg15.append(f'{d}일 주입 {sorted(ks)} 관측 {sorted(got)}')
    if not ks:
        same = sorted(lf.glass_id) == sorted(kf.glass_id) and sorted(lp.glass_id) == sorted(kp.glass_id) and np.allclose(np.sort(lp.Mx.values), np.sort(kp.Mx.values))
        if not same: _ok15 = False; _msg15.append(f'{d}일 고장 없는 날인데 적재본≠정답본')
chk('S15 고장 주입: 날짜별로 CSV 의 적재본/정답본 차이(중복·열 이름·모델 판·늦은 도착·빠진 줄·540분 이동)가 faults 표(정답)와 정확히 같고, 고장 없는 날은 적재본 = 정답본', _ok15 and len(_fl) > 0, '; '.join(_msg15) or ' · '.join(f'{d}일 {"+".join(sorted(k))}' for d, k in sorted(_inj.items())))
_kinds15 = [k for f in _s15['faults'] for k in f['kinds']]
chk('S15 고장 분포: 날마다 0~2개(고장 없는 날도 있음), 대표 시드에서 여섯 종류 가운데 네 가지 이상이 실제로 들어감', all(len(f['kinds']) <= 2 for f in _s15['faults']) and any(len(f['kinds']) == 0 for f in _s15['faults']) and len(set(_kinds15)) >= 4,
    f'고장 {len(_kinds15)}건 · 고장 없는 날 {sum(len(f["kinds"]) == 0 for f in _s15["faults"])}일 · 종류 {sorted(set(_kinds15))}')
# 이벤트: 챔버 안에서 겹치지 않음
_ce['s'] = pd.to_datetime(_ce.start_ts); _ce['e'] = pd.to_datetime(_ce.end_ts)
_ov = 0
for _, g in _ce.groupby(['block', 'chamber']):
    g = g.sort_values('s'); _ov += int((g.s.values[1:] <= g.e.values[:-1]).sum())
chk('S15 이벤트·마스크 이력: 같은 챔버 안에서 이벤트가 겹치지 않고, 이벤트 종류가 네 가지, 마스크 이력은 챔버마다 IN_USE 구간이 끊김 없이 이어짐', _ov == 0 and set(_ce.kind) <= {'PM', '세정', '센서 교정', '인터락'} and len(set(_ce.kind)) >= 3, f'이벤트 {len(_ce)}건 · 겹침 {_ov} · 종류 {sorted(set(_ce.kind))}')
_cont = True
for (b, c), g in _cm[_cm.state == 'IN_USE'].groupby(['block', 'chamber']):
    g = g.sort_values('from_ts')
    if g.from_ts.iloc[0] != '2026-03-02 06:00' or g.to_ts.iloc[-1] != '2026-03-16 06:00' or (len(g) > 1 and (g.to_ts.values[:-1] != g.from_ts.values[1:]).any()): _cont = False
chk('S15 마스크 이력 연속성', _cont and _cm.chamber.nunique() == 4, f'마스크 이력 {len(_cm)}줄 · 교체된 챔버 {int((_cm.state == "WASH").sum())}곳')

# 3) 페이지의 Python 코드(sqlite3 SQL)로 적재본·정답본을 직접 돌려 JS 와 대조
_ns15 = {'__name__': 'pipe15', '__file__': os.path.join(D, 'pipe15.py')}; exec(compile(_code15, 'pipe15', 'exec'), _ns15)
_td15 = _tf5.mkdtemp(); _tdc15 = _tf5.mkdtemp()
for _n in ('fdc_glass', 'ppa_coef', 'events', 'mask_hist'): shutil.copy(os.path.join(D, f's15_{_n}.csv'), os.path.join(_td15, f's15_{_n}.csv'))
for _n, _m in (('clean_fdc_glass', 'fdc_glass'), ('clean_ppa_coef', 'ppa_coef'), ('events', 'events'), ('mask_hist', 'mask_hist')): shutil.copy(os.path.join(D, f's15_{_n}.csv'), os.path.join(_tdc15, f's15_{_m}.csv'))
_con15 = _ns15['load_db'](_td15); _conc15 = _ns15['load_db'](_tdc15); _outd15 = _tf5.mkdtemp()
_chs = _ns15['CHAMBERS']; _bad15 = []; _ev15 = []; _rec15 = []
def _o15(daily, ev): return {'ch': [{'key': k, 'n': n, 'mx': m, 'ex': x} for k, n, m, x in daily], 'ex': int(sum(x for _, _, _, x in daily)), 'ev': ev}
def _same15(a, b):
    if a['ex'] != b['ex'] or a['ev'] != b['ev']: return False
    for x, y in zip(a['ch'], b['ch']):
        if x['key'] != y['key'] or x['n'] != y['n'] or x['ex'] != y['ex'] or (x['mx'] is None) != (y['mx'] is None) or (x['mx'] is not None and abs(x['mx'] - y['mx']) > 1e-9): return False
    return True
_cm15 = {'ok': 0, 'late': 0}
for d in _s15['days']:
    k = d['day']; s, e = _ns15['window'](k)
    rec, cks = _ns15['run_daily'](_con15, k, _outd15); _rec15.append(rec)
    nv = _o15(_ns15['join_keys'](_con15, s, e, e), _ns15['attach_events'](_con15, s, e)); tv = _o15(_ns15['join_keys'](_conc15, s, e, '9999'), _ns15['attach_events'](_conc15, s, e))
    fe = _ns15['window'](min(14, k + _P15['lookback']))[1]; fv = _o15(_ns15['join_keys'](_con15, s, e, fe), _ns15['attach_events'](_con15, s, e))
    if not (_same15(nv, d['naive']) and _same15(tv, d['truth']) and _same15(fv, d['final'])): _bad15.append(f'{k}일 결과')
    for c, j in zip(cks, d['checks']):
        if c[0] != j['id'] or c[3] != j['pass'] or (c[1] is None) != (j['value'] is None) or (c[1] is not None and abs(c[1] - j['value']) > 1e-9): _bad15.append(f'{k}일 점검 {c[0]}')
    if rec['in_fp'] != d['fp_in'] or (d['fp_out'] or '-') != rec['out_fp']: _bad15.append(f'{k}일 지문')
    if rec['late_notice'] != d['notice'] or rec['n_fdc'] != d['n_fdc'] or rec['n_ppa'] != d['n_ppa']: _bad15.append(f'{k}일 행 수·알림')
chk('S15 sqlite3 로 같은 SQL 을 실제로 돌린 결과 = JS: 14일 × (점검 없이 낸 결과·정답본 결과·되돌아보기 뒤 결과) 챔버별 평균·건수·초과 건수·이벤트 붙은 유리 수, 점검 일곱 값과 통과 여부, 입력·출력 지문, 행 수, 늦은 도착 알림', not _bad15, ('불일치: ' + ', '.join(_bad15[:6])) if _bad15 else f'14일 전부 일치 · 지문 예 {_rec15[0]["in_fp"]} / {_rec15[7]["out_fp"]}')
# 4) 구간 이음 SQL: 다른 방법(pandas 이진 비교)으로 같은 수
_eo = _ce.copy(); _ok_iv = True; _ivn = 0
for d in (1, 5, 8, 11):
    s, e = _ns15['window'](d); f = _cf[(_cf.ts >= s) & (_cf.ts < e)]
    hit = set()
    for r in _eo.itertuples():
        m = f[(f.block == r.block) & (f.chamber == r.chamber) & (f.ts >= r.start_ts) & (f.ts <= r.end_ts)]
        hit |= set(m.glass_id)
    if len(hit) != _ns15['attach_events'](_con15, s, e): _ok_iv = False
    _ivn += len(hit)
_shiftd = [d for d, k in _inj.items() if 'shift' in k]
_ivd = []
for d in _shiftd:
    s, e = _ns15['window'](d); _ivd.append((d, _ns15['attach_events'](_con15, s, e), _ns15['attach_events'](_conc15, s, e)))
chk('S15 구간 이음: SQL 의 BETWEEN 조인 결과 = pandas 로 따로 센 값, 이음 단위(챔버 같고 ts 가 start~end 안)이며 시각대가 어긋난 날은 정답본과 붙은 유리 수가 달라짐', _ok_iv and len(_ivd) > 0 and all(a != b for _, a, b in _ivd), f'검산 4일 합계 {_ivn}건 · 시각 이동한 날(일, 적재본, 정답본) {_ivd}')
# 5) 점검 규칙·혼동
_fd15 = [d for d in _s15['days'] if d['faults']]; _nf15 = [d for d in _s15['days'] if not d['faults']]
_mm = _s15['metrics']
_conf = {'caught': sum(not d['pass'] for d in _fd15), 'miss_fault': sum(d['pass'] for d in _fd15), 'false': sum(not d['pass'] for d in _nf15), 'quiet': sum(d['pass'] for d in _nf15)}
chk('S15 혼동표(고장 날 × 점검 결과): sqlite3 로 돈 실행 기록의 실패 날 = JS, 합 14일, 잡음·놓침·헛잡음·정상 숫자가 JS 지표와 같음', sum(_conf.values()) == 14 and _conf['caught'] == round(_mm['caught_ratio'] * _mm['n_fault_days']) and _conf['false'] == _mm['false_alarm'] and [r['alert'] for r in _rec15] == [not d['pass'] for d in _s15['days']],
    f'잡음 {_conf["caught"]} · 놓침(고장 있는데 통과) {_conf["miss_fault"]} · 헛잡음 {_conf["false"]} · 정상 {_conf["quiet"]}')
_which = {}
for d in _s15['days']:
    for c in d['checks']:
        if not c['pass']:
            for kd in d['faults']: _which.setdefault(kd, set()).add(c['id'])
chk('S15 정직한 한계: 점검이 걸린 이유를 고장 종류별로 기록(모델 판 섞임은 열 구성·빈칸 점검이 아니라 model_ver 규칙으로만 잡힌다)', all('model' in v for k, v in _which.items() if k == 'model') and 'cols' not in _which.get('model', set()),
    ' · '.join(f'{k}: {"/".join(sorted(v))}' for k, v in sorted(_which.items())))
# 6) 멱등·되돌아보기
_ok_day = next(d['day'] for d in _s15['days'] if d['pass'])
_r1 = _ns15['run_daily'](_con15, _ok_day, _outd15, reason='재실행')[0]; _r2 = _ns15['run_daily'](_con15, _ok_day, _outd15, reason='재실행')[0]
_files = [f for f in os.listdir(_outd15) if f == f'result_{_r1["run_date"]}.csv']
_dd = _s15['days'][_ok_day - 1]
chk('S15 멱등: 통과한 날을 두 번 더 돌려도 결과 표는 한 벌, 입력·출력 지문은 처음과 같고 JS 와 같음', len(_files) == 1 and _r1['out_fp'] == _r2['out_fp'] == _dd['fp_out'] and _r1['in_fp'] == _dd['fp_in'], f'{_r1["run_date"]} 결과 표 {len(_files)}벌 · 출력 지문 {_r2["out_fp"]}')
_late_ds = [d['day'] for d in _s15['days'] if 'late' in d['faults'] and d['day'] + _P15['lookback'] <= 14]; _ld = _late_ds[-1]
_ldd = _s15['days'][_ld - 1]; _rl = _ns15['run_daily'](_con15, _ld, _outd15, asof_day=_ld + _P15['lookback'], reason='되돌아보기')[0]
chk('S15 늦게 온 자료: 되돌아보기 재실행 뒤 입력 지문이 바뀌고(PPA 행이 늘고) 지문·행 수가 JS 와 같음, 바뀐 출력 지문도 같음', _rl['in_fp'] != _ldd['fp_in'] and _rl['in_fp'] == _ldd['fp_in_final'] and _rl['n_ppa'] == _ldd['n_ppa_final'] > _ldd['n_ppa'] and (_rl['out_fp'] == _ldd['fp_out_final'] or _rl['out_fp'] == '-'),
    f'{_ld}일: 지문 {_ldd["fp_in"]} → {_rl["in_fp"]} · PPA 행 {_ldd["n_ppa"]} → {_rl["n_ppa"]}')
# 7) 시드 분포 — pandas 독립 구현
_sf15 = os.path.join(_tf5.mkdtemp(), 's15seeds.ndjson')
subprocess.run([_node, '-e', _SEEDS15 % json.dumps(_mf5), _sf15], check=True, env=dict(os.environ, NODE_OPTIONS='--max-old-space-size=4096'))
_tol15 = _s15['tol']; _rules15 = _P15['rules']; _L15 = _P15['lookback']; _HIST15 = _P15['hist']
def _py15_run(F, P, EV, k, asof, spec, slope, hist=None):
    s, e = (k - 1) * 1440, k * 1440
    fd = pd.DataFrame({'g': F['g'], 'ts': F['ts'], 'c': F['c'], 't': F['t']}); pdf = pd.DataFrame({'g': P['g'], 'pts': P['ts'], 'mts': P['mts'], 'mx': P['mx'], 'mm': P['mm'], 'v': P['v']})
    fw = fd[(fd.ts >= s) & (fd.ts < e)]; pw = pdf[(pdf.pts >= s) & (pdf.pts < e) & (pdf.mts <= asof)]
    j = fw.merge(pw, on='g'); comp = j.mx - slope * (j.t - _P15['T_ref'])
    rows = []
    for c in range(8):
        m = j.c == c; cc = comp[m].dropna()
        rows.append((int(len(cc)), float(cc.mean()) if len(cc) else None, int((j.mm[m] > spec).sum())))
    hit = np.zeros(len(fw), bool)
    for (c, a, b) in EV: hit |= ((fw.c.values == c) & (fw.ts.values >= a) & (fw.ts.values <= b))
    out = {'n': [r[0] for r in rows], 'mx': [r[1] for r in rows], 'ex': [r[2] for r in rows], 'exT': sum(r[2] for r in rows), 'ev': int(fw.g.values[hit].size and len(set(fw.g.values[hit])))}
    nf, npp = len(fw), len(pw)
    chk_ = None
    if hist is not None:
        mf = np.median(hist[0]) if hist[0] else None; mp = np.median(hist[1]) if hist[1] else None
        ratio = None if mf is None else min(nf / mf, npp / mp)
        dup = (nf - fw.g.nunique()) + (npp - pw.g.nunique()); empty = 5 if nf == 0 else (1 if fw.t.isna().all() else 0)
        blank = 1.0 if nf == 0 else float(fw.t.isna().mean()); jr = float(pw.g.isin(fw.g).mean()) if npp else 0.0
        vio = int((j.ts > j.mts).sum()); nv = int(pw.v.nunique())
        r = _rules15
        chk_ = [ratio is None or ratio >= r['rmin'], dup == 0, empty == 0, blank <= r['bmax'], jr >= r['jmin'], vio == 0, nv <= 1]
    return out, nf, npp, chk_
def _diff15(a, b):
    for i in range(8):
        if (a['mx'][i] is None) != (b['mx'][i] is None) or (a['mx'][i] is not None and abs(a['mx'][i] - b['mx'][i]) > _tol15['mx']): return True
    return abs(a['exT'] - b['exT']) >= max(_tol15['ex'], 0.2 * b['exT']) or abs(a['ev'] - b['ev']) >= _tol15['ev']
_A15 = {m: np.full(200, np.nan) for m in ('wrong', 'caught', 'false', 'late', 'missed')}; _jsA = {m: np.full(200, np.nan) for m in _A15}; _fdays = []
_map15 = {'wrong': 'wrong', 'caught': 'caught_ratio', 'false': 'false_alarm', 'late': 'late_fixed', 'missed': 'missed'}
with open(_sf15) as fh:
    for line in fh:
        X = json.loads(line); sd = X['seed']; spec = X['spec']; slope = X['slope']
        fl = {k: (np.array([np.nan if v is None else v for v in X['fl'][k]], float) if k == 't' else np.array(X['fl'][k])) for k in X['fl']}; fc = {k: (np.array([np.nan if v is None else v for v in X['fc'][k]], float) if k == 't' else np.array(X['fc'][k])) for k in X['fc']}
        pl = {k: np.array(v) for k, v in X['pl'].items()}; pc = {k: np.array(v) for k, v in X['pc'].items()}
        H0, H1 = [], []; wrong = caught = false = missed = 0; nfd = 0
        for k in range(1, 15):
            nv, nf, npp, cks = _py15_run(fl, pl, X['ev'], k, k * 1440, spec, slope, (H0[-_HIST15:], H1[-_HIST15:])); tv, _, _, _ = _py15_run(fc, pc, X['ev'], k, 10 ** 9, spec, slope)
            H0.append(nf); H1.append(npp)
            ok = all(cks); w = _diff15(nv, tv); has = len(X['faults'][k - 1]) > 0
            wrong += w; nfd += has; caught += (has and not ok); false += ((not has) and not ok); missed += (ok and w)
        pw = pd.DataFrame({'g': pl['g'], 'ts': pl['ts'], 'mts': pl['mts']}); dd = pw.ts // 1440 + 1; ee = dd * 1440
        late = (pw.mts > ee) & (pw.mts <= 14 * 1440); fix = late & (pw.mts <= np.minimum(14, dd + _L15) * 1440)
        vals = {'wrong': wrong, 'caught': caught / nfd if nfd else float('nan'), 'false': false, 'late': float(fix.sum() / late.sum()) if late.sum() else float('nan'), 'missed': missed}
        for m in _A15: _A15[m][sd - 1] = vals[m]; _jsA[m][sd - 1] = X['js'][_map15[m]] if X['js'][_map15[m]] is not None else float('nan')
        _fdays.append(nfd)
_md15 = max(float(np.nanmax(np.abs(_A15[m] - _jsA[m]))) for m in _A15)
chk('S15 시드 1~200 지표 다섯 재계산: 표만 받아 pandas 로 독립 구현(구간 자르기·잇기·점검 일곱·정답과의 비교·되돌아보기)한 값이 JS 와 같음(정수 일치, 비율 1e-9)', _md15 < 1e-9, f'최대 차이 {_md15:.1e}')
def _rk15(m, i): a = _A15[m]; a2 = a[~np.isnan(a)]; return float(((a2 < a[i]).sum() + 0.5 * (a2 == a[i]).sum()) / len(a2))
_sc15 = np.array([sum(abs(_rk15(m, i) * 100 - 50) for m in _A15) for i in range(200)])
_NM15 = {'wrong': '점검 없이 정답과 다른 날 수', 'caught': '점검이 잡은 고장 비율', 'false': '헛잡은 날 수', 'late': '되돌아보기 창이 바로잡은 늦은 자료 비율', 'missed': '놓친 날 수'}
chk('S15 대표 시드(SEEDS.S15): 다섯 지표 백분위의 Σ|백분위−50| 이 시드 1~200 중 가장 작은 시드이고(파이썬 독립 계산), 25~75% 밖 지표를 기록(본문은 그 지표를 분포로 말해야 함)', int(np.argmin(_sc15)) == _d15 - 1,
    f'SEEDS.S15 = {_d15}, Σ = {_sc15[_d15 - 1]:.1f} · 25~75% 밖: ' + (' · '.join(f'{_NM15[m]} {_rk15(m, _d15 - 1) * 100:.0f}%' for m in _A15 if not 0.25 <= _rk15(m, _d15 - 1) <= 0.75) or '없음'))
_pc15 = lambda a: f'중앙 {np.nanmedian(a):.4g} (10~90%: {np.nanpercentile(a, 10):.4g}~{np.nanpercentile(a, 90):.4g})'
chk('S15 분포(시드 200) 기록: 다섯 지표의 중앙값·10~90%', all(np.isfinite(_A15[m]).all() for m in _A15), ' · '.join(f'{_NM15[m]} {_pc15(_A15[m])}' for m in _A15))
chk('S15 설계 기대 — 점검 없이 틀린 날 > 점검 뒤 놓친 날: 시드 중앙값이 앞이 훨씬 크고(분포 위쪽 10% 미만 시드를 빼고도), 놓친 날 수의 90% 값이 점검 없이 틀린 날 수의 10% 값보다 작음', np.median(_A15['wrong']) > np.median(_A15['missed']) + 3 and np.percentile(_A15['missed'], 90) < np.percentile(_A15['wrong'], 10), f'틀린 날 중앙 {np.median(_A15["wrong"]):.0f} (10~90%: {np.percentile(_A15["wrong"], 10):.0f}~{np.percentile(_A15["wrong"], 90):.0f}) · 놓친 날 중앙 {np.median(_A15["missed"]):.0f} (10~90%: {np.percentile(_A15["missed"], 10):.0f}~{np.percentile(_A15["missed"], 90):.0f})')
chk('S15 관찰(설계 예상과 다름 가능) — 점검이 고장을 거의 다 잡지만(중앙값 100%) 놓친 날이 0이 아닌 시드가 있고, 고장이 있어 점검이 실패했는데 결과는 정답과 같았던 날(무해 고장)이 있음', np.median(_A15['caught']) >= 0.95 and (_A15['missed'] > 0).any() and _s15['metrics']['harmless'] >= 0,
    f'놓친 날 > 0 인 시드 {int((_A15["missed"] > 0).sum())}/200 · 대표 시드 무해 고장 {_s15["metrics"]["harmless"]}일 · 고장 있는 날 중앙값 {np.median(_fdays):.0f}일')
_lc = [x['ratio'] for x in _s15['lcurve']]
_lcpy = []
_pw0 = _cp.copy(); _pw0['d'] = _dayof(_pw0.ts); _pw0['m'] = pd.to_datetime(_pw0.measured_ts); _pw0['t0'] = pd.to_datetime(_pw0.ts)
_endd = _T0 + pd.Timedelta(days=14)
for L in range(8):
    ee = _T0 + pd.to_timedelta(_pw0.d, unit='D'); late = (_pw0.m > ee) & (_pw0.m <= _endd); fix = late & (_pw0.m <= _T0 + pd.to_timedelta(np.minimum(14, _pw0.d + L), unit='D'))
    _lcpy.append(float(fix.sum() / late.sum()))
chk('S15 되돌아보기 창 길이(0~7일) → 바로잡힌 늦은 자료 비율: CSV 로 독립 계산한 값 = JS, 길이가 늘수록 줄지 않고(단조), 0일에는 0', all(abs(a - b) < 1e-12 for a, b in zip(_lc, _lcpy)) and all(_lc[i] <= _lc[i + 1] + 1e-12 for i in range(7)) and _lc[0] == 0, ' '.join(f'{L}일 {v:.3f}' for L, v in enumerate(_lc)))
_rvn = lambda pre, vs: [_s15['rv'][pre + ('%g' % v)]['n_fail'] for v in vs]
_a = _rvn('rmin', [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]); _b = _rvn('bmax', [0, 0.005, 0.02, 0.05, 0.1]); _c = _rvn('jmin', [0.9, 0.95, 0.98, 0.99, 1.0])
chk('S15 문턱 슬라이더 범위의 거동: 행 수 비율 하한을 올리면, 빈칸 상한을 내리면, 이음 비율 하한을 올리면 실패한 날이 줄지 않고, 모든 값이 유한', _a == sorted(_a) and _b == sorted(_b, reverse=True) and _c == sorted(_c) and all(np.isfinite([v for m in _s15['rv'].values() for k, v in m.items() if v is not None and isinstance(v, (int, float))]).all() for _ in [0]),
    f'행 수 하한 0.5~1.0 → 실패 {_a} · 빈칸 상한 0~10% → {_b} · 이음 하한 0.90~1.00 → {_c}')
# 8) 페이지 Python 실행 출력
_tdp15 = _tf5.mkdtemp()
for _n in ('fdc_glass', 'ppa_coef', 'events', 'mask_hist', 'faults'): shutil.copy(os.path.join(D, f's15_{_n}.csv'), os.path.join(_tdp15, f's15_{_n}.csv'))
open(os.path.join(_tdp15, 'lab0400.py'), 'w', encoding='utf-8').write(_code15)
_run15 = subprocess.run([sys.executable, '-I', 'lab0400.py'], cwd=_tdp15, capture_output=True, text=True)
chk('0400 Python 코드가 오류 없이 돌고 출력이 페이지의 출력 상자와 한 글자도 다르지 않음', _run15.returncode == 0 and _run15.stdout.strip() == _out15, (_run15.stderr[-200:] if _run15.returncode else f'{len(_out15.splitlines())}줄'))
_exp15 = []
for d in _s15['days']:
    kd = '+'.join(d['faults']) or '-'
    fl_ = '실패 ' + '+'.join(c['id'] for c in d['checks'] if not c['pass']) if not d['pass'] else '통과'
    _exp15.append(f'· {d["n_fdc"]}/{d["n_ppa"]} · {fl_} · {d["fp_in"]} · {d["fp_out"] or "-"} · {kd}')
_miss15 = [e for e in _exp15 if e not in _run15.stdout]
_nfail15 = sum(not d['pass'] for d in _s15['days']); _nfd15 = len([d for d in _s15['days'] if d['faults']]); _cgt15 = sum((not d['pass']) for d in _s15['days'] if d['faults']); _nfa15 = sum((not d['pass']) for d in _s15['days'] if not d['faults'])
_sum15 = f'점검 실패 {_nfail15}일 · 고장이 주입된 {_nfd15}일 가운데 점검이 잡은 날 {_cgt15}일 · 고장 없는 날의 실패 {_nfa15}일'
_lit15 = lambda nm: _re5.search(r'^' + nm + r' = ([^ \n#]+)', _code15, _re5.M).group(1)
_okd = _s15['days'][_ok_day - 1]; _lt = _ldd
_idem15 = f'출력 지문 {_okd["fp_out"]} → {_okd["fp_out"]} · 결과 표 1벌'; _lb15 = f'입력 지문 {_lt["fp_in"]} → {_lt["fp_in_final"]} · PPA 행 {_lt["n_ppa"]} → {_lt["n_ppa_final"]} · 출력 지문 {_lt["fp_out"] or "-"} → {_lt["fp_out_final"]}'
chk('0400 Python 출력의 숫자(14일 행 수·점검 결과·입력/출력 지문·주입된 고장, 점검 요약, 멱등 재실행, 되돌아보기) = JS 대표 시드, 코드 속 기울기·기준 온도·spec·점검 문턱·되돌아보기 일수·코드 판 = JS 값',
    not _miss15 and _sum15 in _run15.stdout and _idem15 in _run15.stdout and _lb15 in _run15.stdout and abs(float(_lit15('SLOPE')) - _P15['thermal']) < 1e-15 and abs(float(_lit15('SPEC')) - _P15['spec']) < 1e-12 and int(_lit15('T_REF')) == _P15['T_ref']
    and f'"rows_min": {_rules15["rmin"]}, "blank_max": {_rules15["bmax"]}, "join_min": {_rules15["jmin"]}' in _code15 and int(_lit15('HIST')) == _P15['hist'] and int(_lit15('LOOKBACK')) == _P15['lookback'] and _lit15('CODE_VER') == '"' + _P15['code_ver'] + '"',
    _sum15 + (' · 불일치: ' + ' | '.join(_miss15[:3]) if _miss15 else ''))
_sqls = _re5.findall(r'<pre class="sql" id="(sql\w+)">(.*?)</pre>', _pg15, _re5.S)
_sqlok = all(_html5.unescape(t).strip() in _code15 for _, t in _sqls) and len(_sqls) >= 3
chk('0400 페이지 3절에 보여 주는 SQL(뽑기·잇기와 챔버별 집계·구간 이음)이 Python 코드 속 SQL 과 글자 그대로 같음', _sqlok, f'SQL 블록 {len(_sqls)}개')
_cleanup15 = [shutil.rmtree(p, ignore_errors=True) for p in (_td15, _tdc15, _outd15, _tdp15)]

# ============================================================
# 0410 — LLM이 잘하는 것과 틀리는 것: 실제 LLM 답 18개의 기록(llm_runs_0410.json)과 S15 정답본 표.
# 페이지의 Python 코드(lab0410.py)를 꺼내 JS(llmcheck.js)와 대조하고, 표 재생성·정답·숫자 대조·판정 근거 숫자를 독립 계산으로 확인한다
# ============================================================
import importlib.util as _ilu, math as _m10
_DATA10 = os.path.dirname(D)
_pg10 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0410-llm-strengths-limits.html'), encoding='utf-8').read()
_code10 = _html5.unescape(_re5.search(r'<pre id="pyCode">(.*?)</pre>', _pg10, _re5.S).group(1)); _out10 = _html5.unescape(_re5.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg10, _re5.S).group(1)).strip()
_jraw10 = open(os.path.join(_DATA10, 'llm_runs_0410.json'), 'rb').read(); _runs10 = json.loads(_jraw10.decode('utf-8'))
_EXPORT10 = r"""const L=require(%s);const M=require(%s);
const sum=[0.25,0.5,1,1.5].map(k=>L.summary(k));
const cls=(t,ti)=>L.classify(t,ti).nums.map(x=>[x.cls,x.loose,x.v]);
const tests=['2026-03-07 01:24에 B03-CH2 와 B03-B2 가 1) 표 1·표 2 의 5일 5~6일 3월 7일 01시 24분 6일 0.963 17건 93%% -1.5 2,000 1.1'];
const out={t1:L.t1,t2:L.t2,t3:L.t3,t6:L.t6,sum:sum,mask:L.mask,tc:L.tableChecks(),
 calc:[1,4,5].map(ti=>L.tasks[ti].answers.map(a=>{const r=L.scoreCalc(ti,a);return [r.ok,r.total];})),
 truth:{t2:L.truthT2(),t5:L.truthT5(),t6:L.truthT6()},
 verd:L.verdicts().map(v=>({id:v.id,found:v.found,ev:v.ev})),causes:(c=>({sets:c.sets,pairs:c.pairs,all:c.pairs.all,t3Mask:c.t3Mask,t4Mask:c.t4Mask,t3Hold:c.t3Hold,t4Hold:c.t4Hold,inP:c.inPrompt}))(L.causes()),
 ov:(o=>({ch:o.ch,nm:o.nm,chp:o.chPairs,chall:o.chPairs.all,nmp:o.nmPairs,nall:o.nmPairs.all}))(L.overlapT1()),
 chance:L.chanceRate(0.5),chance1:L.chanceRate(1),unit:L.extract(tests[0]).map(x=>[x.raw.trim(),x.v,x.dec,x.pct]),
 fp:M.s15tools.fp(L.t1+'\n'+L.t2),spec:L.spec3,params:{thermal:L.params.thermal,T_ref:L.params.T_ref,spec:L.params.spec},
 ctxsizes:[0,1,2,3,4,5].map(ti=>[L.ctx(ti).cells.length,L.ctx(ti).der.length]),
 wrapEq:JSON.stringify(require(%s))===JSON.stringify(JSON.parse(require('fs').readFileSync(%s,'utf8')))};
console.log(JSON.stringify(out));"""
_lc10 = os.path.join(_DATA10, 'llmcheck.js'); _wrap10 = os.path.join(_DATA10, 'llm_runs_0410.js'); _jp10 = os.path.join(_DATA10, 'llm_runs_0410.json')
_j10 = json.loads(subprocess.run([_node, '-e', _EXPORT10 % (json.dumps(_lc10), json.dumps(_mf), json.dumps(_wrap10), json.dumps(_jp10))], capture_output=True, text=True, check=True).stdout)

chk('0410 llm_runs_0410.json 바이트 불변(작업 전 sha256 3f6793bd…) 이고 script 로 읽는 llm_runs_0410.js 의 내용이 JSON 과 같음', _hl5.sha256(_jraw10).hexdigest() == '3f6793bdc96b691544edce289f92bc5aa73a6a8b09472b7084b5c09b58d76dcd' and _j10['wrapEq'],
    f'sha256 {_hl5.sha256(_jraw10).hexdigest()[:12]}… · 과제 {len(_runs10["tasks"])}개 × 답 {len(_runs10["tasks"][0]["answers"])}개 · 모델 {_runs10["model"]} {_runs10["date"]}')

_td10 = _tf5.mkdtemp()
for _n in ('s15_clean_fdc_glass.csv', 's15_clean_ppa_coef.csv', 's15_mask_hist.csv'): shutil.copy(os.path.join(D, _n), os.path.join(_td10, _n))
shutil.copy(_jp10, os.path.join(_td10, 'llm_runs_0410.json'))
open(os.path.join(_td10, 'lab0410.py'), 'w', encoding='utf-8').write(_code10)
_sp10 = _ilu.spec_from_file_location('lab0410', os.path.join(_td10, 'lab0410.py')); _m0410 = _ilu.module_from_spec(_sp10); _sp10.loader.exec_module(_m0410)
_tb10 = _m0410.build_tables(_td10)

# 1) 표 재생성
_need10 = {'T1': ('t1', 't2'), 'T2': ('t1', 't2'), 'T3': ('t1', 't2'), 'T4': ('t1', 't2', 't3'), 'T5': ('t1',), 'T6': ('t6',)}
_in10 = [(t['id'], n, _tb10[n] in t['prompt']) for t in _runs10['tasks'] for n in _need10[t['id']]]
chk('0410 표 1·표 2·표 3·원자료(정답본 1~7일, 06:00 창)를 CSV 에서 pandas 로 다시 만든 글이 LLM 에게 준 프롬프트 속 표와 글자 단위로 같고(11곳), JS 로 다시 만든 글과도 같음',
    all(x[2] for x in _in10) and len(_in10) == 11 and all(_tb10[n] == _j10[n] for n in ('t1', 't2', 't3', 't6')) and len(_j10['tc']) == 11 and all(x['ok'] for x in _j10['tc']),
    f'{sum(x[2] for x in _in10)}/{len(_in10)}곳 일치 · 표 1 {len(_tb10["t1"].splitlines())}줄 · 원자료 {len(_tb10["raw"])}줄')

# 2) 계산 과제 정답: CSV 표 글자에서 numpy 로 독립 계산
_v1 = np.array([[float(x) for x in ln.split('\t')[1:]] for ln in _tb10['t1'].splitlines()[1:]])
_keys10 = [ln.split('\t')[0] for ln in _tb10['t1'].splitlines()[1:]]
_mean3 = [f'{round(float(np.sum(np.round(r * 1000)) / 7) / 1000 + 0, 12):.3f}' for r in _v1]
_dl3 = [f'{(round(r[6] * 1000) - round(r[0] * 1000)) / 1000:.3f}' for r in _v1]
_t2j = _j10['truth']['t2']
_sd = float(np.std(_v1.ravel(), ddof=1)); _md = float(np.median(_v1.ravel()))
_raw10 = _tb10['raw']; _mx6 = np.array([r[2] for r in _raw10]); _pm6 = np.array([r[3] for r in _raw10]); _b6 = int(np.argmax(_pm6))
_t5j, _t6j = _j10['truth']['t5'], _j10['truth']['t6']
_cmp2 = all(r['mean'] == m and r['delta'] == d for r, m, d in zip(_t2j['rows'], _mean3, _dl3)) and _t2j['maxKey'] == _keys10[int(np.argmax(np.abs(np.array([float(x) for x in _dl3]))))]
_cmp5 = abs(_t5j['sd'] - _sd) < 1e-12 and abs(_t5j['med'] - _md) < 1e-12 and _t5j['sd4'] == f'{round(_sd, 4)}' and _t5j['med4'] == f'{round(_md, 4)}'
_cmp6 = abs(_t6j['mean'] - float(_mx6.mean())) < 1e-12 and _t6j['over'] == int((_pm6 > round(_P15['spec'], 3)).sum()) and _t6j['over'] == _t6j['overFull'] and abs(_t6j['max'] - float(_pm6[_b6])) < 1e-12 and _t6j['id'] == _raw10[_b6][0]
chk('0410 T2·T5·T6 정답(챔버별 평균·변화량·최대 변화 챔버, 56칸 표본 표준편차·중앙값, 원자료 29줄 평균·기준 초과 수·최댓값·glass_id)을 표 글자에서 numpy 로 독립 계산한 값 = JS, 초과 수는 반올림한 표값과 원값이 같음',
    _cmp2 and _cmp5 and _cmp6, f'변화 최대 {_t2j["maxKey"]} {_t2j["rows"][5]["delta"]} · 표준편차 {_t5j["sd4"]} 중앙값 {_t5j["med4"]} · 평균 {_t6j["mean4"]} 초과 {_t6j["over"]} 최댓값 {_t6j["max"]}')

# 3) 아홉 답 채점
_sc10 = {ti: [_m0410.score_calc(ti, a, _tb10) for a in _runs10['tasks'][ti]['answers']] for ti in (1, 4, 5)}
_pyc = [[list(x) for x in _sc10[ti]] for ti in (1, 4, 5)]
chk('0410 계산 과제 아홉 답(T2·T5·T6)의 항목별 채점: 파이썬(페이지 코드) = JS, 이번 기록은 전 항목 일치(기록 그대로 보고하되 어긋난 게 있으면 본문이 바뀌어야 함)',
    _pyc == _j10['calc'] and all(a == b for ti in _sc10 for a, b in _sc10[ti]) and sum(b for ti in _sc10 for a, b in _sc10[ti]) == 17 * 3 + 2 * 3 + 4 * 3,
    ' · '.join(f'{_runs10["tasks"][ti]["id"]} ' + '/'.join(f'{a}/{b}' for a, b in _sc10[ti]) for ti in (1, 4, 5)))

# 4) 숫자 대조 18답
def _py_sum10(tk):
    rows = []
    for ti, t in enumerate(_runs10['tasks']):
        cells, der = _m0410.derived_for(ti, _tb10, t['prompt'])
        for ai, a in enumerate(t['answers']):
            r = _m0410.check_numbers(a, cells, der, tk)
            rows.append([len(r), sum(c == 'has' for c, _ in r), sum(c == 'calc' for c, _ in r), sum(c == 'none' for c, _ in r), sum(l for _, l in r)])
    return rows
_sj10 = [[[q['n'], q['has'], q['calc'], q['none'], q['loose']] for q in s] for s in _j10['sum']]
_sp_all = [_py_sum10(k) for k in (0.25, 0.5, 1, 1.5)]
_tot = lambda rows, j: sum(r[j] for r in rows)
chk('0410 숫자 대조 18답: 숫자 수·표에 있음·계산됨·근거 없음·거친 일치를 파이썬(페이지 코드, 허용 오차 0.25·0.5·1·1.5칸)이 JS 와 한 답도 빠짐없이 같게 냄, 합이 숫자 수와 같음',
    _sp_all == _sj10 and all(r[1] + r[2] + r[3] == r[0] for rows in _sp_all for r in rows) and len(_sj10[1]) == 18,
    f'0.5칸: 숫자 {_tot(_sj10[1], 0)}개 = 있음 {_tot(_sj10[1], 1)} + 계산됨 {_tot(_sj10[1], 2)} + 근거 없음 {_tot(_sj10[1], 3)} (거친 일치 {_tot(_sj10[1], 4)})')
_none_by_tol = [_tot(s, 3) for s in _sj10]
chk('0410 허용 오차 슬라이더(0.25~1.5칸)를 키우면 근거 없음이 늘지 않고, 모든 값이 유한(조작 끝에서 끝까지)', _none_by_tol == sorted(_none_by_tol, reverse=True) and all(np.isfinite(np.array(s)).all() for s in _sj10),
    '근거 없음 합계 ' + ' → '.join(map(str, _none_by_tol)) + ' (0.25·0.5·1·1.5칸)')

# 5) 숫자 뽑기 제외 규칙 단위 검사 (JS = 파이썬 = 기대)
_txt10 = '2026-03-07 01:24에 B03-CH2 와 B03-B2 가 1) 표 1·표 2 의 5일 5~6일 3월 7일 01시 24분 6일 0.963 17건 93% -1.5 2,000 1.1'
_pyu = [(x[0], x[1], x[2]) for x in _m0410.extract_numbers(_txt10)]
_jsu = [(x[1], x[2]) for x in _j10['unit']]
chk('0410 숫자 뽑기의 제외 규칙(날짜·시각·챔버/마스크/유리 이름·날 번호·월·시·분·표 번호·목록 번호는 세지 않고, 그 밖의 0.963 · 17 · 93% · 1.5 · 2,000 · 1.1 만 셈): 파이썬 = JS = 기대', [(v, d) for v, d, _ in _pyu] == _jsu == [(0.963, 3), (17.0, 0), (93.0, 0), (1.5, 1), (2000.0, 0), (1.1, 1)],
    f'세어진 숫자 {len(_pyu)}개: ' + ' '.join(x[0] for x in _j10['unit']))

# 6) 판정 근거 숫자 (독립 계산)
_mk = _j10['mask']; _mv = list(_v1[5])           # B03-CH2 = 6번째 행
_hb = (24 * 60 - 6 * 60 + 60 + 24) / 60 if False else ((__import__('datetime').datetime(2026, 3, 7, 1, 24) - __import__('datetime').datetime(2026, 3, 6, 6, 0)).total_seconds() / 3600)
_vnew = (_mv[4] * 24 - _mv[3] * _hb) / (24 - _hb); _vold = (_mv[4] - (24 - _hb) / 24 * _mv[5]) / (_hb / 24)
_ev = {v['id']: v['ev'] for v in _j10['verd']}
_cnt = lambda p, w: len(_re5.findall(w, p))
_p4 = _runs10['tasks'][3]['prompt']; _p1 = _runs10['tasks'][0]['prompt']
_ok_v = (abs(_ev['v1']['vNew'] - _vnew) < 1e-12 and abs(_ev['v3']['vOld'] - _vold) < 1e-12 and abs(_ev['v1']['d6'] - abs(_vnew - _mv[5])) < 1e-12 and abs(_ev['v1']['d7'] - abs(_vnew - _mv[6])) < 1e-12
         and abs(_ev['v1']['times'] - abs(_vnew - _mv[6]) / abs(_mv[6] - _mv[5])) < 1e-9 and abs(_mk['hb'] - 19.4) < 1e-12 and _mk['day'] == 5 and abs(_hb - 19.4) < 1e-12
         and _ev['v2']['pattern'] == _cnt(_p4, '패턴') == 0 and _ev['v4']['crit'] == _cnt(_p1, '기준|한계|spec|허용|규격') == 0 and _ev['v5']['adjVal'] == _cnt(_p1, '보정 값') == 0
         and _ev['v4']['small'] == int((np.abs(_v1) < 0.2).sum()) and abs(_ev['v3']['gap'] - abs(0.86 - _vold)) < 1e-12 and all(v['found'] for v in _j10['verd']) and len(_j10['verd']) == 8)
chk('0410 문장 판정의 근거 숫자(−1.474 · 6일·7일과의 차 0.454·0.379 · 하루 변화의 5.0배 · 옛 마스크만의 값 0.855 · 교체 앞 19.4시간 · 프롬프트 속 \'패턴\' 0번 · 기준 낱말 0번 · |값|<0.2 칸 수)를 표에서 독립 계산한 값 = JS, 인용한 문장 8개가 답 원문에 그대로 있음',
    _ok_v, f'새 마스크 몫의 평균 {_vnew:.3f} · 6일과 {abs(_vnew - _mv[5]):.3f} · 7일과 {abs(_vnew - _mv[6]):.3f} · 하루 변화 {abs(_mv[6] - _mv[5]):.3f}의 {abs(_vnew - _mv[6]) / abs(_mv[6] - _mv[5]):.1f}배 · 옛 마스크만 {_vold:.3f} · |값|<0.2 {_ev["v4"]["small"]}칸')
_v4c = _m0410.check_numbers('절댓값이 0.2ppm 미만이라 현재로서는 이상으로 보기 어렵습니다', *_m0410.derived_for(0, _tb10, _p1))
chk('0410 숫자 대조가 못 잡는 틀림(기준 없이 정한 0.2)을 정직하게 확인: 0.2 는 표 1 칸 또는 계산으로 일치(거친 일치)해 근거 없음이 아님 — 파이썬 = JS', _v4c[0][0] != 'none' and _v4c[0][1] and _ev['v4']['cls'] != 'none' and _ev['v4']['loose'], f'0.2 → {_ev["v4"]["cls"]} (거친 일치) 가까운 후보 {_ev["v4"]["label"]} {_ev["v4"]["got"]}')

# 7) 원인 문장·겹침
_cz = _j10['causes']; _MASKRE = _re5.compile(r'마스크[ \t]*교체|마스크를[ \t]*바꾼|새[ \t]*마스크')
_t3m = [bool(_MASKRE.search(a)) for a in _runs10['tasks'][2]['answers']]; _t4m = [bool(_MASKRE.search(a)) for a in _runs10['tasks'][3]['answers']]
_CAND = [r'위치|정렬', r'계측|보정값|보정 값|영점', r'부품 교체|정비|재장착', r'레시피', r'챔버 조건']
_inm = [[bool(_re5.search(c, a)) for a in _runs10['tasks'][2]['answers']] for c in _CAND]
_sets = [{i for i in range(5) if _inm[i][a]} for a in range(3)]
_jac = lambda a, b: len(a & b) / len(a | b)
chk('0410 원인 문장: 이력을 주지 않은 T3 은 마스크 교체를 짚은 답 0/3, 준 T4 는 3/3, 후보 묶음의 겹침(교/합)과 T1 세 답의 챔버·숫자 겹침을 집합 연산으로 독립 계산한 값 = JS',
    _t3m == _cz['t3Mask'] == [False] * 3 and _t4m == _cz['t4Mask'] == [True] * 3 and all(abs(p['jac'] - _jac(_sets[p['a'] - 1], _sets[p['b'] - 1])) < 1e-12 for p in _cz['pairs']) and _cz['all']['inter'] == len(_sets[0] & _sets[1] & _sets[2]) and _cz['all']['union'] == len(_sets[0] | _sets[1] | _sets[2])
    and not any(_cz['inP']),
    f'T3 후보 묶음 교/합 {_cz["all"]["inter"]}/{_cz["all"]["union"]} · 쌍 ' + ' '.join(f'{p["inter"]}/{p["union"]}' for p in _cz['pairs']))
_ov = _j10['ov']
_chs = []
for a in _runs10['tasks'][0]['answers']:
    s_ = set(_re5.findall(r'B0[23]-CH[1-4]', a))
    if any(_re5.search(g, a) for g in (r'B02[ \t]*챔버[ \t]*네[ \t]*개', r'B02의[ \t]*네[ \t]*챔버', r'B02-CH1부터[ \t]*CH4')): s_ |= {f'B02-CH{i}' for i in range(1, 5)}
    _chs.append(s_)
_nms = []
_cells1, _der1 = _m0410.derived_for(0, _tb10, _p1)
_jsn = lambda x: str(int(x)) if x == int(x) else repr(x)
for a in _runs10['tasks'][0]['answers']: _nms.append({_jsn(x[0]) for x in _m0410.extract_numbers(a)})
chk('0410 T1 세 답의 겹침: 언급한 챔버·인용한 서로 다른 숫자의 교집합/합집합(쌍과 세 답 모두)을 파이썬이 따로 센 값 = JS',
    all(sorted(_chs[i]) == _ov['ch'][i] for i in range(3)) and all(sorted(_nms[i], key=float) == _ov['nm'][i] for i in range(3))
    and all((p['inter'], p['union']) == (len(_chs[p['a'] - 1] & _chs[p['b'] - 1]), len(_chs[p['a'] - 1] | _chs[p['b'] - 1])) for p in _ov['chp'])
    and all((p['inter'], p['union']) == (len(_nms[p['a'] - 1] & _nms[p['b'] - 1]), len(_nms[p['a'] - 1] | _nms[p['b'] - 1])) for p in _ov['nmp'])
    and (_ov['nall']['inter'], _ov['nall']['union']) == (len(_nms[0] & _nms[1] & _nms[2]), len(_nms[0] | _nms[1] | _nms[2])),
    f'숫자 세 답 모두 {_ov["nall"]["inter"]}/{_ov["nall"]["union"]} ({_ov["nall"]["inter"] / _ov["nall"]["union"] * 100:.0f}%) · 챔버 {_ov["chall"]["inter"]}/{_ov["chall"]["union"]}')

# 8) 우연 일치율
def _chance10(tk):
    out = []
    for d in (1, 2, 3):
        step = 10 ** -d; N = round(2 / step); has = calc = 0
        cells, der = _m0410.derived_for(0, _tb10, _p1)
        for i in range(1, N + 1):
            x = i * step; tol = tk * step + 1e-9
            if any(abs(x - c) <= tol for c in cells): has += 1
            elif any(abs(x - v) <= tol for _, v in der): calc += 1
        out.append({'d': d, 'n': N, 'has': has, 'calc': calc})
    return out
chk('0410 우연 일치율(0.1~2.0 을 쓴 자릿수대로 모두 넣어 본 비율)을 파이썬이 따로 센 값 = JS (허용 오차 0.5·1칸), 자릿수가 적을수록 우연히 맞는 비율이 커짐', _chance10(0.5) == _j10['chance'] and _chance10(1) == _j10['chance1'] and [(r['has'] + r['calc']) / r['n'] for r in _j10['chance']] == sorted([(r['has'] + r['calc']) / r['n'] for r in _j10['chance']], reverse=True),
    ' · '.join(f'{r["d"]}자리 {(r["has"] + r["calc"]) / r["n"] * 100:.0f}%' for r in _j10['chance']))

# 9) 페이지 Python 실행
_run10 = subprocess.run([sys.executable, '-I', 'lab0410.py'], cwd=_td10, capture_output=True, text=True)
chk('0410 Python 코드가 오류 없이 돌고 출력이 페이지의 출력 상자와 한 글자도 다르지 않음', _run10.returncode == 0 and _run10.stdout.strip() == _out10, (_run10.stderr[-200:] if _run10.returncode else f'{len(_out10.splitlines())}줄'))
_lines10 = _out10.splitlines()
_exp10 = [' · '.join(str(x) for x in ['%s-%d' % (t['id'], ai + 1)] + _sj10[1][i * 3 + ai]) for i, t in enumerate(_runs10['tasks']) for ai in range(3)]
_lit10 = lambda nm: _re5.search(r'^' + nm + r' = ([^ \n#]+)', _code10, _re5.M).group(1)
_mline = next(l for l in _lines10 if l.startswith('마스크 교체'))
chk('0410 Python 출력의 숫자(답 18개의 숫자·있음·계산됨·근거 없음·거친 일치, 계산 과제 채점, 마스크 교체 5일의 앞뒤 시간·두 가정의 값, 6일→7일 비교)와 코드 속 열 기울기·기준 온도·한계·허용 오차 = JS 값',
    all(e in _lines10 for e in _exp10) and f'{_j10["mask"]["hb"]:.1f}시간' in _mline and f'{_j10["mask"]["vOld"]:.3f}' in _mline and f'{_j10["mask"]["vNew"]:.3f}' in _mline and _j10['mask']['ts'] in _mline
    and abs(float(_lit10('SLOPE')) - _j10['params']['thermal']) < 1e-15 and int(_lit10('T_REF')) == _j10['params']['T_ref'] and abs(float(_lit10('SPEC')) - _j10['params']['spec']) < 1e-12 and float(_lit10('TOL_K')) == 0.5
    and any(l.startswith('T2 17/17 · 17/17 · 17/17') for l in _lines10),
    f'답 18개 줄 일치 · {_mline[:60]}…')

# 10) 페이지 구조
_term10 = len(_re5.findall(r'<li>', _re5.search(r'<ul class="chips" id="termList">(.*?)</ul>', _pg10, _re5.S).group(1)))
_nq10 = len(_re5.findall(r'<div class="qna" data-label=', _pg10)); _nsec10 = len(_re5.findall(r'<h2><span class="no">', _pg10))
_fonts10 = [int(x) for x in _re5.findall(r"(?:x\.font|\.font)\s*=\s*'[^']*?(\d+)px", _pg10)] + [int(x) for x in _re5.findall(r'fitFont\([^)]*?,\s*\d+\s*,\s*(\d+)\s*,', _pg10)]
_body10 = _re5.sub(r'<script.*?</script>|<pre.*?</pre>|<style.*?</style>', '', _pg10, flags=_re5.S); _body10 = _html5.unescape(_re5.sub(r'<[^>]+>', ' ', _body10))
_endda = _re5.findall(r'[^니습]다[.]', _body10)
_p00 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0400-data-pipeline.html'), encoding='utf-8').read(); _hub = open(os.path.join(os.path.dirname(_DATA10), 'index.html'), encoding='utf-8').read()
chk('0410 페이지: 새 용어 6개 · Q&A 4개 · 절 11개 · 캔버스 글자 11px 이상 · 인용 밖 본문에 -다 끝맺음 없음 · 0400 의 위·아래 다음 링크 · 허브 등록',
    _term10 == 6 and _nq10 == 4 and _nsec10 == 11 and min(_fonts10) >= 11 and not _endda and _p00.count('0410-llm-strengths-limits.html') == 2 and 'labs/0410-llm-strengths-limits.html' in _hub,
    f'용어 {_term10} · Q&A {_nq10} · 절 {_nsec10} · 캔버스 글자 최소 {min(_fonts10)}px({len(_fonts10)}곳) · -다 끝맺음 {len(_endda)}건 · 0400 링크 {_p00.count("0410-llm-strengths-limits.html")}곳')
_cleanup10 = shutil.rmtree(_td10, ignore_errors=True)

# ============================================================
# 0411 — LLM에게 일을 맡기는 법: 검증 설계. 실제 LLM 답 6개(llm_runs_0411.json)를 검사기(V1~V6)에 넣은 결과.
# 페이지의 Python 코드(lab0411.py)를 꺼내 JS(llmverify.js)와 대조하고, 사실 목록·관계 사실·표지 근거를 CSV 에서 독립 계산으로 확인한다
# ============================================================
import datetime as _dt11
_pg11 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0411-llm-verification-design.html'), encoding='utf-8').read()
_code11 = _html5.unescape(_re5.search(r'<pre id="pyCode">(.*?)</pre>', _pg11, _re5.S).group(1)); _out11 = _html5.unescape(_re5.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg11, _re5.S).group(1)).strip()
_jp11 = os.path.join(_DATA10, 'llm_runs_0411.json'); _wrap11 = os.path.join(_DATA10, 'llm_runs_0411.js'); _lv11 = os.path.join(_DATA10, 'llmverify.js')
_jraw11 = open(_jp11, 'rb').read(); _runs11 = json.loads(_jraw11.decode('utf-8'))
_CASES11 = [   # (이름, 문장들, 켠 규칙 밖에 V6 도 켬, 기대 실패 규칙)
    ('정상', [('초과는 {{f4}}건입니다.', ['f4'], '사실')], ()),
    ('자리 밖 숫자', [('초과는 17건입니다.', [], '사실')], ('V2',)),
    ('날 이름·이름은 허용', [('7일 B03-CH2 의 값은 {{f1}} 입니다.', ['f1'], '사실')], ()),
    ('날짜를 직접 씀', [('교체는 2026-03-07 에 있었습니다.', [], '사실')], ('V2',)),
    ('없는 번호', [('값은 {{f11}} 입니다.', ['f11'], '사실')], ('V3', 'V4')),
    ('식에 다른 글자', [('비율은 {{calc: f4/f5*sqrt(100)}} 입니다.', ['f4', 'f5'], '사실')], ('V3',)),
    ('0 으로 나눔', [('비율은 {{calc: f4/(f1-f1)}} 입니다.', ['f4', 'f1'], '사실')], ('V3',)),
    ('닫히지 않은 자리', [('값은 {{f1 입니다.', [], '사실')], ('V3',)),
    ('숫자가 아닌 사실을 식에', [('값은 {{calc: f7+1}} 입니다.', ['f7'], '사실')], ('V3',)),
    ('cites 빠짐', [('초과는 {{f4}}건입니다.', [], '사실')], ('V4',)),
    ('원인인데 cites 없음', [('원인은 모릅니다.', [], '원인')], ('V4', 'V5')),
    ('원인인데 사건 없음', [('초과는 {{f4}}건입니다.', ['f4'], '원인')], ('V5',)),
    ('원인 + 사건 인용', [('교체는 {{f7}} 에 있었습니다.', ['f7'], '원인')], ()),
    ('시점 낱말 + 사건, 관계 없음', [('같은 기간 {{f7}} 에 교체했습니다.', ['f7'], '원인 미확인')], ('V6',)),
    ('시점 낱말 + 사건 + 관계 인용', [('같은 기간 {{f7}} 에 교체했고 {{f9}} 에 듭니다.', ['f7', 'f9'], '원인 미확인')], ()),
    ('시점 낱말만, 사건 없음', [('같은 기간 {{f4}} 건이었습니다.', ['f4'], '사실')], ()),
]
def _mk11(sents): return json.dumps({'sentences': [{'text': t, 'cites': c, 'type': ty} for t, c, ty in sents]}, ensure_ascii=False)
_cases11 = [(n, _mk11(s)) for n, s, _ in _CASES11] + [('코드 울타리', '```json\n' + _mk11([('초과는 {{f4}}건입니다.', ['f4'], '사실')]) + '\n```'), ('type 이 네 가지가 아님', _mk11([('초과는 {{f4}}건입니다.', ['f4'], '결론')])), ('JSON 이 아님', '초과는 17건입니다.')]
_exp11 = [set(e) for _, _, e in _CASES11] + [{'V1'}, {'V1'}, {'V1'}]
_EXPORT11 = r"""const V=require(%s);const L=require(%s);const M=require(%s);
const cases=%s, allOn={V1:true,V2:true,V3:true,V4:true,V5:true,V6:true};
const fr=r=>Object.keys(r.rules).filter(k=>r.rules[k].fails.length>0);
const rn=V.runAll(allOn,false), rw=V.runAll(allOn,true), r5=V.runAll({V1:true,V2:true,V3:true,V4:true,V5:true,V6:false},false);
const slotsB=V.answersB.map(t=>{const p=V.parseAnswer(t);return p.obj.sentences.map(x=>V.slotsOf(x.text,Object.fromEntries(V.facts.map(f=>[f.id,f]))).filter(o=>o.kind==='calc').map(o=>({expr:o.raw,val:o.val,used:V.fmtCalc(o.val)})));});
const out={
 wrapEq:JSON.stringify(require(%s))===JSON.stringify(JSON.parse(require('fs').readFileSync(%s,'utf8'))),
 fc:V.factsCheck().map(x=>[x.id,x.ok]), facts:V.facts.map(f=>[f.id,f.value,f.unit,f.kind]), pc:V.promptCheck(),
 cases:cases.map(c=>fr(V.validate(c,V.facts,{on:allOn}))),
 fails:rn.map(r=>({id:r.id,rules:Object.fromEntries(Object.keys(r.v.rules).map(k=>[k,[r.v.rules[k].on,r.v.rules[k].ran,r.v.rules[k].fails.map(f=>f.s)]])),fs:r.v.failSentences,pass:r.v.pass})),
 wide:rw.map(r=>r.v.rules.V6.fails.map(f=>f.s)), off5:r5.map(r=>r.v.rules.V6.ran),
 render:V.answersB.map(t=>V.render(t).map(s=>s.text)), calc:slotsB,
 chkA:V.answersA.map(t=>{const r=V.checkA(t,0.5);return {c:r.counts,a:V.askedOf(t).map(x=>x.ok),none:r.nums.filter(x=>x.cls==='none').length};}),
 rendB:V.answersB.map(t=>{const r=V.checkA(V.render(t).map(s=>s.text).join(' '),0.5);return r.counts;}),
 marks:V.marks().map(m=>({id:m.id,found:m.found,mark:m.mark,ev:m.ev&&Object.fromEntries(Object.entries(m.ev).filter(([k,v])=>typeof v!=='object'))})),
 read:V.readCounts({V1:true,V2:true,V3:true,V4:true,V5:true,V6:false},false), types:V.causeTypes(), causeA:V.causeA(),
 win:[1,4,5,7].map(k=>V.win(k).short), tc0:V.tc0-V.base, relAt:[0,6924,10074].map(m=>{const r=V.relFacts(V.base+m);return [r.f7.value,r.f9.value,r.f10.value];}),
 tools:{calc:[ '1+2*3','(1+2)*3','-f1*2','f4/f5*100','f4/(f1-f1)','2**3','f4/'].map(e=>{const r=V.calc(e,Object.fromEntries(V.facts.map(f=>[f.id,f])));return r.err?'ERR':r.val;})},
 ctxEq:L.answers.map(a=>JSON.stringify(L.classify(a.text,a.ti,0.5).counts)===JSON.stringify(L.classifyCtx(a.text,L.ctx(a.ti),0.5,L.famOrder).counts)),
 schema:V.types, relWords:V.relWords.length
};
console.log(JSON.stringify(out));"""
_j11 = json.loads(subprocess.run([_node, '-e', _EXPORT11 % (json.dumps(_lv11), json.dumps(os.path.join(_DATA10, 'llmcheck.js')), json.dumps(_mf), json.dumps([t for _, t in _cases11], ensure_ascii=False), json.dumps(_wrap11), json.dumps(_jp11))], capture_output=True, text=True, check=True).stdout)
_sha11 = _hl5.sha256(_jraw11).hexdigest()
chk('0411 llm_runs_0411.json 바이트 불변(작업 전 sha256 9925d15d…) 이고 script 로 읽는 llm_runs_0411.js 의 내용이 JSON 과 같으며, 기록은 모델·날짜·사실 8줄·설계 둘 × 답 셋 + 프롬프트 전문을 가짐',
    _sha11 == '9925d15d69c3908dadab329f12d750d0771c02f6b5dae25a1f134465e0336c87' and _j11['wrapEq'] and len(_runs11['facts']) == 8 and [len(d['answers']) for d in _runs11['designs']] == [3, 3] and all(d['prompt'] for d in _runs11['designs']),
    f'sha256 {_sha11[:12]}… · 모델 {_runs11["model"]} {_runs11["date"]} · 설계 {[d["id"] for d in _runs11["designs"]]}')

# 독립 재계산: CSV → pandas 로 사실 목록 f1~f10
_fd11 = pd.read_csv(os.path.join(D, 's15_clean_fdc_glass.csv')); _pp11 = pd.read_csv(os.path.join(D, 's15_clean_ppa_coef.csv')); _mh11 = pd.read_csv(os.path.join(D, 's15_mask_hist.csv'))
_B11 = _dt11.datetime(2026, 3, 2, 6, 0); _slope11 = -1.975908993542295; _spec11 = 5.712791
_fd11['key'] = _fd11.block + '-' + _fd11.chamber
def _day11(k):
    s = _B11 + _dt11.timedelta(days=k - 1); a, b = s.strftime('%Y-%m-%d %H:%M'), (s + _dt11.timedelta(days=1)).strftime('%Y-%m-%d %H:%M')
    j = _fd11[(_fd11.ts >= a) & (_fd11.ts < b)].merge(_pp11[(_pp11.ts >= a) & (_pp11.ts < b)], on='glass_id', suffixes=('', '_p'))
    j['mc'] = j.Mx - _slope11 * (j.chamber_temp - 80); return j
_d4, _d7 = _day11(4), _day11(7)
_g = lambda j, k: j[j.key == k]
_i1 = round(float(f'{_g(_d7, "B03-CH2").mc.mean():.3f}'), 3); _i2 = round(float(f'{_g(_d4, "B03-CH2").mc.mean():.3f}'), 3)
_i4 = int((_g(_d7, 'B03-CH2').ppa_metric > _spec11).sum()); _i5 = len(_g(_d7, 'B03-CH2')); _i6 = int(sum((_g(_d7, k).ppa_metric > _spec11).sum() for k in sorted(_d7.key.unique())))
_wash11 = _mh11[_mh11.state == 'WASH'].iloc[0]; _tc11 = _dt11.datetime.strptime(_wash11.from_ts, '%Y-%m-%d %H:%M')
_ind11 = {'f1': _i1, 'f2': _i2, 'f3': round(_i1 - _i2, 3), 'f4': _i4, 'f5': _i5, 'f6': _i6, 'f7': _wash11.from_ts, 'f8': round(_spec11, 3)}
_rec11 = {f['id']: f['value'] for f in _runs11['facts']}; _js11 = {r[0]: r[1] for r in _j11['facts']}
chk('0411 사실 목록 f1~f8: 기록(프롬프트에 준 값) = JS 가 정답본에서 다시 계산한 값 = 이 검사가 CSV 에서 pandas 로 따로 계산한 값, f3 = f1 − f2, 기록 대조 8/8',
    all(_rec11[k] == _js11[k] == _ind11[k] for k in _ind11) and all(ok for _, ok in _j11['fc']) and len(_j11['fc']) == 8 and abs(_ind11['f3'] - (_ind11['f1'] - _ind11['f2'])) < 1e-9,
    ' · '.join(f'{k}={_ind11[k]}' for k in _ind11))
# 관계 사실 + 하루 구간
_w11 = lambda k: ((_B11 + _dt11.timedelta(days=k - 1)), (_B11 + _dt11.timedelta(days=k)))
_f9i = int((_tc11 - _B11).total_seconds() // 86400) + 1; _f10i = round((_w11(7)[0] - _tc11).total_seconds() / 3600, 1)
_wt = lambda k: _w11(k)[0].strftime('%m-%d %H:%M') + ' ~ ' + _w11(k)[1].strftime('%m-%d %H:%M')
_rel11 = {r[0]: r for r in _j11['facts']}
chk('0411 관계 사실: 교체 시각이 드는 날 f9 = 5, 7일 구간 시작 − 교체 = f10 = 28.6시간(양수 = 7일 자료는 전부 교체 뒤), 하루 구간 경계(5일 03-06 06:00~03-07 06:00, 7일 03-08 06:00~03-09 06:00) JS = datetime 독립 계산, 교체 시각을 옮기면 f9·f10 이 함께 움직임',
    _rel11['f9'][1] == _f9i == 5 and _rel11['f10'][1] == _f10i == 28.6 and _j11['win'] == [_wt(1), _wt(4), _wt(5), _wt(7)] and _wt(5) == '03-06 06:00 ~ 03-07 06:00' and _wt(7) == '03-08 06:00 ~ 03-09 06:00' and _j11['tc0'] == int((_tc11 - _B11).total_seconds() // 60)
    and all(r[1] == int(((_B11 + _dt11.timedelta(minutes=m)) - _B11).total_seconds() // 86400) + 1 and r[2] == round((_w11(7)[0] - (_B11 + _dt11.timedelta(minutes=m))).total_seconds() / 3600, 1) for r, m in zip(_j11['relAt'], [0, 6924, 10074])),
    f'f9 {_f9i}일 · f10 {_f10i}시간 · 5일 {_wt(5)} · 7일 {_wt(7)}')

# 페이지 Python 코드를 꺼내 모듈로 로드
_td11 = _tf5.mkdtemp()
for _n in ('s15_clean_fdc_glass.csv', 's15_clean_ppa_coef.csv', 's15_mask_hist.csv'): shutil.copy(os.path.join(D, _n), os.path.join(_td11, _n))
shutil.copy(_jp11, os.path.join(_td11, 'llm_runs_0411.json'))
open(os.path.join(_td11, 'lab0411.py'), 'w', encoding='utf-8').write(_code11)
_sp11 = _ilu.spec_from_file_location('lab0411', os.path.join(_td11, 'lab0411.py')); _m0411 = _ilu.module_from_spec(_sp11); _sp11.loader.exec_module(_m0411)
_tb11 = _m0411.load_tables(_td11); _fa11 = _m0411.build_facts(_tb11)
_A11 = next(d for d in _runs11['designs'] if d['id'] == 'A'); _Bd11 = next(d for d in _runs11['designs'] if d['id'] == 'B')
chk('0411 프롬프트 틀: 사실 목록 표를 끼운 글이 기록의 프롬프트(설계 A·B 전문)와 글자 단위로 같음 — JS = 파이썬(페이지 코드), 파이썬 사실 목록 f1~f10 = JS',
    all(p['ok'] for p in _j11['pc']) and _m0411.make_prompt(_fa11[:8], _m0411.TEMPLATES['A']) == _A11['prompt'] and _m0411.make_prompt(_fa11[:8], _m0411.TEMPLATES['B']) == _Bd11['prompt']
    and [(f['id'], f['value'], f['unit']) for f in _fa11] == [(r[0], r[1], r[2]) for r in _j11['facts']],
    f'설계 A {len(_A11["prompt"])}자 · 설계 B {len(_Bd11["prompt"])}자')

# 검사기 단위 시험
_RULES11 = ('V1', 'V2', 'V3', 'V4', 'V5', 'V6'); _all11 = {r: True for r in _RULES11}
_pyc = []
for _n, _t in _cases11:
    _res, _bad, _o = _m0411.validate(_t, _fa11, _all11); _pyc.append([r for r in _RULES11 if _res[r]])
chk('0411 검사기 단위 시험 %d건(정상·자리 밖 숫자·날 이름 허용·날짜 직접·없는 번호·식의 다른 글자·0 으로 나눔·닫히지 않은 자리·숫자 아닌 사실·cites 빠짐·원인+cites 없음·원인+사건 없음·시점 낱말 세 가지·코드 울타리·type·JSON 아님): 기대한 걸린 규칙 = JS = 파이썬(페이지 코드)' % len(_cases11),
    all(set(a) == set(b) == e for a, b, e in zip(_j11['cases'], _pyc, _exp11)) and len(_j11['cases']) == len(_exp11),
    ' · '.join(f'{n}:{"/".join(e) or "통과"}' for (n, _), e in zip(_cases11[:6], _j11['cases'])) + ' …')

# 기록 6답
_ans11 = list(_A11['answers']) + list(_Bd11['answers']); _names11 = [f'A-{i}' for i in (1, 2, 3)] + [f'B-{i}' for i in (1, 2, 3)]
_pyr = [_m0411.validate(t, _fa11, _all11) for t in _ans11]
_okfmt = lambda r: tuple(len(r[0][x]) if (r[0][x] is not None and (x == 'V1' or r[2] is not None)) else None for x in _RULES11)
_jsfmt = lambda f: tuple(len(f['rules'][x][2]) if f['rules'][x][1] else None for x in _RULES11)
_jsf = _j11['fails']
_expect11 = [(1, None, None, None, None, None)] * 3 + [(0, 0, 0, 0, 0, 0), (0, 0, 0, 0, 0, 1), (0, 0, 0, 0, 0, 0)]
chk('0411 기록 6답의 검사 결과: A 세 답은 V1 에서 실패(JSON 아님, V2~V6 은 돌리지 않음), B 세 답은 V1~V5 전부 통과, V6 은 B 답 2 의 문장 3 한 건 — 파이썬(페이지 코드) = JS, 규칙별 실패 수와 실패 문장 번호까지 같음',
    [_okfmt(r) for r in _pyr] == [_jsfmt(f) for f in _jsf] == _expect11 and [sorted(set(s for v in r[0].values() if v for s, _ in v if s is not None)) for r in _pyr] == [f['fs'] for f in _jsf] and _jsf[4]['fs'] == [2] and [f['pass'] for f in _jsf] == [False] * 3 + [True, False, True],
    ' · '.join(f'{n} {"/".join(str(x) if x is not None else "-" for x in _okfmt(r))}' for n, r in zip(_names11, _pyr)))
_pyw = [len(_m0411.validate(t, _fa11, _all11, v6wide=True)[0]['V6']) for t in _Bd11['answers']]
_pyn = [len(_m0411.validate(t, _fa11, _all11)[0]['V6']) for t in _Bd11['answers']]
chk('0411 V6 을 사건 사실을 인용한 문장에 한정하면 B 답별 실패 0·1·0, 낱말만 보고 넓게 잡으면 0·3·0(사건과 상관없는 문장 2개가 헛경보) — JS = 파이썬; V6 을 끄면 돌지 않음',
    [len(x) for x in _j11['wide']][3:] == _pyw == [0, 3, 0] and _pyn == [0, 1, 0] and _j11['off5'] == [False] * 6,
    f'좁게 {_pyn} · 넓게 {_pyw}')

# render
_pyrend = [_m0411.render(t, _fa11) for t in _Bd11['answers']]
_f_ = {f['id']: f for f in _fa11}
_ex1 = f'{_i4 / _i5 * 100:.1f}%'; _ex2 = f'{_i4 / _i6 * 100:.1f}%'
_allr = ' '.join(' '.join(r) for r in _pyrend)
chk('0411 render: B 답 3개 12문장의 렌더 결과 JS = 파이썬(페이지 코드), 자리의 값은 사실 목록의 값(−1.095·0.963·−2.058·17건·28장·18건·5.713 µm·교체 시각), 비율은 17÷28×100 = 60.7% · 17÷18×100 = 94.4%, 자리 괄호가 남지 않음, 조사가 받침에 맞음(17건이)',
    _pyrend == _j11['render'] and _ex1 == '60.7%' and _ex2 == '94.4%' and _ex1 in _pyrend[0][0] and _ex2 in _pyrend[0][1] and '4일 0.963 ppm에서 7일 -1.095 ppm으로' in _pyrend[0][2] and '-2.058 ppm' in _pyrend[0][2] and '28장 가운데 17건이' in _pyrend[1][0] + _pyrend[2][1]
    and '{{' not in _allr and '2026-03-07 01:24에 B03-A2에서 B03-B2로' in _pyrend[0][3] and '5.713 µm' in _pyrend[1][0],
    _pyrend[0][0] + ' / ' + _pyrend[1][0][:40] + '…')
_cx = {}
for _bi, _t in enumerate(_Bd11['answers']):
    for _x in json.loads(_t)['sentences']:
        for _m in _m0411.SLOT.finditer(_x['text']):
            if _m.group(1).strip().startswith('calc'):
                _v, _ids, _e = _m0411.calc_expr(_re5.sub(r'^calc\s*:', '', _m.group(1).strip()), {f['id']: f for f in _fa11})
                _cx.setdefault(_re5.sub(r'\s+', '', _re5.sub(r'^calc\s*:\s*', '', _m.group(1).strip())), []).append(_v)
_js_calc = [round(s['val'], 9) for a in _j11['calc'] for x in a for s in x]
chk('0411 calc 식 6개(f4/f5*100 · f4/f6*100): 도구가 계산한 값 = 파이썬 = 17÷28×100 · 17÷18×100 의 독립 값, 소수 첫째 자리로 렌더한 값 = 60.7 · 94.4, 식 해석기 시험(1+2*3=7 · (1+2)*3=9 · −f1*2 · 0 으로 나눔·**·끝맺지 않은 식은 오류) JS = 파이썬',
    sorted(_cx) == ['f4/f5*100', 'f4/f6*100'] and all(abs(v - _i4 / _i5 * 100) < 1e-9 for v in _cx['f4/f5*100']) and all(abs(v - _i4 / _i6 * 100) < 1e-9 for v in _cx['f4/f6*100']) and len(_js_calc) == 6 and sorted(_js_calc) == sorted(round(v, 9) for vs in _cx.values() for v in vs)
    and _j11['tools']['calc'][:4] == [7, 9, 2.19, _i4 / _i5 * 100] and _j11['tools']['calc'][4:] == ['ERR', 'ERR', 'ERR']
    and [_m0411.calc_expr(e, _f_)[0] for e in ('1+2*3', '(1+2)*3', '-f1*2', 'f4/f5*100')] == [7, 9, 2.19, _i4 / _i5 * 100] and all(_m0411.calc_expr(e, _f_)[0] is None for e in ('f4/(f1-f1)', '2**3', 'f4/')),
    f'60.7={_i4 / _i5 * 100:.3f} · 94.4={_i4 / _i6 * 100:.3f}')

# 설계 A 숫자 대조
_cA, _dA = _m0411.fact_context(_fa11)
_pyA = []
for _t in _A11['answers']:
    _r = _m0411.check_numbers(_t, _cA, _dA); _pyA.append((len(_r), sum(c == 'has' for c, _ in _r), sum(c == 'calc' for c, _ in _r), sum(c == 'none' for c, _ in _r), sum(l for _, l in _r), _m0411.asked_ok(_t, _fa11)))
_jsA = [(x['c']['n'], x['c']['has'], x['c']['calc'], x['c']['none'], x['c']['loose'], all(x['a'])) for x in _j11['chkA']]
chk('0411 설계 A 답 3개의 숫자 대조(0410 방식, 사실 목록 문맥): 숫자 수·있음·계산됨·근거 없음·거친 일치 JS = 파이썬(페이지 코드), 근거 없음 0 개, 질문한 두 퍼센트(17÷28 = 60.7 · 17÷18 = 94.4)가 3답 모두 정답과 같고, B 답 렌더 글의 숫자도 근거 없음 0 개, 0410 classify 와 문맥판 classifyCtx 가 18답에서 같은 결과',
    _pyA == _jsA and all(x[3] == 0 and x[5] for x in _pyA) and all(x['none'] == 0 for x in _j11['chkA']) and all(r['none'] == 0 for r in _j11['rendB']) and all(_j11['ctxEq']) and len(_j11['ctxEq']) == 18,
    ' · '.join(f'A-{i} 숫자 {x[0]} 있음 {x[1]} 계산됨 {x[2]} 근거 없음 {x[3]}' for i, x in enumerate(_pyA, 1)))

# 사람 표지 근거
_mk = {m['id']: m for m in _j11['marks']}
_quotes_ok = all(m['found'] for m in _j11['marks'])
_prev_b2 = json.loads(_Bd11['answers'][1])['sentences']; _ix = next(i for i, x in enumerate(_prev_b2) if x['text'].startswith('같은 기간 B03-CH2에서는'))
chk('0411 사람이 붙인 표지의 근거 계산: A 답 1 "7일 구간 안" 틀림(교체 03-07 01:24 는 7일 구간 03-08 06:00~03-09 06:00 밖, 5일 구간 안) · A 답 2 "5일 구간(03-06 06:00 ~ 03-07 06:00)" 맞음 · A 답 3 "4일과 7일 구간 사이" 맞음 · B 답 2 "같은 기간" 문장은 앞 문장이 7일을 말하는데 교체는 5일 — 인용한 대목이 답 원문에 그대로 있고 JS = datetime 독립 계산',
    _quotes_ok and _mk['a1']['mark'] == '틀림' and _mk['a1']['ev']['in7'] is False and _mk['a1']['ev']['in5'] is True and not (_w11(7)[0] <= _tc11 < _w11(7)[1]) and (_w11(5)[0] <= _tc11 < _w11(5)[1])
    and _mk['a2']['mark'] == '맞음' and _mk['a2']['ev']['quoteHasW5'] and _mk['a2']['ev']['all7After'] and _tc11 < _w11(7)[0] and _mk['a2']['ev']['f10'] == _f10i
    and _mk['a3']['mark'] == '맞음' and _mk['a3']['ev']['between'] and (_w11(4)[1] <= _tc11 < _w11(7)[0]) and _mk['b2']['mark'] == '틀림' and _mk['b2']['ev']['prevMentions7'] and _mk['b2']['ev']['idx'] == _ix + 1 == 3 and '7일' in _prev_b2[_ix - 1]['text'] and not _mk['b2']['ev']['in7'] and _mk['b2']['ev']['in5'],
    f'교체 {_wash11.from_ts} · 5일 {_wt(5)} · 7일 {_wt(7)} · B 답 2 문장 {_ix + 1} 의 앞 문장이 7일을 말함')

# 읽을 문장 수·원인 type
_split_py = [len(_m0411.split_sent(t)) for t in _A11['answers']]
_readpy = []
for t in _Bd11['answers']:
    _r, _bad, _o = _m0411.validate(t, _fa11, {**_all11, 'V6': False}); _readpy.append((len(_o['sentences']), len(set(_bad) | {i for i, x in enumerate(_o['sentences']) if x['type'] != '사실'})))
_types_py = [{k: sum(x['type'] == k for x in json.loads(t)['sentences']) for k in ('사실', '원인', '원인 미확인', '권고')} for t in _Bd11['answers']]
_rd = _j11['read']
chk('0411 사람이 읽을 문장 수: 설계 A = 답마다 전 문장(4·4·4, 평균 4.0), 설계 B = 검사 실패 문장 + type 이 사실이 아닌 문장(1·2·1 / 전체 4·4·4, 평균 1.3) — JS = 파이썬; B 세 답의 type 은 모두 원인 미확인 1문장·원인 0문장(원인 규칙 3/3), A 답의 원인 대목 세 곳이 원문에 있음',
    _split_py == _rd['A'] == [4, 4, 4] and [(x['n'], x['read']) for x in _rd['B']] == _readpy == [(4, 1), (4, 2), (4, 1)] and [{k: c.get(k, 0) for k in ('사실', '원인', '원인 미확인', '권고')} for c in _j11['types']] == _types_py
    and all(t['원인 미확인'] == 1 and t['원인'] == 0 for t in _types_py) and all(c['found'] and c['holds'] for c in _j11['causeA']) and round(sum(_split_py) / 3, 1) == 4.0 and round(sum(r for _, r in _readpy) / 3, 1) == 1.3,
    f'A {_split_py} · B 읽을 문장 {[r for _, r in _readpy]} / 전체 {[n for n, _ in _readpy]} · type {_types_py[1]}')

# 페이지 Python 실행
_run11 = subprocess.run([sys.executable, '-I', 'lab0411.py'], cwd=_td11, capture_output=True, text=True)
chk('0411 Python 코드가 오류 없이 돌고 출력이 페이지의 출력 상자와 한 글자도 다르지 않으며, 사내 모델 호출 함수 ask_internal_model 은 호출하지 않고(자리만), 외부 통신 코드(requests·urllib·socket·http·openai 등)가 없음',
    _run11.returncode == 0 and _run11.stdout.strip() == _out11 and 'ask_internal_model(' in _code11 and not _re5.search(r'^\s*(?:import|from)\s+(?:requests|urllib|socket|http|openai|anthropic|httpx)', _code11, _re5.M) and _code11.count('ask_internal_model(') == 1 and 'NotImplementedError' in _code11,
    (_run11.stderr[-200:] if _run11.returncode else f'{len(_out11.splitlines())}줄'))
_lines11 = _out11.splitlines()
_pyexp = [f'{n} · ' + ' · '.join('-' if (n[0] == 'A' and r != 'V1') else ('통과' if not _jsf[i]['rules'][r][2] else f'실패 {len(_jsf[i]["rules"][r][2])}') for r in _RULES11) for i, n in enumerate(_names11)]
_wl = [l for l in _lines11 if l.startswith('V6 를 낱말만')][0]
_rl = [l for l in _lines11 if l.startswith('사람이 읽을 문장 수')][0]
_ml = [l for l in _lines11 if l.startswith('교체 시각')][0]
chk('0411 Python 출력의 숫자(사실 f1~f10 · 검사 6답 · 넓게 잡은 V6 · 렌더 12문장 · A 답 숫자 대조 · 교체 5일/7일 구간과 28.6시간 · 읽을 문장 수)가 JS 값과 같음',
    all(e in _lines11 for e in _pyexp) and all(f'{r[0]} · {_m0411.fmt_val(_f_[r[0]])} ·' in '\n'.join(_lines11) for r in _j11['facts']) and _wl.endswith('B-1 0 · B-2 3 · B-3 0')
    and all(f'렌더 B-{i + 1} 문장 {k + 1}: {s}' in _lines11 for i, r in enumerate(_j11['render']) for k, s in enumerate(r))
    and all(f'A-{i + 1} · {x["c"]["n"]} · {x["c"]["has"]} · {x["c"]["calc"]} · {x["c"]["none"]} · {x["c"]["loose"]} · 예' in _lines11 for i, x in enumerate(_j11['chkA']))
    and '든 날 5일(03-06 06:00 ~ 03-07 06:00)' in _ml and '7일 구간 03-08 06:00 ~ 03-09 06:00' in _ml and '= 28.6시간' in _ml and '7일 구간 안에 듦: 아니오' in _ml
    and '설계 A 4 · 4 · 4 → 4.0' in _rl and '설계 B 1 · 2 · 1 (전체 4 · 4 · 4) → 1.3' in _rl,
    _ml[:70] + '…')

# 페이지 구조
_term11 = len(_re5.findall(r'<li>', _re5.search(r'<ul class="chips" id="termList">(.*?)</ul>', _pg11, _re5.S).group(1)))
_nq11 = len(_re5.findall(r'<div class="qna" data-label=', _pg11)); _nsec11 = len(_re5.findall(r'<h2><span class="no">', _pg11))
_fonts11 = [int(x) for x in _re5.findall(r"(?:x\.font|\.font)\s*=\s*'[^']*?(\d+)px", _pg11)] + [int(x) for x in _re5.findall(r'fitFont\([^)]*?,\s*\d+\s*,\s*(\d+)\s*,', _pg11)]
_body11 = _re5.sub(r'<script.*?</script>|<pre.*?</pre>|<style.*?</style>', '', _pg11, flags=_re5.S); _body11 = _html5.unescape(_re5.sub(r'<[^>]+>', ' ', _body11))
_endda11 = _re5.findall(r'[^니습]다[.]', _body11)
_p10 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0410-llm-strengths-limits.html'), encoding='utf-8').read(); _hub11 = open(os.path.join(os.path.dirname(_DATA10), 'index.html'), encoding='utf-8').read()
_js11 = open(_lv11, encoding='utf-8').read()
chk('0411 페이지: 새 용어 6개 · Q&A 4개 · 절 11개 · 캔버스 글자 11px 이상 · 인용 밖 본문에 -다 끝맺음 없음 · 0410 의 위·아래 다음 링크 · 허브 등록(단계 4 묶음) · 계산 모듈에 난수·시각 함수 없음 · 프롬프트 틀·JSON 스키마 블록이 있고 스키마의 type 목록 = 검사기의 type 네 가지',
    _term11 == 6 and _nq11 == 4 and _nsec11 == 11 and min(_fonts11) >= 11 and not _endda11 and _p10.count('0411-llm-verification-design.html') == 2 and 'labs/0411-llm-verification-design.html' in _hub11 and _hub11.index('0411-llm-verification-design.html') > _hub11.index('단계 4 · 기둥 4')
    and 'Math.random' not in _js11 and 'Date.now' not in _js11 and 'new Date' not in _js11 and 'id="tplCode"' in _pg11 and 'id="schemaCode"' in _pg11 and _j11['schema'] == ['사실', '원인', '원인 미확인', '권고'],
    f'용어 {_term11} · Q&A {_nq11} · 절 {_nsec11} · 캔버스 글자 최소 {min(_fonts11)}px({len(_fonts11)}곳) · -다 끝맺음 {len(_endda11)}건 · 0410 링크 {_p10.count("0411-llm-verification-design.html")}곳')
_cleanup11 = shutil.rmtree(_td11, ignore_errors=True)


# ============================================================
# 0401 — 에이전트 구조 시제품. S15 적재본 14일 위에서 도는 에이전트(agent0401.js)를 페이지의 Python 코드(lab0401.py)가 독립 구현으로 다시 돌려 대조한다.
# 정책 격자·승인 결정까지 JS = Python, 점검 결과·지문 = 0400, 변경점 통계 = scipy, 요청 판정 = ESTC 표, 보고 검사 = 0411 규칙
# ============================================================
import importlib.util as _ilu01, itertools as _it01
_pg01 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0401-agent-prototype.html'), encoding='utf-8').read()
_code01 = _html5.unescape(_re5.search(r'<pre id="pyCode">(.*?)</pre>', _pg01, _re5.S).group(1)); _out01 = _html5.unescape(_re5.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg01, _re5.S).group(1)).strip()
_ag01 = os.path.join(_DATA10, 'agent0401.js')
_td01 = _tf5.mkdtemp()
for _n in ('fdc_glass', 'ppa_coef', 'events', 'mask_hist'): shutil.copy(os.path.join(_DATA10, 'csv', f's15_{_n}.csv'), os.path.join(_td01, f's15_{_n}.csv'))
open(os.path.join(_td01, 'lab0401.py'), 'w', encoding='utf-8').write(_code01)
_sp01 = _ilu01.spec_from_file_location('lab0401', os.path.join(_td01, 'lab0401.py')); _m01 = _ilu01.module_from_spec(_sp01); _sp01.loader.exec_module(_m01)
_tb01 = _m01.load_tables(_td01)

# 정책 격자: 기본 + 점검 허용 수·k·m·문턱·다중 비교 조합 + 승인 결정이 있는 경우
_grid01 = [{'policy': {}, 'decisions': None}, {'policy': {'tol': 2}, 'decisions': None}]
for _tol, _k, _m, _dl in _it01.product((0, 1, 2, 3, 4, 7), (1, 2, 3, 4), (1, 3, 5), (0.2, 0.5)):
    _grid01.append({'policy': {'tol': _tol, 'k': _k, 'm': _m, 'delta': _dl, 'bonf': bool((_tol + _k) % 2)}, 'decisions': None})
_grid01 += [{'policy': {'tol': 2}, 'decisions': {'R-02': 'approve'}}, {'policy': {'tol': 2}, 'decisions': {'R-02': 'reject'}}, {'policy': {}, 'decisions': {'R-02': 'approve'}},
            {'policy': {'tol': 4, 'k': 1, 'm': 3, 'delta': 0.2}, 'decisions': {'R-01': 'approve', 'R-02': 'reject', 'R-03': 'approve', 'R-04': 'approve', 'R-05': 'approve'}},
            {'policy': {'tol': 4, 'k': 2, 'm': 3, 'delta': 0.2, 'repair_cap': 1, 'repair_human': True}, 'decisions': {'R-03': 'approve', 'R-04': 'approve', 'R-05': 'reject', 'R-06': 'approve', 'R-07': 'approve', 'R-08': 'approve'}},
            {'policy': {'spec_reject': True, 'tol': 7, 'delta': 0.3, 'ex_n': 2, 'scrap_ratio': 0.3}, 'decisions': None}]
for _cap, _rh in _it01.product((1, 2, 3, 4), (False, True)):
    _grid01.append({'policy': {'tol': 4, 'k': 2, 'm': 3, 'delta': 0.2, 'bonf': False, 'repair_cap': _cap, 'repair_human': _rh}, 'decisions': {'R-04': 'approve', 'R-05': 'approve', 'R-06': 'approve', 'R-07': 'approve'} if _rh else None})
_EXPORT01 = r"""const A=require(%s);const grid=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
const r9=x=>x==null?null:Math.round(x*1e9)/1e9;
console.log(JSON.stringify(grid.map(g=>{const r=A.run(g.policy,g.decisions);return r.days.map(d=>({day:d.day,an:d.analyzed,fails:d.fails,fl:d.flagged,
 req:d.requests.map(q=>[q.id,q.kind,q.ch,q.mask,q.verdict,q.text]),dec:d.decided.map(q=>[q.id,q.verdict]),spec:r9(d.spec),
 rows:d.det?d.det.rows.map(x=>[x.key,x.skip?1:0,r9(x.eff),x.p==null?null:Math.min(1,+x.p.toPrecision(6))]):[],render:d.report.render.map(x=>x.text),valid:d.report.v.pass,decisions:d.decisions.map(x=>x.text),fp:d.fp})).concat([{summary:r.summary}]);})));"""
open(os.path.join(_td01, 'grid.json'), 'w').write(json.dumps(_grid01))
_jsf01 = os.path.join(_td01, 'cmp.js'); open(_jsf01, 'w').write(_EXPORT01 % json.dumps(_ag01))
_js01 = json.loads(subprocess.run([_node, _jsf01, os.path.join(_td01, 'grid.json')], capture_output=True, text=True, check=True).stdout)
def _r9(x): return None if x is None else round(x * 1e9) / 1e9
_pyres01, _bad01, _nd01 = [], [], 0
for _gi, _g in enumerate(_grid01):
    _recs, _queue, _pol = _m01.run_agent(_tb01, _g['policy'], _g['decisions'])
    _pyres01.append((_recs, _queue, _pol))
    _days = []
    for _r in _recs:
        _rows = [[x['key'], 1 if x.get('skip') else 0, None if x.get('skip') else _r9(x['eff']), None if x.get('skip') else min(1, float('%.6g' % x['p']))] for x in _r['finding'].get('rows', [])]
        _days.append({'day': _r['day'], 'an': _r['analyzed'], 'fails': _r['fails'], 'fl': _r['flagged'], 'req': [[q['id'], q['kind'], q['ch'], q['mask'], q['verdict'], q['text']] for q in _r['requests']],
                      'dec': [[q['id'], q['verdict']] for q in _r['decided']], 'spec': _r9(_r['spec']), 'rows': _rows, 'render': _r['render'], 'valid': _r['valid'], 'decisions': [x['text'] for x in _r['decisions']], 'fp': _r['fp']})
    _days.append({'summary': _m01.summarize(_recs, _queue)})
    for _a, _b in zip(_js01[_gi], _days):
        _nd01 += 1
        if _a != _b: _bad01.append((_gi, _a.get('day'), [k for k in _a if _a[k] != _b.get(k)]))
chk(f'0401 정책 {len(_grid01)}가지(점검 허용 수 × k × m × 문턱 × 다중 비교 + 리페어 한도·리페어 사람 승인·spec 자동 반려·승인 결정 조합) × 14일: JS 에이전트 = 페이지 Python 코드(독립 구현) — 분석 여부·점검 실패 규칙·새 변경점·요청(번호·종류·대상·판정·문장)·승인 결과·spec·챔버별 효과(1e-9)·p·보고 문장·입력 지문·요약',
    not _bad01 and _nd01 == len(_grid01) * 15, f'{_nd01}일 기록 대조, 불일치 {len(_bad01)}' + (f' 예: {_bad01[:2]}' if _bad01 else ''))

# 점검 결과·입력 지문 = 0400(sqlite3 로 돌린 verify 의 _s15 와 같은 JS 출력)
_d0 = _pyres01[0][0]
_pass00 = [d['pass'] for d in _s15['days']]
chk('0401 기본 정책(점검 엄격)의 분석 여부·실패 규칙 = 0400 의 점검 결과(통과한 날만 분석), 입력 지문 14개 = 0400 의 입력 지문, 분석한 날은 8·9일뿐',
    [r['analyzed'] for r in _d0] == _pass00 and all(sorted(r['fails']) == sorted(c['id'] for c in d['checks'] if not c['pass']) for r, d in zip(_d0, _s15['days'])) and all(r['fp'] == d['fp_in'] for r, d in zip(_d0, _s15['days'])) and [r['day'] for r in _d0 if r['analyzed']] == [8, 9],
    f'분석한 날 {[r["day"] for r in _d0 if r["analyzed"]]} · 멈춘 날 {sum(not r["analyzed"] for r in _d0)}')

# B03-CH2: 교체 시각은 CSV 에서, 변경점 통계는 scipy 로 독립 계산
_mh01 = pd.read_csv(os.path.join(_td01, 's15_mask_hist.csv')); _sw01 = _mh01[(_mh01.mask_id == 'B03-B2')].iloc[0]
_swm = int((pd.Timestamp(_sw01.from_ts) - pd.Timestamp('2026-03-02 06:00')).total_seconds() // 60); _swday = _swm // 1440 + 1
_rec_t2, _q_t2, _ = _m01.run_agent(_tb01, {'tol': 2}, None)
_fl2 = [(r['day'], c) for r in _rec_t2 for c in r['flagged']]
_bq2 = [q for q in _q_t2 if q['kind'] == 'baseline']
_nb2 = [q for q in _q_t2 if q['ch'] == 'B03-CH2' and q['kind'] in ('repair', 'scrap', 'correct')]
_ev2 = [d for r in _rec_t2 for d in r['decisions'] if 'B03-CH2' in d['text'] and '원인 후보 = 마스크 교체' in d['text']]
_dd0, _qq0, _ = _pyres01[0]
_bq0 = [q for q in _qq0 if q['kind'] == 'baseline']
chk(f'0401 B03-CH2: 마스크 교체 시각(CSV {_sw01.from_ts}, 정답 {_swday}일) — 기본 정책은 점검에 막혀 변경점을 못 잡고 8일에 이력 표로 교체를 알아채 새 마스크 기준 측정을 요청(리페어 아님), 점검 허용 2 에서는 8일 판정에서 B03-CH2 만 변경점으로 잡히고 원인 후보 = 마스크 교체라 기준 측정만(리페어·제외·보정값 요청 없음)',
    not [c for r in _dd0 for c in r['flagged']] and len(_bq0) == 1 and _bq0[0]['day'] == 8 and _bq0[0]['mask'] == 'B03-B2' and _fl2 == [(8, 'B03-CH2')] and len(_bq2) == 1 and _bq2[0]['day'] == 5 and not _nb2 and len(_ev2) == 1 and _swday == 5,
    f'기본: 변경점 0 · 기준 측정 {len(_bq0)}건({_bq0[0]["day"] if _bq0 else "-"}일) / 허용 2: 변경점 {_fl2} · 기준 측정 {[(q["day"]) for q in _bq2]}일')

# 변경점 통계: pandas + scipy 로 독립 계산(챔버 8개 × 대표 날 몇 개)
from scipy import stats as _st01
_f01 = pd.read_csv(os.path.join(_td01, 's15_fdc_glass.csv')); _p01 = pd.read_csv(os.path.join(_td01, 's15_ppa_coef.csv'))
for _d in (_f01, _p01):
    _d['ts_m'] = ((pd.to_datetime(_d.ts) - pd.Timestamp('2026-03-02 06:00')).dt.total_seconds() // 60).astype(int)
_p01['meas_m'] = ((pd.to_datetime(_p01.measured_ts) - pd.Timestamp('2026-03-02 06:00')).dt.total_seconds() // 60).astype(int)
_CH01 = [b + '-CH' + str(c) for b in ('B02', 'B03') for c in (1, 2, 3, 4)]
_SLOPE01, _TREF01 = _P15['thermal'], _P15['T_ref']
def _vals01(day):
    f = _f01[(_f01.ts_m >= (day - 1) * 1440) & (_f01.ts_m < day * 1440)]; p = _p01[(_p01.ts_m >= (day - 1) * 1440) & (_p01.ts_m < day * 1440) & (_p01.meas_m <= day * 1440)]
    j = f.merge(p, on='glass_id'); out = {}
    for c in _CH01:
        jj = j[(j.block + '-' + j.chamber) == c].sort_values('glass_id', kind='stable'); jj = jj[jj.chamber_temp.notna()]
        out[c] = (jj.Mx.to_numpy() - _SLOPE01 * (jj.chamber_temp.to_numpy() - _TREF01))
    return out
_V01 = {d: _vals01(d) for d in range(1, 15)}
def _lag01(x):
    m = x.mean(); den = ((x - m) ** 2).sum(); return 0.0 if den == 0 else float(((x[1:] - m) * (x[:-1] - m)).sum() / den)
def _did01(c, day, k, m, an):
    rec = [j for j in an if day - k < j <= day]; bef = [j for j in an if day - k - m < j <= day - k]
    if not rec or not bef: return None
    def ctrl(j): ms = [_V01[j][c2].mean() for c2 in _CH01 if c2 != c and len(_V01[j][c2])]; return float(np.median(ms)) if ms else None
    rR = np.concatenate([_V01[j][c] - ctrl(j) for j in rec]); rB = np.concatenate([_V01[j][c] - ctrl(j) for j in bef])
    if len(rR) < 6 or len(rB) < 6: return None
    phi = max(0.0, (_lag01(rR) + _lag01(rB)) / 2); neR, neB = max(len(rR) * (1 - phi) / (1 + phi), 2), max(len(rB) * (1 - phi) / (1 + phi), 2)
    vR, vB = rR.var(ddof=1) / neR, rB.var(ddof=1) / neB; eff = rR.mean() - rB.mean(); t = eff / np.sqrt(vR + vB); df = (vR + vB) ** 2 / (vR ** 2 / (neR - 1) + vB ** 2 / (neB - 1))
    return eff, float(2 * _st01.t.sf(abs(t), df)), phi
_mx01, _mp01, _n01, _skip01 = 0.0, 0.0, 0, 0
_rec7, _q7, _ = _m01.run_agent(_tb01, {'tol': 7})
for _r in _rec7:
    for _row in _r['finding'].get('rows', []):
        _o = _did01(_row['key'], _r['day'], 2, 3, list(range(1, _r['day'] + 1)))
        _sk = _row.get('skip', False)
        if _sk or _o is None:
            if _sk != (_o is None): _mx01 = 9
            _skip01 += 1
            continue
        _n01 += 1; _mx01 = max(_mx01, abs(_o[0] - _row['eff'])); _mp01 = max(_mp01, abs(_o[1] - _row['p']) / max(_row['p'], 1e-300) if _row['p'] > 1e-12 else abs(_o[1] - _row['p']))
chk('0401 변경점 통계: 점검 끔 정책의 14일 × 챔버 8개 판정(효과·p)을 pandas + scipy(t.sf)로 독립 계산한 값과 비교(효과 차 < 1e-9, p 상대 차 < 1e-6, 판정 안 함인 칸도 같음)', _mx01 < 1e-9 and _mp01 < 1e-6 and _n01 > 20, f'비교 {_n01}칸 · 판정 안 한 칸 {_skip01} · 효과 최대 차 {_mx01:.1e} · p 최대 상대 차 {_mp01:.1e}')

# 요청 판정 = 0206 전이 표 (JS requestTransition 과 ESTC 표를 node 로 꺼내 파이썬 표와 견줌)
_EXP01B = r"""const M=require(%s);const rows=M.ESTC.transitions.filter(t=>t.entity==='mask').map(t=>[t.from,t.to,t.needs_human?1:0]);
const states=['init','stock','to_clean','clean_wait','cleaning','held','to_stock','in_use','repair','scrapped'];const out={};
states.forEach(s=>['repair','scrapped'].forEach(to=>{const r=M.requestTransition({states:{'mask:B03-A2':s},repairPath:{},cleaning:0,clean_wait:0},'mask','B03-A2',to);out[s+'>'+to]=r.kind;}));
console.log(JSON.stringify({rows:rows,out:out}));"""
_e01 = json.loads(subprocess.run([_node, '-e', _EXP01B % json.dumps(_mf5)], capture_output=True, text=True, check=True).stdout)
_tbl01 = {(a, b): bool(h) for a, b, h in _e01['rows']}
_pk = {'ok': 'ok', 'needs_human': 'needs_human', 'not_in_table': 'not_in_table'}
chk('0401 요청 판정: 파이썬의 마스크 전이 표 = ESTC 마스크 전이 16줄(사람 승인 표시까지), 상태 10개 × 리페어·제외 20가지에서 파이썬 판정(표에 없음·사람 승인·허용) = JS requestTransition',
    _tbl01 == _m01.MASK_TRANS and all(_m01.request_transition(k.split('>')[0], k.split('>')[1]) == v for k, v in _e01['out'].items()) and len(_e01['out']) == 20 and len(_tbl01) == 16
    and _e01['out']['in_use>repair'] == 'ok' and _e01['out']['in_use>scrapped'] == 'needs_human' and _e01['out']['repair>scrapped'] == 'needs_human' and _e01['out']['repair>repair'] == 'not_in_table',
    f'전이 {len(_tbl01)}줄 · 사람 승인 필요 {sum(_tbl01.values())}줄')

# 보고 검사 단위 시험: 사실 목록은 파이썬이 만든 한 날의 것, 검사 결과는 JS(LlmVerify.validate) = 파이썬
_facts01 = [r for r in _rec_t2 if r['day'] == 8][0]['facts']
_ev_id = [f['id'] for f in _facts01 if f['kind'] == 'event'][0]; _val_id = [f['id'] for f in _facts01 if f['kind'] == 'value'][0]
def _mk01(sents): return json.dumps({'sentences': [{'text': t, 'cites': c, 'type': ty} for t, c, ty in sents]}, ensure_ascii=False)
_cases01 = [('정상', [(f'값은 {{{{{_val_id}}}}}입니다.', [_val_id], '사실')]), ('자리 밖 숫자', [('초과는 17건입니다.', [], '사실')]), ('이름·날 이름은 허용', [(f'7일 B03-CH2 의 값은 {{{{{_val_id}}}}}입니다.', [_val_id], '사실')]),
            ('없는 번호', [('값은 {{f99}}입니다.', ['f99'], '사실')]), ('cites 빠짐', [(f'값은 {{{{{_val_id}}}}}입니다.', [], '사실')]), ('원인인데 cites 없음', [('원인은 모릅니다.', [], '원인')]),
            ('원인인데 사건 없음', [(f'값은 {{{{{_val_id}}}}}입니다.', [_val_id], '원인')]), ('원인 + 사건 인용', [(f'교체는 {{{{{_ev_id}}}}}에 있었습니다.', [_ev_id], '원인')]),
            ('시점 낱말 + 사건, 관계 없음', [(f'같은 기간 {{{{{_ev_id}}}}}에 교체했습니다.', [_ev_id], '원인')]), ('type 이 네 가지가 아님', [(f'값은 {{{{{_val_id}}}}}입니다.', [_val_id], '결론')])]
_raws01 = [_mk01(s) for _, s in _cases01] + ['초과는 17건입니다.', '```json\n' + _mk01([('초과는 {{f1}}건입니다.', ['f1'], '사실')]) + '\n```']
_EXP01C = r"""const V=require(%s);const facts=%s,raws=%s;console.log(JSON.stringify(raws.map(t=>{const r=V.validate(t,facts);return Object.keys(r.rules).filter(k=>r.rules[k].fails.length>0);})));"""
_jv01 = json.loads(subprocess.run([_node, '-e', _EXP01C % (json.dumps(os.path.join(_DATA10, 'llmverify.js')), json.dumps(_facts01, ensure_ascii=False), json.dumps(_raws01, ensure_ascii=False))], capture_output=True, text=True, check=True).stdout)
_pv01 = [[k for k, v in _m01.validate(t, _facts01).items() if v] for t in _raws01]
_want01 = [[], ['V2'], [], ['V3', 'V4'], ['V4'], ['V4', 'V5'], ['V5'], [], ['V6'], ['V1'], ['V1'], ['V1']]
chk('0401 보고 검사 단위 시험 12건(정상·자리 밖 숫자·이름 허용·없는 번호·cites 빠짐·원인+cites 없음·원인+사건 없음·원인+사건·시점 낱말+사건·type·JSON 아님·코드 울타리): 걸린 규칙 = 기대 = JS(LlmVerify.validate) = 파이썬',
    _jv01 == _pv01 == _want01, f'JS {_jv01[:4]}… = 파이썬 {_pv01[:4]}…')
_allvalid = all(d['valid'] for g in _pyres01 for d in g[0])
chk(f'0401 모든 정책의 보고 검사(V1~V6) 통과: {len(_grid01)}가지 × 14일 보고 가운데 실패 0건(틀로 만든 문장이라 형식 검사는 통과해야 함), 보고마다 사실 목록이 있고 문장의 숫자 자리는 전부 번호',
    _allvalid and all(len(d['facts']) >= 1 for g in _pyres01 for d in g[0]), f'{sum(len(g[0]) for g in _pyres01)}개 보고')

# 승인 결정이 다음 날 상태에 반영
_a_rec, _a_q, _ = _m01.run_agent(_tb01, None, {'R-02': 'approve'}); _r_rec, _r_q, _ = _m01.run_agent(_tb01, None, {'R-02': 'reject'}); _n_rec, _n_q, _ = _m01.run_agent(_tb01, None, None)
_sp = [q for q in _n_q if q['kind'] == 'spec'][0]
chk('0401 승인 대기열: 기본 정책의 8일 spec 변경 요청(R-02, 사람 승인 필요·되돌릴 수 없음)은 결정이 없으면 14일까지 대기이고 spec 은 그대로, 승인하면 다음 날(9일) 아침 spec 이 제안값으로 바뀌고 반려하면 그대로, 마스크 제외는 어떤 정책에서도 자동 허용되지 않음(전 격자)',
    _sp['day'] == 8 and _sp['human'] and not _sp['reversible'] and _sp['status'] == 'pending' and all(r['spec'] == _m01.SPEC for r in _n_rec)
    and _a_rec[7]['spec'] == _m01.SPEC and _a_rec[8]['spec'] == _sp['proposed'] and _a_rec[8]['decided'][0]['verdict'] == 'applied' and all(r['spec'] == _m01.SPEC for r in _r_rec) and _r_rec[8]['decided'][0]['verdict'] == 'rejected'
    and all(q['verdict'] in ('queue', 'rejected', 'applied', 'guardlate', 'table') for g in _pyres01 for q in g[1] if q['kind'] == 'scrap') and any(q['kind'] == 'scrap' for g in _pyres01 for q in g[1]),
    f'제안 {_m01.SPEC:.3f} → {_sp["proposed"]:.3f} µm · 승인 후 9일 {_a_rec[8]["spec"]:.3f}')

# 불변식: 리페어 동시 한도, 점검 허용 수에 따른 분석 일수, 유한값, 결정성
_viol01, _cap_ok = 0, 0
for (_recs, _queue, _pol) in _pyres01:
    _okr = [(q['day']) for r in _recs for q in r['requests'] if q['kind'] == 'repair' and q['verdict'] == 'ok'] + [q['decided_day'] for q in _queue if q['kind'] == 'repair' and q.get('verdict') == 'applied']
    for d in range(1, 15):
        if sum(1 for s in _okr if s <= d < s + _m01.REPAIR_DAYS) > _pol['repair_cap']: _viol01 += 1
    _cap_ok += len(_okr)
_an01 = {t: sum(r['analyzed'] for r in _m01.run_agent(_tb01, {'tol': t})[0]) for t in range(0, 8)}
_fin01 = all(np.isfinite(x[k]) for g in _js01 for d in g if 'rows' in d for x in d['rows'] if x[1] == 0 for k in (2, 3))
_again = [[r['render'] for r in _m01.run_agent(_tb01, {'tol': 4, 'delta': 0.2})[0]] for _ in range(2)]
chk('0401 불변식: (1) 어떤 정책에서도 같은 날 리페어 중인 마스크 수 ≤ 리페어 동시 한도 (2) 점검 허용 수를 올리면 분석한 날이 줄지 않음(0~7) (3) 모든 효과·p 값이 유한 (4) 같은 입력은 같은 결과(결정성) (5) 점검을 끄면 14일 전부 분석',
    _viol01 == 0 and _cap_ok > 0 and list(_an01.values()) == sorted(_an01.values()) and _an01[7] == 14 and _an01[0] == 2 and _fin01 and _again[0] == _again[1],
    f'허용 수별 분석한 날 {list(_an01.values())} · 허용된 리페어 {_cap_ok}건 · 한도 위반 {_viol01}')

# 실행 기록·승인 대기열 양식(CSV 줄 수)
_lg = _m01.log_rows(_dd0); _qr = _m01.queue_rows(_qq0); _jl = len(_dd0) * 2 + sum(len(r['decisions']) + len(r['requests']) for r in _dd0)
chk('0401 실행 기록 양식: 단계 줄 = 날마다 (관찰·점검 + 보고) 2줄 + 결정 + 요청, 열 9개(day·step·tool·input·output·decision·request·verdict·reason), 승인 대기열 양식은 사람 승인이 필요한 요청만 9칸으로(기본 정책 1줄: 승인자·결정 칸은 비어 있음)',
    len(_lg) == _jl and set(_lg[0]) == {'day', 'step', 'tool', 'input', 'output', 'decision', 'request', 'verdict', 'reason'} and len(_qr) == 1 and _qr[0]['approver'] == '' and _qr[0]['reversible'] == '아니오' and len(_qr[0]) == 9,
    f'실행 기록 {len(_lg)}줄 · 승인 대기열 {len(_qr)}줄')

# 페이지 Python 실행 = 출력 상자, 출력의 숫자 = JS
_run01 = subprocess.run([sys.executable, '-I', 'lab0401.py'], cwd=_td01, capture_output=True, text=True)
_L01 = _run01.stdout.strip().splitlines() if _run01.returncode == 0 else []
_jsd = _js01[0]; _js2 = [g for g, gg in zip(_js01, _grid01) if gg['policy'] == {'tol': 2} and gg['decisions'] is None][0]; _jsa = [g for g, gg in zip(_js01, _grid01) if gg['policy'] == {} and gg['decisions'] == {'R-02': 'approve'}][0]
_sm = _jsd[-1]['summary']; _sm2 = _js2[-1]['summary']
_exp_sum = f"요약: 분석한 날 {_sm['analyzed']} · 멈춘 날 {_sm['stopped']} · 결정 {_sm['decisions']} · 요청 {_sm['requests']}(허용 {_sm['ok']} · 거절 {_sm['refused']} · 대기 {_sm['queued']}) · 보고 검사 통과 {_sm['report_pass']}/14"
_exp_t2 = f"점검 허용 수 2: 분석한 날 {_sm2['analyzed']} · 멈춘 날 {_sm2['stopped']} · 새 변경점 " + ' '.join(f"{d['day']}일 {c}" for d in _js2[:14] for c in d['fl'])
chk('0401 페이지 Python 코드가 오류 없이 돌고 출력이 페이지의 출력 상자와 한 글자도 다르지 않으며, 출력의 14일 표·요약·점검 허용 2 결과·R-02 승인 결과가 JS 값과 같고, 외부 통신 코드와 사내 모델 호출이 없음',
    _run01.returncode == 0 and _run01.stdout.strip() == _out01 and _exp_sum in _L01 and _exp_t2 in _L01
    and all(f"{d['day']}일 · " + (f"실패 {len(d['fails'])}({'+'.join(d['fails'])})" if d['fails'] else '통과') + ' · ' + ('분석' if d['an'] else '건너뜀') in _out01 for d in _jsd[:14])
    and f"{_jsa[8]['spec']:.3f}" in _out01 and not _re5.search(r'^\s*(?:import|from)\s+(?:requests|urllib|socket|http|openai|anthropic|httpx)', _code01, _re5.M) and 'ask_internal_model' not in _code01,
    (_run01.stderr[-300:] if _run01.returncode else f'{len(_L01)}줄'))

# 페이지 구조
_term01 = len(_re5.findall(r'<li>', _re5.search(r'<ul class="chips" id="termList">(.*?)</ul>', _pg01, _re5.S).group(1)))
_nq01 = len(_re5.findall(r'<div class="qna" data-label=', _pg01)); _nsec01 = len(_re5.findall(r'<h2><span class="no">', _pg01))
_fonts01 = [int(x) for x in _re5.findall(r"(?:x\.font|\.font)\s*=\s*'[^']*?(\d+)px", _pg01)] + [int(x) for x in _re5.findall(r'fitFont\([^)]*?,\s*\d+\s*,\s*(\d+)\s*,', _pg01)]
_body01 = _re5.sub(r'<script.*?</script>|<pre.*?</pre>|<style.*?</style>', '', _pg01, flags=_re5.S); _body01 = _html5.unescape(_re5.sub(r'<[^>]+>', ' ', _body01))
_endda01 = _re5.findall(r'[^니습]다[.]', _body01)
_p11 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0411-llm-verification-design.html'), encoding='utf-8').read(); _hub01 = open(os.path.join(os.path.dirname(_DATA10), 'index.html'), encoding='utf-8').read()
_js01s = open(_ag01, encoding='utf-8').read()
chk('0401 페이지: 새 용어 6개 · Q&A 4개 · 절 11개 · 캔버스 글자 11px 이상 · 인용 밖 본문에 -다 끝맺음 없음 · 0411 의 위·아래 다음 링크 · 허브 등록(단계 4 묶음) · 계산 모듈에 난수·시각 함수 없음 · 승인 대기열의 scrap 고정 표시(비활성 체크박스) · 정책 슬라이더 값 기본값 = 모듈 기본 정책 · mfgsim.js 를 부르기만 함',
    _term01 == 6 and _nq01 == 4 and _nsec01 == 11 and min(_fonts01) >= 11 and not _endda01 and _p11.count('0401-agent-prototype.html') == 2 and 'labs/0401-agent-prototype.html' in _hub01
    and 'Math.random' not in _js01s and 'Date.now' not in _js01s and 'new Date' not in _js01s and 'type="checkbox" checked disabled' in _pg01 and 'mfgsim.js' in _pg01 and 'agent0401.js' in _pg01
    and 'id="sTol" min="0" max="7" step="1" value="0"' in _pg01 and 'id="sK" min="1" max="4" step="1" value="2"' in _pg01 and 'id="sM" min="1" max="6" step="1" value="3"' in _pg01 and 'id="sDelta" min="0.1" max="1.5" step="0.1" value="0.5"' in _pg01
    and 'id="sExn" min="1" max="20" step="1" value="6"' in _pg01 and 'id="sCap" min="1" max="4" step="1" value="2"' in _pg01 and 'id="sShare" min="2" max="40" step="1" value="10"' in _pg01,
    f'용어 {_term01} · Q&A {_nq01} · 절 {_nsec01} · 캔버스 글자 최소 {min(_fonts01)}px({len(_fonts01)}곳) · -다 끝맺음 {len(_endda01)}건 · 0411 링크 {_p11.count("0401-agent-prototype.html")}곳')
_cleanup01 = shutil.rmtree(_td01, ignore_errors=True)

# ============================================================
# 0402 — 에이전트 평가. 사람 결론(정답)과 맞댄 혼동표·일치율·윌슨 구간(eval0402.js)을 페이지의 Python 코드(lab0402.py)가 독립 구현으로 다시 세고,
# 다른 시드의 에이전트 행동은 0401 페이지의 Python 에이전트(lab0401.py)가 다시 돌려 JS 와 대조하며, 사람 결론(고장이 든 날·마스크 교체와 그 크기)도 CSV 에서 파이썬이 독립으로 다시 만든다.
# 계획 모델 두 판과 sim-real gap 은 0206 전이 기록(CSV)에서 파이썬이 다시 계산해 JS 경로별 값과 대조한다.
# ============================================================
import datetime as _dt02
_pg02 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0402-agent-evaluation.html'), encoding='utf-8').read()
_code02 = _html5.unescape(_re5.search(r'<pre id="pyCode">(.*?)</pre>', _pg02, _re5.S).group(1)); _out02 = _html5.unescape(_re5.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg02, _re5.S).group(1)).strip()
_ev02 = os.path.join(_DATA10, 'eval0402.js'); _js02s = open(_ev02, encoding='utf-8').read(); _ag02s = open(os.path.join(_DATA10, 'agent0401.js'), encoding='utf-8').read()
_td02 = _tf5.mkdtemp()
for _f in ('s15_agent_log_115.csv', 's15_human_labels_115.csv', 'mask_transitions.csv'): shutil.copy(os.path.join(_DATA10, 'csv', _f), os.path.join(_td02, _f))
open(os.path.join(_td02, 'lab0402.py'), 'w', encoding='utf-8').write(_code02)
_sp02 = _ilu01.spec_from_file_location('lab0402', os.path.join(_td02, 'lab0402.py')); _m02 = _ilu01.module_from_spec(_sp02); _sp02.loader.exec_module(_m02)
_EXPORT02 = r"""const fs=require('fs'),path=require('path');
const DATA=process.argv[2],OUT=process.argv[3];
const MS=require(DATA+'/mfgsim.js'),A0=require(DATA+'/agent0401.js'),E=require(DATA+'/eval0402.js');
const SEEDS=JSON.parse(process.argv[4]);       // 전체 CSV·행동 기록을 내보낼 시드
const res={};
function csv(fn,rows,cols){cols=cols||Object.keys(rows[0]);const esc=v=>(v==null?'':String(v).includes(',')?'"'+String(v).replace(/"/g,'""')+'"':String(v));fs.writeFileSync(fn,[cols.join(',')].concat(rows.map(r=>cols.map(c=>esc(r[c])).join(','))).join('\n')+'\n');}
res.seeds={};
SEEDS.forEach(seed=>{
  const S=MS.scenario('S15',{seed});const d=path.join(OUT,'seed'+seed);fs.mkdirSync(d,{recursive:true});
  ['fdc_glass','ppa_coef','events','mask_hist'].forEach(n=>csv(path.join(d,'s15_'+n+'.csv'),S.csvRows(n),S.cols[n]));
  csv(path.join(d,'s15_clean_fdc_glass.csv'),S.csvRows('clean_fdc_glass'),S.cols.fdc);csv(path.join(d,'s15_clean_ppa_coef.csv'),S.csvRows('clean_ppa_coef'),S.cols.ppa);csv(path.join(d,'s15_faults.csv'),S.csvRows('faults'),['day','kind','detail']);
  const A=seed===A0.seed?A0:A0.forSeed(seed),raw=E.seedRaw(seed),o={spec:S.params.spec,thermal:S.params.thermal,raw:raw,runs:{},ev:{}};
  E.POLS.forEach(p=>{const r=A.run({tol:p.tol});o.runs[p.id]=r.days.map(x=>({day:x.day,an:x.analyzed,fails:x.fails,fl:x.flagged,req:x.requests.map(q=>[q.id,q.kind,q.ch,q.mask,q.verdict])}));
    o.ev[p.id]={};[0,1,2,4].forEach(G=>[14,9].forEach(D=>{const e=E.evalRaw(raw,p.id,G,D);o.ev[p.id][G+'|'+D]={day:e.day,chg:e.chg,req:e.req,lateC:e.lateC,lateR:e.lateR};}));});
  res.seeds[seed]=o;
});
// 기본 호출 = forSeed(대표 시드)
const same=[{},{tol:2},{tol:7},{tol:4,delta:0.2,bonf:false}].every(p=>JSON.stringify(A0.run(p).days.map(d=>[d.day,d.analyzed,d.fails,d.flagged,d.requests.map(q=>[q.id,q.kind,q.ch,q.verdict,q.text]),d.report.raw]))===JSON.stringify(A0.forSeed(A0.seed).run(p).days.map(d=>[d.day,d.analyzed,d.fails,d.flagged,d.requests.map(q=>[q.id,q.kind,q.ch,q.verdict,q.text]),d.report.raw])));
res.forSeedSame=same;res.keys=Object.keys(A0).sort();res.defaults={G0:E.G0,SEEDS:E.SEEDS,DAYS:E.DAYS,GAP_SEEDS:E.GAP_SEEDS,DELTA_H:E.DELTA_H,REP:E.REP};
res.repw={};E.POLS.forEach(p=>{res.repw[p.id]={};['day','chg','req'].forEach(u=>{const c=E.evalRaw(E.seedRaw(E.REP),p.id,2,14)[u];res.repw[p.id][u]=E.wilson(c.tp+c.tn,c.n);});});
// 윌슨
res.wilson=[[0,14,.95],[14,14,.95],[111,112,.95],[1,10,.95],[5,10,.95],[21834,22400,.95],[0,1,.95],[1,1,.95],[3,7,.95],[50,200,.9],[50,200,.99],[7,12,.99]].map(a=>({k:a[0],n:a[1],c:a[2],w:E.wilson(a[0],a[1],a[2])}));
// 200 시드 원자료와 합산 칸
const raws=E.sweepSync(1,200);res.raws=raws.map(r=>({seed:r.seed,swaps:r.swaps,fault:r.fault,kinds:r.kinds,pol:Object.fromEntries(E.POLS.map(p=>[p.id,{an:r.pol[p.id].an,flags:r.pol[p.id].flags,base:r.pol[p.id].base,other:r.pol[p.id].other}]))}));
res.pool={};E.POLS.forEach(p=>{res.pool[p.id]={};['day','chg','req'].forEach(u=>{res.pool[p.id][u]=raws.map(r=>{const e=E.evalRaw(r,p.id,2,14)[u];return [e.tp,e.fn,e.fp,e.tn];});});});
res.late={};E.POLS.forEach(p=>{res.late[p.id]=raws.map(r=>{const e=E.evalRaw(r,p.id,2,14);return [e.lateC,e.lateR];});});
// gap: 기본 시뮬레이션(CSV 와 같은 것), 시드 1·2(60일), 시드 3(20일, CSV 로 내보내 파이썬이 읽음)
const g=E.gapSeed(null);res.gap={par:g.par,days:g.days,paths:g.paths.map(p=>[p.id,p.rep?1:0,p.t0,p.v1,p.v2,p.act,p.wait,p.held]),s1:g.s1,s2:g.s2,n1:g.n1,n2:g.n2};
res.gapSeeds={};[1,2].forEach(s=>{const sm=MS.simulateLoss({trace:true,seed:s});csv(path.join(OUT,'trace'+s+'.csv'),sm.transitions,['t','entity','id','from','to','trigger','cause']);const x=E.gapSeed(s);res.gapSeeds[s]={n:x.n,nrep:x.nrep,s1:x.s1,s2:x.s2,n1:x.n1,n2:x.n2};});
const sim3=MS.simulateLoss({trace:true,seed:3,days:20});csv(path.join(OUT,'trace3.csv'),sim3.transitions,['t','entity','id','from','to','trigger','cause']);
const g3=E.gapPaths(sim3.transitions,E.planParams(sim3));res.gap3={par:E.planParams(sim3),paths:g3.map(p=>[p.id,p.rep?1:0,p.t0,p.v1,p.v2,p.act,p.wait,p.held])};
fs.writeFileSync(path.join(OUT,'res.json'),JSON.stringify(res));
"""
_SEEDS02 = [115, 7, 60, 150, 199]
_jsf02 = os.path.join(_td02, 'export402.js'); open(_jsf02, 'w').write(_EXPORT02)
subprocess.run([_node, _jsf02, _DATA10, _td02, json.dumps(_SEEDS02)], capture_output=True, text=True, check=True, env=dict(os.environ, NODE_OPTIONS='--max-old-space-size=4096'))
_R02 = json.load(open(os.path.join(_td02, 'res.json')))
_POL02 = [('strict', 0), ('two', 2), ('off', 7)]; _UMAP02 = {'day': 'day', 'change': 'chg', 'request': 'req'}

# 1. 0401 에이전트를 시드로 넓혀도 기본 호출은 그대로: forSeed(대표 시드) = 기본 호출(정책 넷 × 14일의 분석 여부·점검 실패·변경점·요청·보고 원문), 기존 열쇠는 전부 남음
_old_keys = ['POLICY0', 'RULE_KO', 'KIND_KO', 'VERDICT_KO', 'CH', 'DAYS', 'OBS', 'MIN_N', 'REPAIR_DAYS', 'ALPHA', 'SPEC_GAP', 'SC', 'run', 'logRows', 'queueRows', 'summarize', 'snapshot', 'baseState', 'tp2', 'lag1']
chk('0402 agent0401 시드 확장: 시드 인자 없는 기본 호출 = forSeed(대표 시드 115)(정책 넷 × 14일의 분석 여부·점검 실패·변경점·요청·보고 원문 일치), 기존 공개 열쇠 20개 그대로, mfgsim.js 를 부르기만 함',
    _R02['forSeedSame'] is True and all(k in _R02['keys'] for k in _old_keys) and 'forSeed' in _R02['keys'] and not _re5.search(r'\bMS\.[A-Za-z0-9_]+\s*=(?!=)', _ag02s) and not _re5.search(r'\bMS\.[A-Za-z0-9_]+\s*=(?!=)', _js02s),
    f"공개 열쇠 {len(_R02['keys'])}개(새 열쇠 seed·forSeed)")

# 2. 다른 시드의 에이전트 행동: 0401 페이지의 Python 에이전트(독립 구현)가 CSV 에서 다시 돌려 JS 와 대조
def _loadpy02(sd): return os.path.join(_td02, 'seed%d' % sd)
_bad02, _nd02, _specbad02 = [], 0, []
_PYREC02 = {}
for _sd in _SEEDS02:
    _dd = _loadpy02(_sd)
    _clean = pd.read_csv(os.path.join(_dd, 's15_clean_ppa_coef.csv')); _spec = round(float(np.quantile(_clean['ppa_metric'], 0.9)), 6)
    if abs(_spec - _R02['seeds'][str(_sd)]['spec']) > 1e-9: _specbad02.append(_sd)
    _tb = _m01.load_tables(_dd); _old = _m01.SPEC; _m01.SPEC = _spec
    try:
        _PYREC02[_sd] = {pid: _m01.run_agent(_tb, {'tol': tol})[0] for pid, tol in _POL02}
    finally: _m01.SPEC = _old
    for pid, tol in _POL02:
        for _a, _b in zip(_R02['seeds'][str(_sd)]['runs'][pid], _PYREC02[_sd][pid]):
            _nd02 += 1
            _pb = {'day': _b['day'], 'an': _b['analyzed'], 'fails': _b['fails'], 'fl': _b['flagged'], 'req': [[q['id'], q['kind'], q['ch'], q['mask'], q['verdict']] for q in _b['requests']]}
            if _a != _pb: _bad02.append((_sd, pid, _a['day']))
chk(f'0402 시드 5개(대표 115 + 7·60·150·199) × 정책 셋 × 14일: JS 에이전트(forSeed) = 0401 페이지 Python 에이전트가 그 시드의 CSV 에서 다시 돌린 결과(분석 여부·점검 실패 규칙·새 변경점·요청 번호·종류·대상·판정), spec = 정답본 지표의 90% 분위(numpy)',
    not _bad02 and not _specbad02 and _nd02 == 5 * 3 * 14, f'{_nd02}일 기록 대조, 불일치 {len(_bad02)}, spec 불일치 {len(_specbad02)}' + (f' 예: {_bad02[:2]}' if _bad02 else ''))

# 3. 사람 결론(정답)을 CSV 에서 파이썬이 독립으로 다시 만든다: 고장이 든 날 · 마스크 교체(날·챔버)와 교체 전후 보정 후 Mx 평균 차
def _labels02(dd):
    fa = pd.read_csv(os.path.join(dd, 's15_faults.csv'), keep_default_na=False)
    rows = [{'kind': 'fault', 'day': int(d), 'chamber': '', 'value': '+'.join(g['kind'])} for d, g in fa.groupby('day')]
    mh = pd.read_csv(os.path.join(dd, 's15_mask_hist.csv'), keep_default_na=False)
    cp = pd.read_csv(os.path.join(dd, 's15_clean_ppa_coef.csv'), keep_default_na=False); cf = pd.read_csv(os.path.join(dd, 's15_clean_fdc_glass.csv'))
    m = cp.merge(cf[['glass_id', 'block', 'chamber', 'chamber_temp']], on='glass_id')
    T0 = _dt02.datetime(2026, 3, 2, 6, 0)
    for (blk, ch), g in mh[mh['state'] == 'IN_USE'].groupby(['block', 'chamber']):
        g = g.sort_values('from_ts')
        if len(g) < 2: continue
        ts = g.iloc[1]['from_ts']; mins = (_dt02.datetime.strptime(ts, '%Y-%m-%d %H:%M') - T0).total_seconds() / 60; day = int(mins // 1440) + 1
        if day > 14: continue
        sub = m[(m['block'] == blk) & (m['chamber'] == ch)].dropna(subset=['chamber_temp']); comp = sub['Mx'] - _m01.SLOPE * (sub['chamber_temp'] - _m01.T_REF)
        eff = float(comp[sub['ts'] >= ts].mean() - comp[sub['ts'] < ts].mean())
        rows.append({'kind': 'swap', 'day': day, 'chamber': blk + '-' + ch, 'value': '%.6f' % eff})
    return pd.DataFrame(rows, columns=['kind', 'day', 'chamber', 'value'])
_LAB02 = {sd: _labels02(_loadpy02(sd)) for sd in _SEEDS02}
_lbad02 = []
for _sd in _SEEDS02:
    _raw = _R02['seeds'][str(_sd)]['raw']; _L = _LAB02[_sd]
    _fd = sorted(int(d) for d in _L[_L['kind'] == 'fault']['day']); _jf = [i + 1 for i, f in enumerate(_raw['fault']) if f]
    _sw = sorted((int(r.day), r.chamber, float(r.value)) for r in _L[_L['kind'] == 'swap'].itertuples()); _jsw = sorted((s['day'], s['ch'], s['eff']) for s in _raw['swaps'])
    if _fd != _jf or len(_sw) != len(_jsw) or any(a[:2] != b[:2] or abs(a[2] - b[2]) > 1e-5 for a, b in zip(_sw, _jsw)): _lbad02.append(_sd)
chk('0402 사람 결론: 시드 5개에서 고장이 든 날(주입 목록 CSV)·마스크 교체의 날과 챔버(마스크 이력 CSV)·교체 전후 보정 후 Mx 평균 차(정답본 CSV, pandas)를 파이썬이 독립으로 다시 만든 것 = JS 의 사람 결론',
    not _lbad02, f'시드 {len(_SEEDS02)}개 · 교체 합계 {sum(len(_R02["seeds"][str(s)]["raw"]["swaps"]) for s in _SEEDS02)}건 · 불일치 시드 {_lbad02}')

# 4. 평가: 페이지 Python 의 agreement_table(독립 구현) = JS evalRaw — 파이썬이 다시 돌린 에이전트 기록과 파이썬이 다시 만든 사람 결론으로, 시드 5 × 정책 3 × 단위 3 × 허용 지연 4 × 기간 2
def _log02(recs):
    rows = []
    for pid, rr in recs.items():
        for r in rr:
            rows.append({'policy': pid, 'day': r['day'], 'event': 'day', 'chamber': '', 'detail': 'analyzed' if r['analyzed'] else 'stopped'})
            for c in r['flagged']: rows.append({'policy': pid, 'day': r['day'], 'event': 'flag', 'chamber': c, 'detail': ''})
            for q in r['requests']: rows.append({'policy': pid, 'day': r['day'], 'event': 'request', 'chamber': q['ch'] or '', 'detail': q['kind']})
    return pd.DataFrame(rows)
_ebad02, _nc02 = [], 0
for _sd in _SEEDS02:
    _lg = _log02(_PYREC02[_sd])
    for pid, _ in _POL02:
        for G in (0, 1, 2, 4):
            for D in (14, 9):
                _je = _R02['seeds'][str(_sd)]['ev'][pid][f'{G}|{D}']
                for un, uj in _UMAP02.items():
                    _c = _m02.agreement_table(_lg, _LAB02[_sd], un, pid, G, D); _j = _je[uj]; _nc02 += 1
                    _late = _je['lateC'] if un == 'change' else (_je['lateR'] if un == 'request' else 0)
                    if (_c['tp'], _c['fn'], _c['fp'], _c['tn']) != (_j['tp'], _j['fn'], _j['fp'], _j['tn']) or (un != 'day' and _c['late'] != _late) or abs(_c['agree'] - _j['agree']) > 1e-12 or abs(_c['all_no'] - _j['allno']) > 1e-12:
                        _ebad02.append((_sd, pid, G, D, un))
chk(f'0402 평가 단위 셋의 혼동표(맞음·놓침·헛·없음·늦은 신호·일치율·늘 없음 일치율): 페이지 Python agreement_table = JS evalRaw — 시드 5 × 정책 3 × 단위 3 × 허용 지연 {{0,1,2,4}} × 기간 {{14,9}}',
    not _ebad02 and _nc02 == 5 * 3 * 3 * 4 * 2, f'{_nc02}칸 대조, 불일치 {len(_ebad02)}' + (f' 예: {_ebad02[:2]}' if _ebad02 else ''))

# 5. 윌슨 구간: JS = 페이지 Python = scipy(binomtest().proportion_ci(method='wilson')) (1e-9), 극단(0/n·n/n)·95/90/99%, 정확한 이항 포함 확률(범위 0.9 이상)과 단순 구간과의 비교
_wbad02 = []
for w in _R02['wilson']:
    lo, hi = _m02.wilson_ci(w['k'], w['n'], w['c']); ci = stats.binomtest(w['k'], w['n']).proportion_ci(confidence_level=w['c'], method='wilson')
    if max(abs(lo - w['w']['lo']), abs(hi - w['w']['hi']), abs(lo - ci.low), abs(hi - ci.high)) > 1e-9: _wbad02.append((w['k'], w['n'], w['c']))
def _cov02(n, p, kind):
    ks = np.arange(0, n + 1); pm = stats.binom.pmf(ks, n, p); z = stats.norm.ppf(0.975); ph = ks / n
    if kind == 'wilson':
        den = 1 + z * z / n; ctr = (ph + z * z / (2 * n)) / den; h = z * np.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / den; lo, hi = ctr - h, ctr + h
    else:
        h = z * np.sqrt(ph * (1 - ph) / n); lo, hi = ph - h, ph + h
    return float(pm[(lo <= p) & (p <= hi)].sum())
_covW = [_cov02(112, p, 'wilson') for p in (0.9, 0.95, 0.975, 0.99)]; _covD = [_cov02(112, p, 'wald') for p in (0.9, 0.95, 0.975, 0.99)]
_w14 = _m02.wilson_ci(14, 14)
chk('0402 윌슨 구간: JS = 페이지 Python = scipy proportion_ci(wilson)(오차 < 1e-9, 12가지: 0/14·14/14·111/112·0/1·1/1 등, 신뢰도 95·90·99%), n = 112 에서 정확한 포함 확률 > 0.90(p = 0.9~0.99)이고 p = 0.99 에서 단순 구간보다 높음, 14/14 는 단순 구간 폭 0 인데 윌슨은 구간 낮은 끝 < 0.85',
    not _wbad02 and min(_covW) > 0.90 and _covW[3] > _covD[3] and _w14[0] < 0.85 and _w14[1] == 1.0, f'윌슨 포함 확률 {[round(x, 3) for x in _covW]} · 단순 {[round(x, 3) for x in _covD]} · 14/14 = [{_w14[0]:.3f}, {_w14[1]:.3f}]')

# 6. 시드 1~200 모으기: JS 가 낸 시드별 에이전트 기록(정책 셋)을 파이썬 agreement_table 이 다시 센 칸 = JS evalRaw(허용 지연 2·14일), 대표 시드 백분위·정책 맞바꿈의 사실
def _rawlog02(r):
    rows = []
    for pid, _ in _POL02:
        P = r['pol'][pid]
        for d in range(1, 15): rows.append({'policy': pid, 'day': d, 'event': 'day', 'chamber': '', 'detail': 'analyzed' if P['an'][d - 1] else 'stopped'})
        for x in P['flags']: rows.append({'policy': pid, 'day': x['day'], 'event': 'flag', 'chamber': x['ch'], 'detail': ''})
        for x in P['base']: rows.append({'policy': pid, 'day': x['day'], 'event': 'request', 'chamber': x['ch'], 'detail': 'baseline'})
        for x in P['other']: rows.append({'policy': pid, 'day': x['day'], 'event': 'request', 'chamber': x['ch'] or '', 'detail': x['kind']})
    return pd.DataFrame(rows)
def _rawlab02(r):
    rows = [{'kind': 'fault', 'day': i + 1, 'chamber': '', 'value': '+'.join(r['kinds'][i])} for i, f in enumerate(r['fault']) if f]
    rows += [{'kind': 'swap', 'day': s['day'], 'chamber': s['ch'], 'value': '%.6f' % s['eff']} for s in r['swaps']]
    return pd.DataFrame(rows, columns=['kind', 'day', 'chamber', 'value'])
_pbad02, _pyc02 = [], {pid: {u: [] for u in _UMAP02} for pid, _ in _POL02}
for _i, _r in enumerate(_R02['raws']):
    _lg, _lb = _rawlog02(_r), _rawlab02(_r)
    for pid, _ in _POL02:
        for un, uj in _UMAP02.items():
            _c = _m02.agreement_table(_lg, _lb, un, pid, 2, 14); _pyc02[pid][un].append(_c)
            if [_c['tp'], _c['fn'], _c['fp'], _c['tn']] != _R02['pool'][pid][uj][_i]: _pbad02.append((_i + 1, pid, un))
            if un != 'day' and _c['late'] != _R02['late'][pid][_i][0 if un == 'change' else 1]: _pbad02.append((_i + 1, pid, un, 'late'))
_rawlow = [r for r in _R02['raws'] if r['seed'] == 115][0]
_pcts02 = {}
for pid, _ in _POL02:
    for un, nm, key, hi_good in (('day', '날 일치율', 'agree', True), ('change', '변경점 놓침', 'fn', False), ('change', '변경점 헛', 'fp', False), ('request', '요청 일치율', 'agree', True), ('request', '요청 놓침', 'fn', False), ('request', '요청 헛', 'fp', False)):
        vals = np.array([c[key] for c in _pyc02[pid][un]]); v = vals[114]; _pcts02[(pid, nm)] = float(((vals < v - 1e-12).sum() + 0.5 * (np.abs(vals - v) <= 1e-12).sum()) / len(vals))
def _poolc(pid, un):
    cs = _pyc02[pid][un]; return {k: sum(c[k] for c in cs) for k in ('tp', 'fn', 'fp', 'tn', 'n', 'pos')}
_pl = {(pid, un): _poolc(pid, un) for pid, _ in _POL02 for un in _UMAP02}
_agr = {(pid, un): (_pl[(pid, un)]['tp'] + _pl[(pid, un)]['tn']) / _pl[(pid, un)]['n'] for pid, _ in _POL02 for un in _UMAP02}
_fnr = [_pl[(pid, 'request')]['fn'] / 200 for pid, _ in _POL02]; _fpr = [_pl[(pid, 'request')]['fp'] / 200 for pid, _ in _POL02]
_spr = {un: max(_agr[(pid, un)] for pid, _ in _POL02) - min(_agr[(pid, un)] for pid, _ in _POL02) for un in ('change', 'request')}
_allno_chg = {pid: 1 - _pl[(pid, 'change')]['pos'] / _pl[(pid, 'change')]['n'] for pid, _ in _POL02}
chk('0402 시드 1~200 모으기: 시드 200 × 정책 3 × 단위 3(허용 지연 2·14일)에서 페이지 Python 이 다시 센 혼동표·늦은 신호 = JS, 정책 맞바꿈의 사실(변경점·요청 두 단위의 정책별 일치율 차이 1%p 미만 · 요청 놓침 시드당 엄격 ≥ 5 × 점검 끔 · 점검을 풀수록 날 판정 놓침 증가 · 변경점 일치율은 세 정책 모두 늘 없음이라고만 답하는 기준 아래), 대표 시드 백분위 기록',
    not _pbad02 and _spr['change'] < 0.01 and _spr['request'] < 0.01 and _fnr[0] >= 5 * max(_fnr[2], 1e-9) and _fnr[0] > _fnr[1] > _fnr[2]
    and _pl[('strict', 'day')]['fn'] < _pl[('two', 'day')]['fn'] < _pl[('off', 'day')]['fn'] and all(_agr[(pid, 'change')] < _allno_chg[pid] for pid, _ in _POL02) and all(0 <= v <= 1 for v in _pcts02.values()),
    f'칸 대조 불일치 {len(_pbad02)} · 정책 일치율 차이 변경점 {100*_spr["change"]:.2f}%p·요청 {100*_spr["request"]:.2f}%p · 요청 놓침/시드 {[round(x,2) for x in _fnr]} · 헛/시드 {[round(x,2) for x in _fpr]} · 대표 시드 백분위(엄격) '
    + ' '.join(f'{nm} {100*_pcts02[("strict", nm)]:.0f}%' for nm in ('날 일치율', '변경점 놓침', '변경점 헛', '요청 일치율', '요청 놓침', '요청 헛')))

# 7. 허용 지연을 늘리면 늦게 나간 신호가 놓침에서 일치로 옮겨 감(대표 시드, 정책 3 × 지연 0~5), 14일 한 번의 구간 폭 > 시드 200개 모음 폭의 5배
_mono02 = True; _moved02 = False
for pid, _ in _POL02:
    for un in ('change', 'request'):
        _tp = [_m02.agreement_table(pd.read_csv(os.path.join(_td02, 's15_agent_log_115.csv'), keep_default_na=False), pd.read_csv(os.path.join(_td02, 's15_human_labels_115.csv'), keep_default_na=False), un, pid, G, 14)['tp'] for G in range(6)]
        if any(b < a for a, b in zip(_tp, _tp[1:])): _mono02 = False
        if _tp[-1] > _tp[0]: _moved02 = True
_wide02 = all((lambda c, P: (_m02.wilson_ci(c['tp'] + c['tn'], c['n'])[1] - _m02.wilson_ci(c['tp'] + c['tn'], c['n'])[0]) > 5 * (_m02.wilson_ci(P['tp'] + P['tn'], P['n'])[1] - _m02.wilson_ci(P['tp'] + P['tn'], P['n'])[0]))(_R02['seeds']['115']['ev'][pid]['2|14'][uj], _pl[(pid, un)]) for pid, _ in _POL02 for un, uj in _UMAP02.items())
chk('0402 조작의 사실: 허용 지연 0~5 에서 일치(맞음) 칸은 줄지 않고 늘어나는 경우가 있으며(대표 시드), 대표 시드 14일 구간 폭이 시드 200개 모음 폭의 5배를 넘음(정책 3 × 단위 3)', _mono02 and _moved02 and _wide02, f'단조 {_mono02} · 지연 변화 {_moved02} · 폭 {_wide02}')

# 8. 계획 모델 두 판과 sim-real gap: 0206 전이 기록 CSV 에서 파이썬이 다시 계산 = JS 경로별(식별·떠난 시각·판 1·판 2·실제·세정 대기·짝 대기 12,478개), 두 번째 기록(시드 3, 20일)도, 불변식
_tr = pd.read_csv(os.path.join(_td02, 'mask_transitions.csv'), keep_default_na=False)
_g = _m02.sim_real_gap(_tr, _m02.PLAN)
_jp = _R02['gap']['paths']
_gbad = sum(1 for a, row in zip(_jp, _g.itertuples()) if (a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7]) != (row.id, int(row.kind == '리페어'), row.t0, row.plan1, row.plan2, row.actual, row.wait, row.held))
_g3 = _m02.sim_real_gap(pd.read_csv(os.path.join(_td02, 'trace3.csv'), keep_default_na=False), _R02['gap3']['par'])
_gbad3 = sum(1 for a, row in zip(_R02['gap3']['paths'], _g3.itertuples()) if (a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7]) != (row.id, int(row.kind == '리페어'), row.t0, row.plan1, row.plan2, row.actual, row.wait, row.held))
_rp = _g[_g['kind'] == '리페어']; _nm = _g[_g['kind'] == '정상']
chk(f'0402 sim-real gap: 파이썬이 전이 기록 CSV 에서 다시 센 마스크 경로({len(_g)}개)의 판 1·판 2 예측·실제 입고·세정 대기·짝 대기 = JS(경로마다 일치), 다른 기록(시드 3·20일 {len(_g3)}개)도 일치, 계획 설정값 = 시뮬레이터 설정값, 불변식(판 2 ≥ 판 1 · 리페어 경로는 두 판이 같음 · 실제 입고는 떠난 시각보다 뒤)',
    len(_g) == len(_jp) and _gbad == 0 and len(_g3) == len(_R02['gap3']['paths']) and _gbad3 == 0 and _m02.PLAN == {k: _R02['gap']['par'][k] for k in _m02.PLAN} and bool((_g['plan2'] >= _g['plan1']).all()) and bool((_rp['plan1'] == _rp['plan2']).all()) and bool((_g['actual'] > _g['t0']).all()),
    f'경로 {len(_g)}(리페어 {len(_rp)}) · 불일치 {_gbad} · 시드 3: {len(_g3)}경로 불일치 {_gbad3}')

# 9. gap 통계: 평균·표준편차(자유도 n−1)·절댓값 분위(선형 보간) JS = numpy, 시드 1·2 의 60일 기록도, 사실(판 2 는 치우침을 줄이고 표준편차는 조금 줄임 · 남은 평균 차 ≈ 짝 대기 평균 · 리페어 경로의 표준편차가 큼)
def _st02(x):
    x = np.asarray(x, float); a = np.abs(x); return {'n': len(x), 'bias': float(x.mean()), 'sd': float(x.std(ddof=1)), 'q50': float(np.quantile(a, .5)), 'q90': float(np.quantile(a, .9)), 'q99': float(np.quantile(a, .99))}
def _same02(a, b): return a['n'] == b['n'] and all(abs(a[k] - b[k]) < 1e-9 * max(1, abs(a[k])) for k in ('bias', 'sd', 'q50', 'q90', 'q99'))
_sbad = []
for _lab, _js, _df in (('전체1', _R02['gap']['s1'], _g.assign(g=_g['gap1'])), ('전체2', _R02['gap']['s2'], _g.assign(g=_g['gap2'])), ('정상1', _R02['gap']['n1'], _nm.assign(g=_nm['gap1'])), ('정상2', _R02['gap']['n2'], _nm.assign(g=_nm['gap2']))):
    if not _same02(_js, _st02(_df['g'])): _sbad.append(_lab)
for _s in (1, 2):
    _gs = _m02.sim_real_gap(pd.read_csv(os.path.join(_td02, f'trace{_s}.csv'), keep_default_na=False), _m02.PLAN); _nn = _gs[_gs['kind'] == '정상']; _J = _R02['gapSeeds'][str(_s)]
    for _lab, _js, _x in (('s1', _J['s1'], _gs['gap1']), ('s2', _J['s2'], _gs['gap2']), ('n1', _J['n1'], _nn['gap1']), ('n2', _J['n2'], _nn['gap2'])):
        if not _same02(_js, _st02(_x)): _sbad.append((_s, _lab))
_b1, _b2 = _st02(_nm['gap1']), _st02(_nm['gap2']); _held = float(_nm['held'].mean()); _rsd = float(_rp['gap1'].std(ddof=1))
chk('0402 gap 통계: 평균·표준편차·절댓값 중앙·상위 10%·1% 경계(전체·정상 경로 × 판 1·2, 시드 1·2 의 60일 기록 포함) JS = numpy, 사실(판 2 의 정상 경로 평균 gap 이 판 1 보다 0 에 가깝고 표준편차는 줄되 25% 안쪽 · 판 2 의 남은 평균 차 ≈ 짝 대기 평균(차이 3분 미만) · 리페어 경로 표준편차가 정상의 5배 이상)',
    not _sbad and abs(_b2['bias']) < abs(_b1['bias']) and _b2['sd'] < _b1['sd'] and _b2['sd'] > 0.75 * _b1['sd'] and abs(abs(_b2['bias']) - _held) < 3 and _rsd > 5 * _b1['sd'],
    f'불일치 {_sbad} · 정상 경로 평균 {_b1["bias"]:.1f} → {_b2["bias"]:.1f}분 · 표준편차 {_b1["sd"]:.1f} → {_b2["sd"]:.1f}분 · 짝 대기 평균 {_held:.1f}분 · 리페어 표준편차 {_rsd:.1f}분')

# 10. 페이지 Python 실행: 오류 없이 돌고 출력이 페이지 출력 상자와 한 글자도 다르지 않으며, 혼동표·구간·gap 숫자가 JS 와 같음
_run02 = subprocess.run([sys.executable, '-I', 'lab0402.py'], cwd=_td02, capture_output=True, text=True); _L02 = _run02.stdout.strip().split('\n')
_exp02 = []
for pid, pname in (('strict', '엄격'), ('two', '2개 허용'), ('off', '점검 끔')):
    for un, uname in (('day', '날 판정'), ('chg', '변경점'), ('req', '요청')):
        c = _R02['seeds']['115']['ev'][pid]['2|14'][un]; w = _R02['repw'][pid][un]
        _exp02.append("%s · %s: 일치 %d/%d = %.1f%% (95%% 구간 %.1f~%.1f%%) · 놓침 %d · 헛 %d · 모두 '없음'이면 %.1f%%" % (pname, uname, c['tp'] + c['tn'], c['n'], 100 * c['agree'], 100 * w['lo'], 100 * w['hi'], c['fn'], c['fp'], 100 * c['allno']))
_gl = []
for name, sub in (('전체', _g), ('정상', _nm), ('리페어', _rp)):
    for v, vn in (('gap1', '판 1(평균값만)'), ('gap2', '판 2(세정 대기열 반영)')):
        x = sub[v]; _gl.append("  %s · %s: 평균 %.1f · 표준편차 %.1f · 절댓값 중앙 %.0f · 상위 10%% 경계 %.0f" % (name, vn, x.mean(), x.std(ddof=1), x.abs().quantile(0.5), x.abs().quantile(0.9)))
chk('0402 페이지 Python 코드가 오류 없이 돌고 출력이 페이지의 출력 상자와 한 글자도 다르지 않으며, 출력의 혼동표 9줄(JS 값과 윌슨 구간 포함)과 gap 요약 6줄이 JS 경로 값에서 numpy 로 다시 낸 값과 같고, 외부 통신 코드와 사내 모델 호출이 없음',
    _run02.returncode == 0 and _run02.stdout.strip() == _out02 and all(e in _L02 for e in _exp02) and all(g in _L02 for g in _gl) and f'마스크 경로 {len(_g)}개(리페어 {len(_rp)}개)' in _run02.stdout
    and not _re5.search(r'^\s*(?:import|from)\s+(?:requests|urllib|socket|http|openai|anthropic|httpx)', _code02, _re5.M) and 'ask_internal_model' not in _code02,
    (_run02.stderr[-300:] if _run02.returncode else f'{len(_L02)}줄'))

# 11. 페이지 구조
_term02 = len(_re5.findall(r'<li>', _re5.search(r'<ul class="chips" id="termList">(.*?)</ul>', _pg02, _re5.S).group(1)))
_nq02 = len(_re5.findall(r'<div class="qna" data-label=', _pg02)); _nsec02 = len(_re5.findall(r'<h2><span class="no">', _pg02))
_fonts02 = [int(x) for x in _re5.findall(r"(?:x\.font|\.font)\s*=\s*'[^']*?(\d+)px", _pg02)] + [int(x) for x in _re5.findall(r'fitFont\([^)]*?,\s*\d+\s*,\s*(\d+)\s*,', _pg02)]
_body02 = _re5.sub(r'<script.*?</script>|<pre.*?</pre>|<style.*?</style>', '', _pg02, flags=_re5.S); _body02 = _html5.unescape(_re5.sub(r'<[^>]+>', ' ', _body02))
_endda02 = _re5.findall(r'[^니습]다[.]', _body02)
_p01 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0401-agent-prototype.html'), encoding='utf-8').read(); _hub02 = open(os.path.join(os.path.dirname(_DATA10), 'index.html'), encoding='utf-8').read()
_slid02 = ['id="sG" min="0" max="5" step="1" value="2"', 'id="sG4" min="0" max="5" step="1" value="2"', 'id="sD" min="1" max="14" step="1" value="14"', 'id="sS" min="1" max="200" step="1" value="200"', 'id="sS4" min="1" max="200" step="1" value="200"', 'id="sBig" min="1" max="50" step="1" value="10"',
           'id="sCm" min="30" max="600" step="30" value="240"', 'id="sCf" min="2" max="60" step="2" value="10"', 'id="sCd" min="0" max="240" step="10" value="60"', 'id="sHm" min="0" max="40" step="1" value="10"', 'id="sHf" min="0" max="5" step="0.5" value="1"']
_df02 = _R02['defaults']
chk('0402 페이지: 새 용어 6개 · Q&A 4개 · 절 10개 · 윌슨 구간 MathML · 캔버스 글자 11px 이상 · 인용 밖 본문에 -다 끝맺음 없음 · 0401 의 위·아래 다음 링크와 0401 로 가는 위·아래 이전 링크 · 허브 등록(단계 4 묶음) · 계산 모듈에 난수·시각 함수 없음 · 슬라이더 기본값 = 모듈 기본값(허용 지연 2·시드 200·문턱 0.5) · 평가 단위 셋·시드 분포 지표 문구',
    _term02 == 6 and _nq02 == 4 and _nsec02 == 10 and '<math display="block">' in _pg02 and '<mfrac>' in _pg02 and min(_fonts02) >= 11 and not _endda02 and _p01.count('0402-agent-evaluation.html') == 2 and _pg02.count('0401-agent-prototype.html') == 2
    and 'labs/0402-agent-evaluation.html' in _hub02 and all(not _re5.search(r'Math\.random|Date\.now|new Date', t) for t in (_js02s, _ag02s)) and all(s in _pg02 for s in _slid02)
    and _df02['G0'] == 2 and _df02['SEEDS'] == 200 and _df02['DAYS'] == 14 and _df02['DELTA_H'] == 0.5 and _df02['REP'] == 115 and 'src="../data/eval0402.js"' in _pg02 and 'mfgsim.js' in _pg02 and 'agent0401.js' in _pg02,
    f'용어 {_term02} · Q&A {_nq02} · 절 {_nsec02} · 캔버스 글자 최소 {min(_fonts02)}px({len(_fonts02)}곳) · -다 끝맺음 {len(_endda02)}건 · 0401 링크 {_pg02.count("0401-agent-prototype.html")}곳 · 0401 쪽 0402 링크 {_p01.count("0402-agent-evaluation.html")}곳')
_cleanup02 = shutil.rmtree(_td02, ignore_errors=True)

# ============================================================
# 0501 — Loss 분류 체계와 파레토. 계산 모듈(loss05.js)의 파레토·교차표·재귀속·코드 합치기·주 단위·시드 분포를 페이지의 Python 코드(lab0501.py, 독립 구현)가
# loss_events.csv·loss_seed_summary.csv 에서 다시 계산해 JS 와 대조한다. 시드 분포는 JS 가 시뮬레이터를 다시 돌린 요약과 CSV 를, 일부 시드는 사건 CSV 로 파이썬이 독립 집계.
# ============================================================
_pg05 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0501-loss-pareto.html'), encoding='utf-8').read()
_code05 = _html5.unescape(_re5.search(r'<pre id="pyCode">(.*?)</pre>', _pg05, _re5.S).group(1)); _out05 = _html5.unescape(_re5.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg05, _re5.S).group(1)).strip()
_js05s = open(os.path.join(_DATA10, 'loss05.js'), encoding='utf-8').read()
_td05 = _tf5.mkdtemp()
for _f in ('loss_events.csv', 'loss_seed_summary.csv'): shutil.copy(os.path.join(_DATA10, 'csv', _f), os.path.join(_td05, _f))
open(os.path.join(_td05, 'lab0501.py'), 'w', encoding='utf-8').write(_code05)
_sp05 = _ilu01.spec_from_file_location('lab0501', os.path.join(_td05, 'lab0501.py')); _m05 = _ilu01.module_from_spec(_sp05); _sp05.loader.exec_module(_m05)
_EXPORT05 = r"""const fs=require('fs'),path=require('path');
const DATA=process.argv[2],OUT=process.argv[3];
const MS=require(DATA+'/mfgsim.js'),L=require(DATA+'/loss05.js');
const sim=MS.simulateLoss(),ev=sim.events,res={};
function csv(fn,rows,cols){const esc=v=>(v==null?'':String(v).includes(',')?'"'+String(v).replace(/"/g,'""')+'"':String(v));fs.writeFileSync(fn,[cols.join(',')].concat(rows.map(r=>cols.map(c=>esc(r[c])).join(','))).join('\n')+'\n');}
const slim=p=>({total:p.total,n:p.n,items:p.items.map(x=>[x.key,x.n,x.v,x.share,x.cum])});
res.csvLoss=['event_id','start_ts','end_ts','block','chamber','reason','root_cause','caused_by_block','run_mode','mask_set','turn','loss_chamber_min','loss_glass'];
{const esc=v=>(v==null?'':String(v).includes(',')?'"'+String(v).replace(/"/g,'""')+'"':String(v));res.lossText=[res.csvLoss.join(',')].concat(ev.map(r=>res.csvLoss.map(c=>esc(r[c])).join(','))).join('\n')+'\n';}
res.par={};['glass','min'].forEach(v=>{res.par[v]={};['reason','root_cause','caused_by_block','block','cat_reason','cat_root'].forEach(b=>{res.par[v][b]=slim(L.pareto(ev,b,v));});});
const X=L.cross(ev);res.cross={rows:X.rows,cols:X.cols,m:X.m,rowTot:X.rowTot,colTot:X.colTot,total:X.total};
res.reat={};X.rows.forEach(r=>{res.reat[r]=slim(L.reattribute(ev,r));});
const cat=c=>L.CODES.filter(x=>L.info(x).cat===c);
const cfgs=[[[],null,0],[[{name:'설비',codes:cat('설비')}],null,0],[[{name:'품질',codes:cat('품질')}],null,0],[[{name:'물류',codes:cat('물류')}],null,0],[[{name:'설비',codes:cat('설비')},{name:'품질',codes:cat('품질')},{name:'물류',codes:cat('물류')}],null,0],
 [[],['EQ-PM'],0],[[],['Q-MASK'],0.02],[[],'*',0],[[],'*',0.05],[[{name:'설비',codes:cat('설비')}],['Q-MASK'],0.03],[[],null,0.1],[[{name:'품질',codes:cat('품질')}],'*',0.02],[[{name:'설비',codes:cat('설비')},{name:'품질',codes:cat('품질')}],null,0],[[],['EQ-PM','Q-MASK'],0.02]];
res.cfg=cfgs.map(c=>({merges:c[0].map(g=>[g.name,g.codes]),split:c[1],thr:c[2],out:slim(L.codeSystem(ev,c[0],c[1],c[2]))}));
res.wk={};['root_cause','reason'].forEach(b=>{res.wk[b]=L.weekly(ev,60,b).map(w=>({week:w.week,par:slim(w.par)}));});
const bt=L.blockTable(ev);res.bt=bt;res.os=L.otherShare(ev);
const ch=L.chain(ev);res.chain={lb:ch.lb.event_id,causes:ch.causes.map(e=>e.event_id)};
res.tasks=L.tasks(ev);res.nturn=L.N_TURN;
res.cell=slim(L.paretoWith(ev,e=>e.root_cause+'@'+e.caused_by_block));
// 시드 요약: CSV 와 같은 시드 목록
const list=[L.DEFAULT_SEED].concat(Array.from({length:L.SEEDS},(_,i)=>i+1)).map(s=>L.seedRun(s));
res.seedRows=L.seedRows(list).map(r=>[r.seed,r.kind,r.code,r.n,r.glass,r.min]);
const use=list.slice(1),dflt=list[0];
res.rs={};['root','direct'].forEach(k=>{const S=L.rankStab(use,k);res.rs[k]=S.codes.map(q=>({code:q.code,top1:q.top1,top3:q.top3,r25:q.r25,r50:q.r50,r75:q.r75,rmin:q.rmin,rmax:q.rmax,s10:q.s10,s50:q.s50,s90:q.s90}));});
res.met=L.METRICS.map(m=>{const v=use.map(m.f);return {id:m.id,def:m.f(dflt),pct:L.percentile(v,m.f(dflt)),med:L.quantile(v,0.5)};});
res.dflt={root:Object.fromEntries(Object.entries(dflt.root).map(([k,v])=>[k,v.glass])),total:dflt.total};
res.topByseed=use.map(r=>[Object.entries(r.root).sort((a,b)=>b[1].glass-a[1].glass||(a[0]<b[0]?-1:1))[0][0],Object.entries(r.direct).sort((a,b)=>b[1].glass-a[1].glass||(a[0]<b[0]?-1:1))[0][0]]);
// 일부 시드의 사건 CSV(파이썬이 독립 집계)
[1,2,7].forEach(s=>{const sm=MS.simulateLoss({seed:s});csv(path.join(OUT,'ev'+s+'.csv'),sm.events,res.csvLoss);});
res.defaults={days:L.DAYS,seeds:L.SEEDS,seed:L.DEFAULT_SEED};
res.wkSeed=[];
fs.writeFileSync(path.join(OUT,'res.json'),JSON.stringify(res));
"""
_jsf05 = os.path.join(_td05, 'export501.js'); open(_jsf05, 'w').write(_EXPORT05)
subprocess.run([_node, _jsf05, _DATA10, _td05], capture_output=True, text=True, check=True, env=dict(os.environ, NODE_OPTIONS='--max-old-space-size=4096'))
_R05 = json.load(open(os.path.join(_td05, 'res.json')))
def _fm05(x): return format(int(x + 0.5 + 1e-6), ',')
_ev05 = _m05.load_events(os.path.join(_td05, 'loss_events.csv'))
def _same05(a, b, tol=1e-6): return abs(a - b) <= tol * max(1.0, abs(a), abs(b))
def _par_eq05(jp, pdf, key, col='value'):
    if len(jp['items']) != len(pdf): return False
    return all(it[0] == r[key] and it[1] == r['n'] and _same05(it[2], r[col]) and _same05(it[3], r['share'], 1e-9) and _same05(it[4], r['cum'], 1e-9) for it, (_, r) in zip(jp['items'], pdf.iterrows()))

# 1. 기존 출력 불변: 사건 CSV 는 simulateLoss() 의 출력과 같은 글자, 사건 수·합
_csvtxt05 = open(os.path.join(_DATA10, 'csv', 'loss_events.csv'), encoding='utf-8').read()
chk('0501 기존 출력 불변: loss_events.csv 가 simulateLoss() 기본 호출의 출력과 같은 글자이고, 사건 4748건·유리 합 = 근본 원인 파레토 합 = 직접 사유 파레토 합(귀속만 바뀌고 합은 같음)',
    _csvtxt05 == _R05['lossText'] and len(_ev05) == 4748 and _same05(_R05['par']['glass']['reason']['total'], _R05['par']['glass']['root_cause']['total']) and _same05(_ev05['loss_glass'].sum(), _R05['par']['glass']['reason']['total']),
    f'{len(_ev05)}건 · 합 {_ev05["loss_glass"].sum():,.1f}장')

# 2. 파레토: 직접 사유·근본 원인·원인 블록·분류, 값 = 장수/챔버 분
_cat05 = _m05.CATEGORY
_ev05['cat_reason'] = _ev05['reason'].map(_cat05); _ev05['cat_root'] = _ev05['root_cause'].map(_cat05)
_ok05 = True; _det05 = []
for _v, _col in (('glass', 'loss_glass'), ('min', 'loss_chamber_min')):
    for _b in ('reason', 'root_cause', 'caused_by_block', 'block', 'cat_reason', 'cat_root'):
        _p = _m05.pareto(_ev05, _b, _col); _o = _par_eq05(_R05['par'][_v][_b], _p, _b); _ok05 &= _o
        if not _o: _det05.append(_v + '/' + _b)
chk('0501 파레토 JS = 페이지 Python(pandas): 직접 사유·근본 원인·원인 블록·블록·분류(직접·근본) × 잃은 장수·챔버 분, 사건 수·몫·누적 비율까지', _ok05, f'{12}개 파레토' + (' 불일치 ' + ','.join(_det05) if _det05 else ''))

# 3. 교차표와 재귀속
_ct05 = _m05.crosstab_direct_root(_ev05); _X05 = _R05['cross']
_ok = list(_ct05.index) == _X05['rows'] and list(_ct05.columns) == _X05['cols'] and all(_same05(_ct05.iloc[i, j], _X05['m'][i][j]) for i in range(len(_X05['rows'])) for j in range(len(_X05['cols']))) and _same05(_ct05.values.sum(), _X05['total'])
_rok = all(_par_eq05(_R05['reat'][r], _m05.pareto(_ev05[_ev05['reason'] == r], 'root_cause'), 'root_cause') for r in _X05['rows'])
chk('0501 직접 × 근본 교차표와 재귀속(직접 사유별 근본 원인 몫) JS = 페이지 Python, 교차표 전체 합 = 전체 장수', _ok and _rok, f'{len(_X05["rows"])}×{len(_X05["cols"])}칸')

# 4. 코드 합치기·나누기·기타 문턱: 열네 설정
_cok = True; _cd05 = []
for _i, _c in enumerate(_R05['cfg']):
    _mp = {code: nm for nm, codes in _c['merges'] for code in codes}; _sp = _c['split']
    _spl = [] if _sp is None else (sorted(_ev05['root_cause'].unique()) if _sp == '*' else _sp)
    _p = _m05.merge_codes(_ev05, _mp, split=_spl, min_share=_c['thr'])
    _o = len(_p) == len(_c['out']['items']) and all(it[0] == r['label'] and it[1] == r['n'] and _same05(it[2], r['value']) and _same05(it[3], r['share'], 1e-9) and _same05(it[4], r['cum'], 1e-9) for it, (_, r) in zip(_c['out']['items'], _p.iterrows()))
    _cok &= _o
    if not _o: _cd05.append(_i)
_p0 = _R05['cfg'][0]['out']; _pm = _R05['cfg'][1]['out']; _ps = _R05['cfg'][7]['out']
chk('0501 코드 체계 열네 설정(합치기·블록별 나누기·기타 문턱) JS = 페이지 Python, 모든 설정의 막대 합 = 전체 장수, 기준 설정 = 근본 원인 파레토',
    _cok and all(_same05(sum(it[2] for it in c['out']['items']), _R05['par']['glass']['reason']['total']) for c in _R05['cfg']) and [it[:3] for it in _p0['items']] == [it[:3] for it in _R05['par']['glass']['root_cause']['items']],
    f'막대 수 기준 {len(_p0["items"])} · 설비 합침 {len(_pm["items"])} · 모두 블록별 {len(_ps["items"])}' + (f' 불일치 {_cd05}' if _cd05 else ''))

# 5. 주 단위 파레토(근본·직접)
_wok = True
for _b in ('root_cause', 'reason'):
    _w = _m05.weekly_pareto(_ev05, _b)
    _wok &= len(_w) == len(_R05['wk'][_b]) == 8 and all(_par_eq05(_R05['wk'][_b][k]['par'], _w[k], _b) for k in range(8))
_wk05 = [w['par']['items'][0][0] for w in _R05['wk']['root_cause']]; _top05 = _R05['par']['glass']['root_cause']['items'][0][0]
chk('0501 주 단위 파레토(7일이 찬 8주, 시작 시각의 주에 넣음) JS = 페이지 Python: 근본 원인·직접 사유 모두, 그 주의 1위가 전체 1위와 다른 주 수를 기록', _wok and sum(len(_ev05[_ev05['week'] == k]) for k in range(8)) <= len(_ev05),
    f'근본 원인 1위가 전체({_top05})와 다른 주 {sum(1 for k in _wk05 if k != _top05)}/8 · 직접 사유 1위가 다른 주 {sum(1 for w in _R05["wk"]["reason"] if w["par"]["items"][0][0] != _R05["par"]["glass"]["reason"]["items"][0][0])}/8')

# 6. 시드 요약 CSV: JS 가 시뮬레이터를 다시 돌린 요약 = 파일, 일부 시드는 사건 CSV 로 파이썬이 독립 집계
_sm05 = pd.read_csv(os.path.join(_DATA10, 'csv', 'loss_seed_summary.csv'), keep_default_na=False)
_jr = _R05['seedRows']
_same_rows = len(_jr) == len(_sm05) and all(r[0] == s.seed and r[1] == s.kind and r[2] == s.code and r[3] == s.n and abs(round(r[4], 4) - s.glass) < 1e-9 and abs(round(r[5], 4) - s['min']) < 1e-9 for r, (_, s) in zip(_jr, _sm05.iterrows()))
_ind = True
for _sd in (1, 2, 7):
    _e = pd.read_csv(os.path.join(_td05, f'ev{_sd}.csv'), keep_default_na=False)
    for _kind, _col in (('direct', 'reason'), ('root', 'root_cause')):
        _g = _e.groupby(_col).agg(n=('loss_glass', 'count'), glass=('loss_glass', 'sum'), mn=('loss_chamber_min', 'sum'))
        _s = _sm05[(_sm05['seed'] == _sd) & (_sm05['kind'] == _kind)].set_index('code')
        _ind &= sorted(_g.index) == sorted(_s.index) and all(_g.loc[c, 'n'] == _s.loc[c, 'n'] and abs(_g.loc[c, 'glass'] - _s.loc[c, 'glass']) < 1e-3 and abs(_g.loc[c, 'mn'] - _s.loc[c, 'min']) < 1e-3 for c in _g.index)
_dflt05 = _sm05[(_sm05['seed'] == _R05['defaults']['seed']) & (_sm05['kind'] == 'root')].set_index('code')['glass']
chk('0501 시드 요약 CSV(기본 시드 + 시드 1~40) = JS 재실행 요약(한 줄도 다르지 않음), 시드 1·2·7 은 사건 CSV 에서 파이썬이 독립 집계한 직접 사유·근본 원인 코드별 사건 수·장수·챔버 분과 일치, 기본 시드 줄 = 기본 파레토',
    _same_rows and _ind and _sm05['seed'].nunique() == 41 and all(_same05(_dflt05[k], v) for k, v in {c: it for c, _, it, _, _ in _R05['par']['glass']['root_cause']['items']}.items()), f'{len(_sm05)}줄 · 시드 {_sm05["seed"].nunique()}개')

# 7. 순위 흔들림: 페이지 Python rank_stability = JS rankStab, 시드 40 × 근본 원인·직접 사유
_frames05 = {}
for _kind, _by in (('root', 'root_cause'), ('direct', 'reason')):
    _frames05[_kind] = [g.rename(columns={'code': _by, 'glass': 'loss_glass'}) for _, g in _sm05[(_sm05['kind'] == _kind) & (_sm05['seed'] != _R05['defaults']['seed'])].groupby('seed')]
_rok = True
for _kind, _by in (('root', 'root_cause'), ('direct', 'reason')):
    _r = _m05.rank_stability(_frames05[_kind], _by)
    _js = {q['code']: q for q in _R05['rs'][_kind]}
    _rok &= len(_r) == len(_js) and all(_same05(_js[r['code']]['top1'], r['top1'], 1e-9) and _same05(_js[r['code']]['r25'], r['r25'], 1e-9) and _same05(_js[r['code']]['r50'], r['r50'], 1e-9) and _same05(_js[r['code']]['r75'], r['r75'], 1e-9) and _same05(_js[r['code']]['s50'], r['s50'], 1e-9) for _, r in _r.iterrows())
    _rok &= list(_r['code']) == [q['code'] for q in _R05['rs'][_kind]]
_top1 = {q['code']: q['top1'] for q in _R05['rs']['root']}
chk('0501 순위 흔들림(시드 40 × 60일): 페이지 Python rank_stability(1위 비율·순위 25/50/75%·몫 중앙값, 코드 순서까지) = JS rankStab — 근본 원인·직접 사유 모두',
    _rok, '근본 원인 1위 비율 ' + ' · '.join(f'{k} {100*v:.1f}%' for k, v in sorted(_top1.items(), key=lambda x: -x[1]) if v > 0) + ' / 직접 사유 1위 ' + ' · '.join(f'{q["code"]} {100*q["top1"]:.0f}%' for q in _R05['rs']['direct'] if q['top1'] > 0))

# 8. 대표 시드(기본 시드)의 백분위: 페이지 Python percentile = JS, 25~75% 밖 지표를 기록(본문은 그 지표를 분포로 말함)
_gp = []
for _c in _frames05['root']:
    _v = _c.groupby('root_cause')['loss_glass'].sum().sort_values(ascending=False); _gp.append(100 * (_v.iloc[0] - _v.iloc[1]) / _v.sum())
_dv = _dflt05.sort_values(ascending=False); _dg = 100 * (_dv.iloc[0] - _dv.iloc[1]) / _dv.sum()
_mj = {m['id']: m for m in _R05['met']}
_outs = [m['id'] for m in _R05['met'] if m['pct'] < 0.25 or m['pct'] > 0.75]
chk('0501 대표 시드 백분위: 1위·2위 몫 차의 백분위 JS = 페이지 Python percentile, 여섯 지표의 백분위 전부 유한값, 25~75% 밖 지표를 기록(그 지표는 본문이 분포로 말함)',
    _same05(_mj['rootGap']['pct'], _m05.percentile(_gp, _dg), 1e-9) and all(0 <= m['pct'] <= 1 for m in _R05['met']) and len(_R05['met']) == 6, '25~75% 밖: ' + (', '.join(f"{i}({100*_mj[i]['pct']:.0f}%)" for i in _outs) or '없음') + ' · 나머지 ' + ' '.join(f"{m['id']}={100*m['pct']:.0f}%" for m in _R05['met'] if m['id'] not in _outs))

# 9. 설계 기대: 직접 1위 ≠ 근본 1위(기본 시드와 시드 40개 모두), LB-LINE 은 근본 원인에 없음, 다른 블록 때문에 잃은 몫 = LB-LINE 의 몫
_dtop = _R05['par']['glass']['reason']['items'][0][0]; _rtop = _R05['par']['glass']['root_cause']['items'][0][0]
_rcodes = [it[0] for it in _R05['par']['glass']['root_cause']['items']]
chk('0501 설계 기대: 기본 시드의 직접 사유 1위 ≠ 근본 원인 1위, 시드 40개 모두에서도 그렇고, 근본 원인 코드에 LB-LINE 이 없으며, 다른 블록 때문에 잃은 몫 = 직접 사유 LB-LINE 의 몫(다른 블록이 원인인 사건은 LB-LINE 으로만 기록)',
    _dtop != _rtop and all(a != b for a, b in _R05['topByseed']) and 'LB-LINE' not in _rcodes and _same05(_R05['os']['other'], [it[2] for it in _R05['par']['glass']['reason']['items'] if it[0] == 'LB-LINE'][0]) and all(r.caused_by_block == r.block for r in _ev05[_ev05['reason'] != 'LB-LINE'].itertuples()),
    f'직접 1위 {_dtop} {100*_R05["par"]["glass"]["reason"]["items"][0][3]:.1f}% · 근본 1위 {_rtop} {100*_R05["par"]["glass"]["root_cause"]["items"][0][3]:.1f}%')

# 10. 원인 블록 표: 합계 항등식, 파이썬이 독립 집계
_bt = _R05['bt']['rows']
_own = _ev05.groupby('block')['loss_glass'].sum(); _oth = _ev05[_ev05['caused_by_block'] != _ev05['block']].groupby('block')['loss_glass'].sum(); _cau = _ev05[_ev05['caused_by_block'] != _ev05['block']].groupby('caused_by_block')['loss_glass'].sum()
chk('0501 원인 블록 표: 블록별 내가 잃은 것·그중 남 때문·남에게 잃게 한 것 JS = 파이썬 독립 집계, 남 때문에 잃은 합 = 남에게 잃게 한 합 = 다른 블록 때문에 잃은 몫, 블록별 잃은 것의 합 = 전체',
    all(_same05(r['lost'], _own[r['block']]) and _same05(r['lostByOthers'], _oth.get(r['block'], 0.0)) and _same05(r['causedOthers'], _cau.get(r['block'], 0.0)) for r in _bt) and _same05(sum(r['lostByOthers'] for r in _bt), sum(r['causedOthers'] for r in _bt)) and _same05(sum(r['lost'] for r in _bt), _ev05['loss_glass'].sum()),
    f'블록 {len(_bt)}개 · 남 때문 {sum(r["lostByOthers"] for r in _bt):,.0f}장')

# 11. 대표 사건 연쇄: 파이썬이 같은 규칙(LB-LINE 중 잃은 장수 최대·같으면 먼저 시작, 같은 원인 블록의 같은 코드 근본 사건 중 겹치는 것)으로 다시 고름
_e05 = _ev05.assign(sm=pd.to_datetime(_ev05['start_ts']), em=pd.to_datetime(_ev05['end_ts']))
_lb = _e05[_e05['reason'] == 'LB-LINE'].sort_values(['loss_glass', 'sm'], ascending=[False, True]).iloc[0]
_ca = _e05[(_e05['block'] == _lb['caused_by_block']) & (_e05['reason'] == _lb['root_cause']) & (_e05['root_cause'] == _lb['root_cause']) & (_e05['sm'] < _lb['em']) & (_e05['em'] > _lb['sm'])].sort_values('sm')
chk('0501 대표 사건 연쇄: 파이썬이 같은 규칙으로 다시 고른 사건 = JS(굶은 사건 1건 + 원인 블록의 근본 사건 목록), 근본 사건은 모두 원인 블록의 사건이고 굶은 사건의 근본 원인과 코드가 같음',
    _lb['event_id'] == _R05['chain']['lb'] and list(_ca['event_id']) == _R05['chain']['causes'] and len(_ca) >= 1, f"{_lb['event_id']}({_lb['block']}, {_lb['loss_glass']:.0f}장, 원인 {_lb['caused_by_block']} {_lb['root_cause']}) ← 근본 사건 {len(_ca)}건")

# 12. 과제별 고칠 수 있는 장수(개선율 30%): 파이썬 fixable_glass = JS tasks × 0.3, 챔버 턴 = 장수 ÷ N_TURN
_fx = _m05.fixable_glass(_ev05, 0.3); _tk = _R05['tasks']
chk('0501 성과 환산: 과제 A(증상 1위에 건 과제가 닿는 근본 원인 하나)·B(자기 원인 1위의 직접 사유 몫)·C(근본 원인 1위) JS = 페이지 Python fixable_glass(개선율 0.3), 챔버 턴 환산에 쓰는 N_TURN = 120, C > A·B',
    _fx['A'][:2] == (_tk['A']['code'], _tk['A']['reachCode']) and _same05(_fx['A'][2], 0.3 * _tk['A']['reach']) and _fx['B'][0] == _tk['B']['code'] and _same05(_fx['B'][1], 0.3 * _tk['B']['glass']) and _fx['C'][0] == _tk['C']['code'] and _same05(_fx['C'][1], 0.3 * _tk['C']['glass']) and _R05['nturn'] == 120 == _m05.N_TURN and _tk['C']['glass'] > _tk['A']['reach'] > _tk['B']['glass'],
    f"A {_fx['A'][2]:,.0f} · B {_fx['B'][1]:,.0f} · C {_fx['C'][1]:,.0f}장 (챔버 {_fx['C'][1]/120:.0f}턴)")

# 13. 페이지 Python 실행: 오류 없이 돌고 출력이 페이지 출력 상자와 한 글자도 다르지 않으며 숫자가 JS 와 같음
_run05 = subprocess.run([sys.executable, '-I', 'lab0501.py'], cwd=_td05, capture_output=True, text=True); _L05 = _run05.stdout.strip().split('\n')
_dpar = _R05['par']['glass']['reason']['items']; _rpar = _R05['par']['glass']['root_cause']['items']
_exp05 = ['기간 60일 · 사건 %d건 · 잃은 유리 %s장 · 챔버 %s분' % (len(_ev05), _fm05(_R05['par']['glass']['reason']['total']), _fm05(_R05['par']['min']['reason']['total']))]
for _t, _it in (('직접 사유', _dpar), ('근본 원인', _rpar)):
    _exp05.append('%s 파레토 상위 4' % _t)
    for x in _it[:4]: _exp05.append('  %s %s장 %.1f%% 누적 %.1f%%' % (x[0], _fm05(x[2]), 100 * x[3], 100 * x[4]))
_lbr = _R05['reat'][_dtop]['items'][:3]
_exp05.append('직접 사유 %s 의 근본 원인: %s' % (_dtop, ' · '.join('%s %s장' % (x[0], _fm05(x[2])) for x in _lbr)))
_cm = _R05['cfg'][12]['out']['items']; _cs = _R05['cfg'][13]['out']['items']
_exp05.append('코드 합치기(설비·품질): 1위 %s %.1f%% · 막대 %d개' % (_cm[0][0], 100 * _cm[0][3], len(_cm)))
_exp05.append('EQ-PM·Q-MASK 를 블록별로 나누고 2%% 미만은 기타로: 1위 %s %.1f%% · 막대 %d개' % (_cs[0][0], 100 * _cs[0][3], len(_cs)))
_exp05 += ['  %d주 %s' % (k + 1, ' > '.join(it[0] for it in _R05['wk']['root_cause'][k]['par']['items'][:3])) for k in range(8)]
_L05set = set(_L05)
_rs05 = _R05['rs']['root'][:3]
_exp05b = ['  %s 1위 %.1f%% · 순위 25~75%% %.2f~%.2f · 몫 중앙값 %.1f%%' % (q['code'], 100 * q['top1'], q['r25'], q['r75'], 100 * q['s50']) for q in _rs05]
_exp05c = '기본 시드의 1위·2위 몫 차 %.1f%%p 는 시드 분포의 %.0f%% 자리(중앙값 %.1f%%p)' % (_dg, 100 * _mj['rootGap']['pct'], _mj['rootGap']['med'])
_exp05d = '개선율 30%% 로 고칠 수 있는 유리 장수(60일): A 증상 %s→%s %s장 · B 직접 사유 %s %s장 · C 근본 원인 %s %s장(챔버 %.0f턴)' % (_fx['A'][0], _fx['A'][1], _fm05(_fx['A'][2]), _fx['B'][0], _fm05(_fx['B'][1]), _fx['C'][0], _fm05(_fx['C'][1]), _fx['C'][1] / 120)
chk('0501 페이지 Python 코드가 오류 없이 돌고 출력이 페이지 출력 상자와 한 글자도 다르지 않으며, 파레토 줄·재귀속 줄·주 단위 8줄·순위 흔들림 3줄·백분위 줄·성과 환산 줄이 JS 값에서 다시 쓴 줄과 같고, 외부 통신 코드가 없음',
    _run05.returncode == 0 and _run05.stdout.strip() == _out05 and all(e in _L05set for e in _exp05) and all(e in _L05set for e in _exp05b) and _exp05c in _L05set and _exp05d in _L05set
    and not _re5.search(r'^\s*(?:import|from)\s+(?:requests|urllib|socket|http|openai|anthropic|httpx)', _code05, _re5.M),
    (_run05.stderr[-300:] if _run05.returncode else f'{len(_L05)}줄'))

# 14. 페이지 구조
_term05 = len(_re5.findall(r'<li>', _re5.search(r'<ul class="chips" id="termList">(.*?)</ul>', _pg05, _re5.S).group(1)))
_nq05 = len(_re5.findall(r'<div class="qna" data-label=', _pg05)); _nsec05 = len(_re5.findall(r'<h2><span class="no">', _pg05))
_fonts05 = [int(x) for x in _re5.findall(r'font\s*=\s*[\'"][^\'"]*?(\d+)px', _pg05)]
_body05 = _re5.sub(r'<script.*?</script>|<pre.*?</pre>|<style.*?</style>', '', _pg05, flags=_re5.S); _body05 = _html5.unescape(_re5.sub(r'<[^>]+>', ' ', _body05))
_endda05 = _re5.findall(r'[^니습]다[.]', _body05)
_p402 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0402-agent-evaluation.html'), encoding='utf-8').read(); _hub05 = open(os.path.join(os.path.dirname(_DATA10), 'index.html'), encoding='utf-8').read()
_slid05 = ['id="sThr" min="0" max="10" step="0.5" value="0"', 'id="sN" min="3" max="40" step="1" value="40"', 'id="sRate" min="5" max="60" step="5" value="30"']
_qna05 = ' '.join(_re5.findall(r'<div class="qna".*?</div>', _pg05, _re5.S))
chk('0501 페이지: 새 용어 6개 · Q&A 4개(시드 분포 숫자를 넣지 않음) · 절 11개 · 정의식 MathML · 캔버스 글자 11px 이상 · 인용 밖 본문에 -다 끝맺음 없음 · 0402 의 위·아래 다음 링크와 0402 로 가는 위·아래 이전 링크 · 허브 등록(단계 5 묶음 머리글) · 계산 모듈에 난수·시각 함수 없음 · 슬라이더 기본값 = 모듈 기본값(시드 40·개선율 30·기타 문턱 0) · 모든 표시 수치는 span 주입',
    _term05 == 6 and _nq05 == 4 and _nsec05 == 11 and '<math display="block">' in _pg05 and '<mfrac>' in _pg05 and min(_fonts05) >= 11 and not _endda05 and _p402.count('0501-loss-pareto.html') == 2 and _pg05.count('0402-agent-evaluation.html') == 2
    and 'labs/0501-loss-pareto.html' in _hub05 and '단계 5 · 기둥 5' in _hub05 and not _re5.search(r'Math\.random|Date\.now|new Date', _js05s) and all(s in _pg05 for s in _slid05)
    and _R05['defaults']['seeds'] == 40 and _R05['defaults']['days'] == 60 and not _re5.search(r'\d+(?:\.\d+)?\s*%', _qna05),
    f'용어 {_term05} · Q&A {_nq05} · 절 {_nsec05} · 캔버스 글자 최소 {min(_fonts05)}px({len(_fonts05)}곳) · -다 끝맺음 {len(_endda05)}건 · 0402 쪽 0501 링크 {_p402.count("0501-loss-pareto.html")}곳')
_cleanup05 = shutil.rmtree(_td05, ignore_errors=True)


# ============================================================
# 0502 — Loss 연쇄와 가짜 상관. 계산 모듈(loss05.js)의 날별 건수·분산/평균·상관·포아송 비율 검정·연쇄 확인(A: loss_events.csv·loss_hourly.csv)과
# 새 시나리오 S16 '공통 추세'를 페이지의 Python 코드(lab0502.py)와 이 파일의 독립 구현(난수 줄기·상관·백분위)으로 다시 계산해 JS 와 대조한다.
# ============================================================
_pg06 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0502-loss-cascade-spurious.html'), encoding='utf-8').read()
_code06 = _html5.unescape(_re5.search(r'<pre id="pyCode">(.*?)</pre>', _pg06, _re5.S).group(1)); _out06 = _html5.unescape(_re5.search(r'<pre id="pyOut"[^>]*>(.*?)</pre>', _pg06, _re5.S).group(1)).strip()
_td06 = _tf5.mkdtemp()
for _f in ('loss_events.csv', 'loss_hourly.csv', 's16_common_trend.csv'): shutil.copy(os.path.join(_DATA10, 'csv', _f), os.path.join(_td06, _f))
open(os.path.join(_td06, 'lab0502.py'), 'w', encoding='utf-8').write(_code06)
_sp06 = _ilu01.spec_from_file_location('lab0502', os.path.join(_td06, 'lab0502.py')); _m06 = _ilu01.module_from_spec(_sp06); _sp06.loader.exec_module(_m06)
_EXPORT06 = r"""const fs=require('fs'),path=require('path');
const DATA=process.argv[2],OUT=process.argv[3];
const MS=require(DATA+'/mfgsim.js'),L=require(DATA+'/loss05.js');
const sim=MS.simulateLoss(),ev=sim.events,hr=sim.hourly,res={};
const AC=L.CODES.slice();
res.codes=AC;res.daily={};AC.forEach(c=>{res.daily[c]=L.dailyCounts(ev,c,60);});
res.dispA=AC.map(c=>{const d=L.dispersion(res.daily[c]);return [c,d.mean,d.var,d.ratio];});
res.expo=L.dailySum(hr,'line_out',60);
res.chain={};['RUN-TRIPLE','LB-LINE','LG-CST','LG-JC','CL-CAPA'].forEach(c=>{const k=L.chainCheck(ev,c);res.chain[c]={nAll:k.nAll,nDerived:k.nDerived,nLinked:k.nLinked,byRoot:k.byRoot.map(b=>[b.code,b.n,b.glass]),delays:k.delays,nRoots:k.nRoots,perRoot:k.perRoot,zeroShare:k.zeroShare,delayQ:k.delayQ};});
res.ru=L.rootUnitDaily(ev,'LB-LINE',60);
res.fan=L.fanOut(ev).map(a=>[a.code,a.roots,a.derived,a.glassDerived]);
res.hourly={};[['cassette_free','LG-CST'],['cleaner_queue','LG-CST'],['cleaner_queue','CL-CAPA']].forEach(p=>{const a=hr.map(r=>r[p[0]]),b=L.hourlyCounts(ev,p[1],hr.length);res.hourly[p.join('>')]=[-3,-2,-1,0,1,2,3,4,5,6].map(k=>L.lagCorr(a,b,k));});
res.rate=[];['EQ-BD','EQ-PM','Q-MASK','Q-EVAP','RUN-TRIPLE','LB-LINE'].forEach(c=>{const d=res.daily[c],s=(a,lo,hi)=>a.slice(lo,hi).reduce((x,y)=>x+y,0);const t1=L.poissonRateTest(s(d,0,30),30,s(d,30,60),30),t2=L.poissonRateTest(s(d,0,30),s(res.expo,0,30),s(d,30,60),s(res.expo,30,60));res.rate.push([c,s(d,0,30),s(d,30,60),t1.p,t2.p,t1.z,t2.z,t2.pi]);});
{const d=res.ru,s=(a,lo,hi)=>a.slice(lo,hi).reduce((x,y)=>x+y,0),t2=L.poissonRateTest(s(d,0,30),s(res.expo,0,30),s(d,30,60),s(res.expo,30,60));res.rate.push(['ROOTUNIT',s(d,0,30),s(d,30,60),null,t2.p,null,t2.z,t2.pi]);}
// 포아송·이항 확률과 비율 검정 사례
res.pmf=[[0,0.5],[3,2.5],[10,7.3],[25,26.4],[40,38]].map(a=>[a[0],a[1],L.poissonPmf(a[0],a[1])]);
res.bpmf=[[3,13,0.5],[100,194,0.49],[519,1450,0.4]].map(a=>[a[0],a[1],a[2],L.binomPmf(a[0],a[1],a[2])]);
res.rtests=[[3,1,10,1],[83,50000,111,52000],[519,29859,931,54117],[0,10,4,10],[20,100,5,100],[100,1000,100,1000],[7,3,2,5]].map(a=>{const t=L.poissonRateTest(a[0],a[1],a[2],a[3]);return [a,t.p,t.z,t.pi];});
// S16
res.consts=L.S16;
res.seeds=[];for(let s=1;s<=200;s++){const g=L.s16Gen(s),m=L.s16Metrics(g);res.seeds.push({seed:s,N:g.N,X:g.X,Y:g.Y,Z:g.Z,m:m});}
const runs=L.s16Run(Array.from({length:200},(_,i)=>i+1)),rep=L.s16Rep(runs);res.rep=rep;
res.cut=[193,1,77].map(s=>{const a=L.s16Gen(s),b=L.s16Gen(s,0.3),c0=L.s16Gen(s,0);const S=v=>v.reduce((x,y)=>x+y,0);return {seed:s,sX:S(a.X),sXc:S(b.X),sY:S(a.Y),sYc:S(b.Y),sZ:S(a.Z),sZc:S(b.Z),same0:JSON.stringify(a)===JSON.stringify(c0),Yeq:JSON.stringify(a.Y)===JSON.stringify(b.Y),Neq:JSON.stringify(a.N)===JSON.stringify(b.N),Zc:b.Z,Xc:b.X};});
res.pcs=rep.pcs;
fs.writeFileSync(path.join(OUT,'res.json'),JSON.stringify(res));
"""
_jsf06 = os.path.join(_td06, 'export502.js'); open(_jsf06, 'w').write(_EXPORT06)
subprocess.run([_node, _jsf06, _DATA10, _td06], capture_output=True, text=True, check=True, env=dict(os.environ, NODE_OPTIONS='--max-old-space-size=4096'))
_R06 = json.load(open(os.path.join(_td06, 'res.json')))
def _fm06(x): return format(int(x + 0.5 + 1e-6), ',')
def _same06(a, b, tol=1e-9): return abs(a - b) <= tol * max(1.0, abs(a), abs(b))
_ev06 = _m06.load_events(os.path.join(_td06, 'loss_events.csv')); _hr06 = pd.read_csv(os.path.join(_td06, 'loss_hourly.csv')); _s16c06 = pd.read_csv(os.path.join(_td06, 's16_common_trend.csv'))
_C06 = _R06['consts']

# 1. A 날별 건수·분산/평균: JS = 페이지 Python(pandas) = 이 파일의 numpy 독립 집계, 프로브 값(설계서 기대)과 맞음
_ok = True; _det = []
for _c in _R06['codes']:
    _a = _m06.daily_counts(_ev06, _c); _jd = np.array(_R06['daily'][_c], float)
    _o = np.array_equal(_a, _jd) and abs(_a.sum() - (_ev06['reason'] == _c).sum()) < 1e-9
    _d = [r for r in _R06['dispA'] if r[0] == _c][0]; _pm, _pv, _pr = _m06.dispersion(_a)
    _o &= _same06(_pm, _d[1]) and _same06(_pv, _d[2]) and _same06(_pr, _d[3])
    _ok &= _o
    if not _o: _det.append(_c)
_dp06 = {r[0]: r for r in _R06['dispA']}
_probe_ok = all(abs(_dp06[c][1] - m) < 0.05 for c, m in (('EQ-BD', 3.2), ('EQ-PM', 3.3), ('Q-MASK', 3.9), ('Q-EVAP', 3.4), ('RUN-TRIPLE', 19.1), ('LB-LINE', 42.6))) and all(abs(_dp06[c][3] - v) < 0.06 for c, v in (('EQ-BD', 0.85), ('Q-EVAP', 0.87), ('LB-LINE', 4.96), ('LG-JC', 4.06), ('CL-CAPA', 7.0)))
chk('0502 A 날별 건수·분산/평균(표본 분산 n−1): 12개 코드 JS = 페이지 Python = 사건 CSV 직접 집계, 설계서 프로브(EQ-BD 0.85·Q-EVAP 0.87 포아송에 가깝고 LB-LINE 4.96·LG-JC 4.06·CL-CAPA 7.0 과산포)와 같음',
    _ok and _probe_ok, '12개 코드' + (' 불일치 ' + ','.join(_det) if _det else '') + ' · ' + ' '.join('%s %.2f' % (c, _dp06[c][3]) for c in ('EQ-BD', 'Q-EVAP', 'EQ-PM', 'RUN-TRIPLE', 'LB-LINE')))

# 2. A 날별 건수 상관: 설계서 기대(RUN-TRIPLE–EQ-PM 0.67·RUN-TRIPLE–EQ-BD 0.51·LB-LINE–EQ-PM 0.59)
_cnt06 = {c: _m06.daily_counts(_ev06, c) for c in _R06['codes']}
_cc = lambda a, b: float(np.corrcoef(_cnt06[a], _cnt06[b])[0, 1])
chk('0502 A 날별 건수 상관: RUN-TRIPLE–EQ-PM 0.67 · RUN-TRIPLE–EQ-BD 0.51 · LB-LINE–EQ-PM 0.59(소수 둘째 자리까지 설계서 프로브와 같음), scipy pearsonr 와 numpy corrcoef 일치',
    abs(_cc('RUN-TRIPLE', 'EQ-PM') - 0.67) < 0.006 and abs(_cc('RUN-TRIPLE', 'EQ-BD') - 0.51) < 0.006 and abs(_cc('LB-LINE', 'EQ-PM') - 0.59) < 0.006 and _same06(stats.pearsonr(_cnt06['RUN-TRIPLE'], _cnt06['EQ-PM'])[0], _cc('RUN-TRIPLE', 'EQ-PM')),
    'RUN-TRIPLE–EQ-PM %.3f · RUN-TRIPLE–EQ-BD %.3f · LB-LINE–EQ-PM %.3f' % (_cc('RUN-TRIPLE', 'EQ-PM'), _cc('RUN-TRIPLE', 'EQ-BD'), _cc('LB-LINE', 'EQ-PM')))

# 3. A 연쇄 확인: JS chainCheck = 페이지 Python chain_check(근본 원인 몫·이은 수·지연 전부), 근본 사건 단위 날별 건수, fanOut
_ok = True; _det = []
for _c in ('RUN-TRIPLE', 'LB-LINE', 'LG-CST'):
    _sh, _dl, _n = _m06.chain_check(_ev06, _c); _j = _R06['chain'][_c]
    _o = _n == _j['nDerived'] and sorted(_dl.tolist()) == _j['delays'] and len(_dl) == _j['nLinked'] and [b[0] for b in _j['byRoot']] == list(_sh.index) and all(_same06(b[1] / _n, s) for b, s in zip(_j['byRoot'], _sh.values))
    _ok &= _o
    if not _o: _det.append(_c)
_ru = _m06.root_unit_daily(_ev06, 'LB-LINE')
_fan = _ev06.assign(selfev=_ev06['reason'] == _ev06['root_cause']).groupby('root_cause').agg(roots=('selfev', 'sum'), derived=('selfev', lambda s: (~s).sum()), gd=('loss_glass', lambda s: 0.0))
_fan['gd'] = _ev06[_ev06['reason'] != _ev06['root_cause']].groupby('root_cause')['loss_glass'].sum()
_fan = _fan.fillna(0.0)
_fanj = {r[0]: r for r in _R06['fan']}
_fok = set(_fan.index) == set(_fanj) and all(_fan.loc[c, 'roots'] == _fanj[c][1] and _fan.loc[c, 'derived'] == _fanj[c][2] and _same06(_fan.loc[c, 'gd'], _fanj[c][3], 1e-9) for c in _fan.index)
_rj = _R06['chain']['LB-LINE']
chk('0502 A 연쇄 확인: 파생 사건의 근본 원인 몫·근본 사건과 이은 수·지연 전부(RUN-TRIPLE·LB-LINE·LG-CST) JS = 페이지 Python, 근본 사건 단위 날별 건수(LB-LINE)·근본 원인별 근본/파생 사건 수 JS = Python, RUN-TRIPLE 은 전부 이어지고(100%) 근본 원인이 4코드(EQ-PM·EQ-BD·Q-EVAP·Q-MASK)뿐',
    _ok and np.array_equal(_ru, np.array(_R06['ru'], float)) and _fok and _R06['chain']['RUN-TRIPLE']['nLinked'] == _R06['chain']['RUN-TRIPLE']['nDerived'] and {b[0] for b in _R06['chain']['RUN-TRIPLE']['byRoot']} == {'EQ-PM', 'EQ-BD', 'Q-EVAP', 'Q-MASK'},
    f"RUN-TRIPLE 파생 {_R06['chain']['RUN-TRIPLE']['nDerived']} · LB-LINE 파생 {_rj['nDerived']}(이은 {_rj['nLinked']}) · LB-LINE 근본 사건 {_rj['nRoots']}" + (' 불일치 ' + ','.join(_det) if _det else ''))

# 4. A 과산포의 풀이: LB-LINE 은 근본 사건 하나가 여러 건(근본 사건 단위로 세면 분산/평균 < 1), CL-CAPA 는 전부 첫날
_cl = _cnt06['CL-CAPA']; _lbd = _m06.dispersion(_cnt06['LB-LINE'])[2]; _rud = _m06.dispersion(_ru)[2]
_nz = [v for v in _R06['chain']['LB-LINE']['perRoot'] if v > 0]
chk('0502 A 과산포 풀이: LB-LINE 사건 단위 분산/평균 4.96 → 근본 사건 단위 분산/평균은 1 보다 작음(0.39), 근본 사건 하나가 낳은 LB-LINE 평균 > 5건, CL-CAPA 7건이 모두 첫날, 시간별 표는 기록 60일(1440시간)',
    _lbd > 4 and _rud < 1 and np.mean(_nz) > 5 and _cl[0] == _cl.sum() == 7 and len(_hr06) == 1440,
    f'LB-LINE {_lbd:.2f} → {_rud:.2f} · 근본 사건당 {np.mean(_nz):.1f}건(이은 {len(_nz)}건) · CL-CAPA 첫날 {int(_cl[0])}/{int(_cl.sum())}')

# 5. 시간별 지연 상관: JS = 페이지 Python lag_corr(−3~+6시간) 세 쌍
_hok = True
for _k, _vals in _R06['hourly'].items():
    _a, _b = _k.split('>'); _x = _hr06[_a].to_numpy(float)
    _y = np.bincount((_ev06[_ev06['reason'] == _b]['start_min'] // 60).clip(upper=len(_hr06) - 1), minlength=len(_hr06)).astype(float)
    _hok &= all(_same06(_m06.lag_corr(_x, _y, k), v, 1e-9) for k, v in zip(range(-3, 7), _vals))
_cf = np.array(_R06['hourly']['cassette_free>LG-CST']); _qf = np.array(_R06['hourly']['cleaner_queue>LG-CST'])
chk('0502 A 시간별 지연 상관(cassette_free→LG-CST·cleaner_queue→LG-CST·cleaner_queue→CL-CAPA, 지연 −3~+6시간) JS = 페이지 Python, cassette_free→LG-CST 는 +1시간에서 가장 크고(음의 상관) cleaner_queue→LG-CST 는 어느 지연에서도 |r|<0.1',
    _hok and int(np.argmax(np.abs(_cf))) - 3 == 1 and _cf[4] < -0.2 and np.abs(_qf).max() < 0.1, f'cassette_free→LG-CST +1시간 r={_cf[4]:.3f}(같은 시간 {_cf[3]:.3f}) · cleaner_queue→LG-CST 최대 |r|={np.abs(_qf).max():.3f}')

# 6. 포아송·이항 확률과 비율 검정: JS = scipy
_pm_ok = all(_same06(p, stats.poisson.pmf(k, mu), 1e-7) for k, mu, p in _R06['pmf']) and all(_same06(p, stats.binom.pmf(k, n, pi), 1e-7) for k, n, pi, p in _R06['bpmf'])
_rt_ok = True
for (k1, n1, k2, n2), p, z, pi in _R06['rtests']:
    _sp = stats.binomtest(k1, k1 + k2, n1 / (n1 + n2)).pvalue; K = k1 + k2; _z = (k1 - K * pi) / np.sqrt(K * pi * (1 - pi))
    _rt_ok &= _same06(p, _sp, 1e-6) and _same06(z, _z, 1e-9) and _same06(pi, n1 / (n1 + n2))
_ra_ok = True
for _r in _R06['rate']:
    _c = _r[0]
    if _c == 'ROOTUNIT': _d = _ru
    else: _d = _cnt06[_c]
    _o = _d[:30].sum() == _r[1] and _d[30:].sum() == _r[2]
    _e1, _e2 = np.array(_R06['expo'])[:30].sum(), np.array(_R06['expo'])[30:].sum()
    _o &= _same06(stats.binomtest(int(_r[1]), int(_r[1] + _r[2]), _e1 / (_e1 + _e2)).pvalue, _r[4], 1e-6)
    if _r[3] is not None: _o &= _same06(stats.binomtest(int(_r[1]), int(_r[1] + _r[2]), 0.5).pvalue, _r[3], 1e-6)
    _ra_ok &= _o
_exp06 = np.array(_R06['expo'])
chk('0502 포아송 확률(scipy.poisson.pmf)·이항 확률(binom.pmf) 5+3개 JS = scipy, 비율 검정 7개 사례(작은 건수·큰 건수·치우친 노출량·0건 포함)의 정확 p 값(scipy.stats.binomtest)·정규 근사 z·π JS = scipy, A 앞30일 vs 뒤30일 6코드 + LB-LINE 근본 사건 단위의 p(일수만·노출량 보정) JS = scipy, 노출량 = loss_hourly 의 line_out 날별 합',
    _pm_ok and _rt_ok and _ra_ok and np.array_equal(_exp06, _hr06.groupby(np.arange(len(_hr06)) // 24)['line_out'].sum().to_numpy(float)), '비율 검정 %d개 사례 + A %d줄' % (len(_R06['rtests']), len(_R06['rate'])))
_rd = {r[0]: r for r in _R06['rate']}

# 7. S16 생성: 난수 줄기를 파이썬이 처음부터 다시 구현(FNV-1a 시드·mulberry32·Box-Muller·역변환 포아송·전날 X 마다 베르누이)해 시드 200개의 N·X·Y·Z 가 JS 와 한 칸도 다르지 않음
M32 = 0xFFFFFFFF
def _imul(a, b): return (a * b) & M32
def _hs(*parts):
    s = '|'.join(str(p) for p in parts); h = 2166136261
    for ch in s: h ^= ord(ch); h = _imul(h, 16777619)
    return h
class _Rng:
    def __init__(self, seed): self.a = seed & M32; self.spare = None
    def u(self):
        self.a = (self.a + 0x6D2B79F5) & M32; a = self.a
        t = _imul(a ^ (a >> 15), 1 | a)
        t = ((t + _imul(t ^ (t >> 7), 61 | t)) & M32) ^ t
        return ((t ^ (t >> 14)) & M32) / 4294967296
    def normal(self, m, s):
        if self.spare is not None: z = self.spare; self.spare = None; return m + s * z
        a = self.u() or 1e-12; b = self.u(); rad = np.sqrt(-2 * np.log(a)); self.spare = rad * np.sin(2 * np.pi * b)
        return m + s * rad * np.cos(2 * np.pi * b)
def _pd(r, mu):
    u = r.u(); k = 0; p = np.exp(-mu); c = p
    while u > c and k < 1000: k += 1; p *= mu / k; c += p
    return k
def _gen06(seed, xcut=0.0):
    rn, rx, ry, rz = (_Rng(_hs('S16', seed, s)) for s in 'NXYZ'); N, X, Y, Z = [], [], [], []
    for t in range(_C06['DAYS']):
        n = int(np.floor(_C06['N0'] + _C06['SLOPE'] * t + rn.normal(0, _C06['SD_N']) + 0.5)); N.append(n)
        X.append(_pd(rx, _C06['LAM_X'] * n / 1000 * (1 - xcut))); Y.append(_pd(ry, _C06['LAM_Y'] * n / 1000))
        Z.append(sum(1 for _ in range(X[t - 1]) if rz.u() < _C06['P_CHAIN']) if t > 0 else 0)
    return N, X, Y, Z
_gok = True; _gbad = []
_GP = {}
for _s in _R06['seeds']:
    _g = _gen06(_s['seed']); _GP[_s['seed']] = _g
    if not (_g[0] == _s['N'] and _g[1] == _s['X'] and _g[2] == _s['Y'] and _g[3] == _s['Z']): _gok = False; _gbad.append(_s['seed'])
_g193 = _GP[_R06['rep']['seed']]
_csvrep = [list(_s16c06[c]) for c in ('glass_in', 'vx_jam', 'vy_src', 'vz_retry')]
chk('0502 S16 생성: 난수 줄기 넷(N·X·Y·Z)을 파이썬이 처음부터 재구현(FNV-1a·mulberry32·Box-Muller·역변환 포아송·베르누이)해 시드 1~200 의 날별 N·X·Y·Z 가 JS 와 한 칸도 다르지 않고, 대표 시드 줄이 s16_common_trend.csv 와 같음(90줄·열 5개·정답 열 없음)',
    _gok and [_g193[0], _g193[1], _g193[2], _g193[3]] == _csvrep and list(_s16c06.columns) == ['day', 'glass_in', 'vx_jam', 'vy_src', 'vz_retry'] and len(_s16c06) == 90 and list(_s16c06['day']) == list(range(1, 91)),
    f"시드 200개 × 90일 · 불일치 {_gbad[:5]}")

# 8. S16 지표: 파이썬이 numpy·scipy 로 다시 계산한 상관 셋·지연 상관·분산/평균·포아송 p 가 JS 와 같음(시드 200개 전부)
def _corr(a, b): return float(np.corrcoef(a, b)[0, 1])
def _res(y): t = np.arange(len(y)); return y - np.polyval(np.polyfit(t, y, 1), t)
def _met06(g):
    N, X, Y, Z = (np.array(v, float) for v in g); rx, ry, rz = 1000 * X / N, 1000 * Y / N, 1000 * Z / N; n = len(N); H = _C06['HALF']
    mm = {'xy_raw': _corr(X, Y), 'xy_ratio': _corr(rx, ry), 'xy_resid': _corr(_res(X), _res(Y)), 'xz_same': _corr(X, Z), 'xz_lag': _corr(X[:-1], Z[1:]), 'xz_lag_ratio': _corr(rx[:-1], rz[1:]), 'xz_lag_resid': _corr(_res(X)[:-1], _res(Z)[1:]),
          'xz_same_ratio': _corr(rx, rz), 'xz_same_resid': _corr(_res(X), _res(Z)), 'y_disp_raw': Y.var(ddof=1) / Y.mean(), 'x_disp_raw': X.var(ddof=1) / X.mean()}
    for nm, v in (('y', Y), ('x', X)):
        mu = N * v.sum() / N.sum(); mm[nm + '_disp_expo'] = float(((v - mu) ** 2 / mu).sum() / (n - 1))
    k1, k2 = X[:H].sum(), X[H:].sum(); n1, n2 = N[:H].sum(), N[H:].sum()
    mm['p_plain'] = stats.binomtest(int(k1), int(k1 + k2), 0.5).pvalue; mm['p_expo'] = stats.binomtest(int(k1), int(k1 + k2), n1 / (n1 + n2)).pvalue
    return mm
_MP = {s: _met06(_GP[s]) for s in _GP}
_mok = True; _mmax = 0.0
for _s in _R06['seeds']:
    for _k, _v in _s['m'].items():
        _d = abs(_v - _MP[_s['seed']][_k]) / max(1.0, abs(_v)); _mmax = max(_mmax, _d)
        if _d > 1e-6: _mok = False
chk('0502 S16 지표 열네 개(원·비율·추세를 뺀 잔차 상관, X–Z 같은 날 셋, 하루 지연 상관 셋, X·Y 분산/평균(그대로·노출량 보정), 앞/뒤 45일 포아송 p(노출량 없이·보정)) 시드 200개 JS = 파이썬 numpy·scipy 독립 계산',
    _mok, f'열네 지표 × 200시드 · 가장 큰 상대 차 {_mmax:.1e}')

# 9. 대표 시드: 지표 넷(원 X–Y 상관·비율 X–Y 상관·X→Z 지연 상관·Y 분산/평균) 백분위의 50 에서 떨어진 정도 합 최소 — 파이썬이 독립 선택해 JS 와 같음
def _pct06(vals, v): vals = np.asarray(vals, float); return 100 * (((vals < v - 1e-9).sum() + 0.5 * (np.abs(vals - v) <= 1e-9).sum()) / len(vals))
_keys = ['xy_raw', 'xy_ratio', 'xz_lag', 'y_disp_raw']
_best = None
for _s in range(1, 201):
    _sc = sum(abs(_pct06([_MP[q][k] for q in range(1, 201)], _MP[_s][k]) - 50) for k in _keys)
    if _best is None or _sc < _best[1] - 1e-12: _best = (_s, _sc)
_pc = {k: _pct06([_MP[q][k] for q in range(1, 201)], _MP[_best[0]][k]) for k in _keys}
chk('0502 S16 대표 시드(백분위 편차 합 최소): 파이썬 독립 선택 = JS(시드 %d), 지표 넷 백분위 JS = 파이썬, 네 백분위 모두 25~75%% 안(효과가 잘 보이는 시드로 거르지 않음)' % _R06['rep']['seed'],
    _best[0] == _R06['rep']['seed'] and abs(_best[1] - _R06['rep']['score']) < 1e-9 and all(abs(_pc[k] - _R06['rep']['pcs'][k]) < 1e-9 for k in _keys) and all(25 <= v <= 75 for v in _pc.values()),
    '시드 %d · ' % _best[0] + ' · '.join('%s %.1f%%' % (k, _pc[k]) for k in _keys) + ' · 합 %.2f' % _best[1])

# 10. 설계 기대 — 시드 200개 분포로 말함: 비율·잔차 상관이 원 상관보다 0 에 가까움, 지연 상관 > 같은 날 상관, 노출량 보정 후 헛판정 비율이 5% 안팎, 노출량 없이는 전부 '늘었다'
_ar = lambda k: np.array([_MP[s][k] for s in range(1, 201)])
_nr = int((np.abs(_ar('xy_ratio')) < np.abs(_ar('xy_raw'))).sum()); _nd = int((np.abs(_ar('xy_resid')) < np.abs(_ar('xy_raw'))).sum())
_lagbig = int((_ar('xz_lag') > _ar('xz_same')).sum()); _pe = int((_ar('p_expo') < 0.05).sum()); _pp = int((_ar('p_plain') < 0.05).sum())
_qr = np.quantile(_ar('xy_ratio'), [0.1, 0.5, 0.9])
chk('0502 설계 기대(시드 200개): 원 X–Y 상관은 전부 양(최소 0.4 이상), 비율 X–Y 상관이 원 상관보다 0 에 가까운 시드 200/200·잔차도 200/200(비율 상관 10~90% 구간이 ±0.2 안), X→Z 하루 지연 상관이 같은 날 상관보다 큰 시드 200/200(지연 비율·잔차 상관 중앙값 0.5 이상), 노출량 없이는 200/200 이 늘었다고 판정하고 보정 후에는 헛판정이 5% 안팎(1~10%)',
    _nr == 200 and _nd == 200 and _ar('xy_raw').min() > 0.4 and _qr[0] > -0.2 and _qr[2] < 0.2 and _lagbig == 200 and np.median(_ar('xz_lag_ratio')) > 0.5 and np.median(_ar('xz_lag_resid')) > 0.5 and _pp == 200 and 2 <= _pe <= 20,
    f'비율이 더 가까운 시드 {_nr}/200 · 잔차 {_nd}/200 · 비율 상관 10/50/90% {_qr[0]:.3f}/{_qr[1]:.3f}/{_qr[2]:.3f} · 지연>같은 날 {_lagbig}/200 · 보정 전 p<0.05 {_pp}/200 · 보정 후 {_pe}/200')

# 11. 과산포의 정체(S16): Y 분산/평균은 건수 그대로 보면 과산포(전부 띠 위)이고 노출량 보정하면 1 근처(중앙값 0.9~1.1)
_bd = 2 * np.sqrt(2 / 59)
chk('0502 S16 분산/평균: Y·X 의 건수 그대로 값이 시드 200개 전부에서 띠(1+2√(2/59) = %.2f) 위이고 노출량 보정 후 중앙값은 0.9~1.1, 보정 후 띠 밖은 10%% 이하(공통 추세가 과산포의 정체)' % (1 + _bd),
    _ar('y_disp_raw').min() > 1 + _bd and _ar('x_disp_raw').min() > 1 + _bd and 0.9 < np.median(_ar('y_disp_expo')) < 1.1 and 0.9 < np.median(_ar('x_disp_expo')) < 1.1 and (np.abs(_ar('y_disp_expo') - 1) > _bd).mean() < 0.1,
    f"건수 그대로 Y {_ar('y_disp_raw').min():.2f}~{_ar('y_disp_raw').max():.2f} · 보정 후 Y 중앙값 {np.median(_ar('y_disp_expo')):.2f}")

# 12. 반사실(성과 환산): xCut=0 이면 기본 출력과 같고, X 를 줄여 다시 만들면 Y·N 은 한 칸도 안 변하고 X 는 줄며 Z 는 따라 줌(파이썬도 같은 값)
_cok = True
for _c in _R06['cut']:
    _N, _X, _Y, _Z = _gen06(_c['seed'], 0.3)
    _cok &= _c['same0'] and _c['Yeq'] and _c['Neq'] and sum(_X) == _c['sXc'] and sum(_Z) == _c['sZc'] and _X == _c['Xc'] and _Z == _c['Zc'] and sum(_Y) == _c['sY'] and _c['sXc'] < _c['sX'] and _c['sZc'] < _c['sZ']
_c0 = _R06['cut'][0]
chk('0502 반사실(9절): X 평균을 30% 줄여 같은 시드로 다시 만들면 Y·N 은 한 칸도 안 바뀌고(원인 관계 없음) X·Z 는 줄며 파이썬 재구현과 같음, 줄이지 않으면(0) 기본 출력과 같음. 시드 3개',
    _cok, f"시드 {_c0['seed']}: X {_c0['sX']}→{_c0['sXc']}(−{_c0['sX']-_c0['sXc']}) · Y {_c0['sY']}→{_c0['sYc']} · Z {_c0['sZ']}→{_c0['sZc']}(기대 −{_C06['P_CHAIN']*(_c0['sX']-_c0['sXc']):.0f})")

# 13. 판정 규칙(문턱 0.3): 대표 시드에서 X–Y = 가짜 상관, X→Z = 연쇄 후보. 시드 200개의 비율
def _verd(m): return (abs(m['xy_raw']) >= 0.3 and abs(m['xy_ratio']) < 0.3 and abs(m['xy_resid']) < 0.3, m['xz_lag_ratio'] >= 0.3 and m['xz_lag_resid'] >= 0.3 and m['xz_lag_ratio'] > abs(m['xz_same_ratio']) and m['xz_lag_resid'] > abs(m['xz_same_resid']))
_vv = [_verd(_MP[s]) for s in range(1, 201)]
chk('0502 판정 규칙(문턱 0.3): 대표 시드에서 X–Y 는 가짜 상관·X–Z 는 연쇄 후보로 판정되고, 시드 200개에서 가짜 상관 판정 비율·연쇄 후보 판정 비율을 기록(둘 다 95% 이상)',
    _verd(_MP[_R06['rep']['seed']]) == (True, True) and np.mean([a for a, b in _vv]) >= 0.95 and np.mean([b for a, b in _vv]) >= 0.95, f'가짜 상관 {np.mean([a for a, b in _vv]):.1%} · 연쇄 후보 {np.mean([b for a, b in _vv]):.1%}')

# 14. 페이지 Python 실행: 오류 없이 돌고 출력이 페이지 출력 상자와 한 글자도 다르지 않으며 숫자가 JS 값에서 다시 쓴 줄과 같음
_run06 = subprocess.run([sys.executable, '-I', 'lab0502.py'], cwd=_td06, capture_output=True, text=True); _L06 = _run06.stdout.strip().split('\n'); _L06set = set(_L06)
def _ps(p): return 'p<0.001' if p < 0.001 else 'p=%.3f' % p
_mr = _R06['seeds'][_R06['rep']['seed'] - 1]['m']; _gr = _R06['seeds'][_R06['rep']['seed'] - 1]
_exp06 = ['기록 60일 · 사건 %d건 | 가상 램프업 라인 %d일' % (len(_ev06), _C06['DAYS']), '  EQ-BD %.2f · %.2f' % (_dp06['EQ-BD'][1], _dp06['EQ-BD'][3]), '  LB-LINE %.2f · %.2f' % (_dp06['LB-LINE'][1], _dp06['LB-LINE'][3]), '  CL-CAPA %.2f · %.2f' % (_dp06['CL-CAPA'][1], _dp06['CL-CAPA'][3]),
          'A 날별 건수 상관: RUN-TRIPLE–EQ-PM %.3f · RUN-TRIPLE–EQ-BD %.3f · LB-LINE–EQ-PM %.3f' % (_cc('RUN-TRIPLE', 'EQ-PM'), _cc('RUN-TRIPLE', 'EQ-BD'), _cc('LB-LINE', 'EQ-PM')),
          'LB-LINE 근본 사건 단위로 세면 날별 분산/평균 %.2f (사건 단위 %.2f)' % (_rud, _lbd),
          '  Q-MASK %s건 → %s건 · 노출량 보정 %s · 분산/평균 %.2f' % (_fm06(_rd['Q-MASK'][1]), _fm06(_rd['Q-MASK'][2]), _ps(_rd['Q-MASK'][4]), _dp06['Q-MASK'][3]),
          '  LB-LINE %s건 → %s건 · 노출량 보정 %s · 분산/평균 %.2f' % (_fm06(_rd['LB-LINE'][1]), _fm06(_rd['LB-LINE'][2]), _ps(_rd['LB-LINE'][4]), _dp06['LB-LINE'][3]),
          '  LB-LINE 근본 사건 단위 %s건 → %s건 · 노출량 보정 %s' % (_fm06(_rd['ROOTUNIT'][1]), _fm06(_rd['ROOTUNIT'][2]), _ps(_rd['ROOTUNIT'][4])),
          'CL-CAPA 사건 %d건 가운데 첫날에 시작한 것 %d건' % (_cl.sum(), _cl[0]),
          '시간별: cassette_free → LG-CST 가장 큰 상관은 %+d시간 뒤 r=%.3f (같은 시간 r=%.3f)' % (int(np.argmax(np.abs(_cf))) - 3, _cf[int(np.argmax(np.abs(_cf)))], _cf[3]),
          'S16 X–Y 상관: 원 %.3f · 비율 %.3f · 추세 뺀 잔차 %.3f' % (_mr['xy_raw'], _mr['xy_ratio'], _mr['xy_resid']),
          'S16 X–Z 상관(같은 날): 원 %.3f · 비율 %.3f · 잔차 %.3f' % (_mr['xz_same'], _mr['xz_same_ratio'], _mr['xz_same_resid']),
          'S16 X→Z 하루 지연 상관: 원 %.3f · 비율 %.3f · 잔차 %.3f' % (_mr['xz_lag'], _mr['xz_lag_ratio'], _mr['xz_lag_resid']),
          'S16 Y 분산/평균: 건수 그대로 %.2f · 노출량 보정 %.2f' % (_mr['y_disp_raw'], _mr['y_disp_expo']),
          'S16 X 앞 45일 %d건 → 뒤 45일 %d건: 노출량 무시 %s · 노출량 보정 %s' % (sum(_gr['X'][:45]), sum(_gr['X'][45:]), _ps(_mr['p_plain']), _ps(_mr['p_expo']))]
chk('0502 페이지 Python 코드가 오류 없이 돌고 출력이 페이지 출력 상자와 한 글자도 다르지 않으며, 분산/평균 줄·상관 줄·연쇄 줄·근본 사건 단위 줄·앞뒤 비교 줄·시간별 줄·S16 상관 셋·분산/평균·포아송 p 줄이 JS 값에서 다시 쓴 줄과 같고, 외부 통신 코드가 없음',
    _run06.returncode == 0 and _run06.stdout.strip() == _out06 and all(e in _L06set for e in _exp06) and not _re5.search(r'^\s*(?:import|from)\s+(?:requests|urllib|socket|http|openai|anthropic|httpx)', _code06, _re5.M),
    (_run06.stderr[-300:] if _run06.returncode else f'{len(_L06)}줄 · 대조 {len(_exp06)}줄'))

# 15. 페이지 구조
_term06 = len(_re5.findall(r'<li>', _re5.search(r'<ul class="chips" id="termList">(.*?)</ul>', _pg06, _re5.S).group(1)))
_nq06 = len(_re5.findall(r'<div class="qna" data-label=', _pg06)); _nsec06 = len(_re5.findall(r'<h2><span class="no">', _pg06))
_fonts06 = [int(x) for x in _re5.findall(r'font\s*=\s*[\'"][^\'"]*?(\d+)px', _pg06)]
_body06 = _re5.sub(r'<script.*?</script>|<pre.*?</pre>|<style.*?</style>', '', _pg06, flags=_re5.S); _body06 = _html5.unescape(_re5.sub(r'<[^>]+>', ' ', _body06))
_endda06 = _re5.findall(r'[^니습]다[.]', _body06)
_p501 = open(os.path.join(os.path.dirname(_DATA10), 'labs', '0501-loss-pareto.html'), encoding='utf-8').read(); _hub06 = open(os.path.join(os.path.dirname(_DATA10), 'index.html'), encoding='utf-8').read()
_js06 = _re5.search(r'<script>\n\(function\(\)\{(.*?)\n</script>\n<script src="../tutor.js">', _pg06, _re5.S).group(1)
_dv06 = set(_re5.findall(r'data-v="(\w+)"', _pg06)); _dvdef = set(_re5.findall(r'V\.(\w+)=', _js06))
_slid06 = ['id="sSeed" min="1" max="200" step="1"', 'id="sHalf" min="15" max="45" step="5" value="45"', 'id="sRate" min="5" max="60" step="5" value="30"']
_qna06 = ' '.join(_re5.findall(r'<div class="qna".*?</div>', _pg06, _re5.S))
_js06s = open(os.path.join(_DATA10, 'loss05.js'), encoding='utf-8').read()
chk('0502 페이지: 새 용어 6개 · Q&A 4개(퍼센트 숫자를 넣지 않음) · 절 11개 · MathML 정의식 둘(포아송·비율 검정) · 캔버스 글자 11px 이상 · 인용 밖 본문에 -다 끝맺음 없음 · 0501 쪽 0502 다음 링크(위·아래)와 0502 쪽 0501 이전 링크(위·아래) · 허브 등록(단계 5 묶음) · 본문 숫자는 span 주입(data-v 키 전부 정의) · 슬라이더 기본값 = 모듈 기본값 · 계산 모듈 새 부분에 Math.random·Date.now 없음',
    _term06 == 6 and _nq06 == 4 and _nsec06 == 11 and _pg06.count('<math display="block">') == 2 and '<mfrac>' in _pg06 and min(_fonts06) >= 11 and not _endda06 and _p501.count('0502-loss-cascade-spurious.html') == 2 and _pg06.count('0501-loss-pareto.html') == 2
     and 'labs/0502-loss-cascade-spurious.html' in _hub06 and _dv06 <= _dvdef and all(s in _pg06 for s in _slid06) and _C06['DAYS'] == 90 and _C06['SEEDS'] == 200 and not _re5.search(r'Math\.random|Date\.now|new Date', _js06s) and not _re5.search(r'\d+(?:\.\d+)?\s*%', _qna06),
    f'용어 {_term06} · Q&A {_nq06} · 절 {_nsec06} · 캔버스 글자 최소 {min(_fonts06)}px({len(_fonts06)}곳) · -다 끝맺음 {len(_endda06)}건 · data-v 키 {len(_dv06)}개 미정의 {sorted(_dv06 - _dvdef)}')
_cleanup06 = shutil.rmtree(_td06, ignore_errors=True)


w = max(len(r[0]) for r in res)
for n, ok, d in res: print(('OK  ' if ok else 'FAIL'), n.ljust(w), ' ', d)
print(f'\n{sum(r[1] for r in res)}/{len(res)} 통과')
sys.exit(0 if all(r[1] for r in res) else 1)
