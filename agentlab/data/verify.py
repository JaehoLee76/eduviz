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
