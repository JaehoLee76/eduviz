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

w = max(len(r[0]) for r in res)
for n, ok, d in res: print(('OK  ' if ok else 'FAIL'), n.ljust(w), ' ', d)
print(f'\n{sum(r[1] for r in res)}/{len(res)} 통과')
sys.exit(0 if all(r[1] for r in res) else 1)
