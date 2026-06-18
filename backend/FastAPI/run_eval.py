"""
Self-contained evaluation script — replicates evaluation_service.py logic
using the token-overlap fallback (no sentence-transformers required).
Multi-signal scoring mirrors bert_matching_service._score_with_overlap().
Outputs Precision@K, Recall@K, NDCG@K, MRR for K in {1,3,5}.
"""

import json
import math
import re
from pathlib import Path

# ── dataset paths ────────────────────────────────────────────────────────────
BASE = Path(__file__).resolve().parent / "app" / "data"
EVAL_PATH = BASE / "evaluation_dataset.json"

# ── signal weights (from bert_matching_service.py) ───────────────────────────
W_SEMANTIC    = 0.40
W_SKILL_F1    = 0.25
W_BUDGET      = 0.15
W_EXPERIENCE  = 0.10
W_AVAILABILITY = 0.10

EXPERIENCE_RANK = {
    "entry":0,"junior":0,"intermediate":1,"mid":1,
    "senior":2,"expert":3,"lead":3,"principal":4,
}
SENIORITY_WORDS = {
    "intern":0,"junior":0,"entry":0,"mid":1,"intermediate":1,
    "senior":2,"lead":3,"expert":3,"principal":4,"architect":4,
}
AVAILABILITY_FULL   = {"full","full-time","fulltime","40h","40 hours"}
AVAILABILITY_PART   = {"part","part-time","parttime","20h","20 hours","half"}
AVAILABILITY_HOURLY = {"hourly","contract","freelance","flexible"}


# ── text helpers ──────────────────────────────────────────────────────────────
def tokenize(text):
    return re.findall(r"[a-zA-Z0-9\+\#\.]+", text.lower())

def norm_skill(s):
    return re.sub(r"\s+", " ", str(s).strip().lower())

def proposal_text(p):
    title  = str(p.get("title",""))
    desc   = str(p.get("description",""))
    skills = ", ".join(str(s) for s in (p.get("required_skills") or []))
    timeline = str(p.get("timeline",""))
    parts = [title, title, desc,
             f"Required skills: {skills}", f"Skills needed: {skills}"]
    if timeline:
        parts.append(f"Timeline: {timeline}")
    return "\n".join(x for x in parts if x.strip())

def freelancer_text(f):
    headline = str(f.get("headline",""))
    bio      = str(f.get("bio",""))
    level    = str(f.get("experience_level",""))
    skills   = ", ".join(str(s) for s in (f.get("skills") or []))
    avail    = str(f.get("availability",""))
    category = str(f.get("freelance_category",""))
    rate     = f.get("hourly_rate")
    parts = [headline, headline, bio,
             f"Skills: {skills}", f"Expert in: {skills}",
             f"Experience: {level}"]
    if category: parts.append(f"Category: {category}")
    if avail:    parts.append(f"Availability: {avail}")
    if rate is not None: parts.append(f"Hourly rate: ${rate}")
    return "\n".join(x for x in parts if x.strip())


# ── signal scoring ─────────────────────────────────────────────────────────────
def skill_f1(proposal, freelancer):
    required = {norm_skill(s) for s in (proposal.get("required_skills") or []) if s}
    has      = {norm_skill(s) for s in (freelancer.get("skills") or []) if s}
    if not required:
        return 0.5
    overlap = len(required & has)
    prec = overlap / len(required)
    rec  = (overlap / len(has)) if has else 0.0
    if prec + rec == 0:
        return 0.0
    return 2 * prec * rec / (prec + rec)

def budget_compat(proposal, freelancer):
    hourly = freelancer.get("hourly_rate")
    bmin   = proposal.get("budget_min")
    bmax   = proposal.get("budget_max")
    if hourly is None or (bmin is None and bmax is None):
        return 0.5
    try:
        hourly = float(hourly)
    except:
        return 0.5
    tl = str(proposal.get("timeline","")).lower()
    m = re.search(r"(\d+)\s*(week|month|day)", tl)
    if m:
        n, unit = int(m.group(1)), m.group(2)
        hours = n*8 if unit=="day" else n*40 if unit=="week" else n*160
    else:
        hours = 40.0
    cost = hourly * hours
    lo = float(bmin) if bmin is not None else 0.0
    hi = float(bmax) if bmax is not None else float("inf")
    if lo <= cost <= hi:
        return 1.0
    buffer = max(lo, hi) * 0.30 if max(lo, hi) > 0 else 1000
    gap = (lo - cost) if cost < lo else (cost - hi)
    return max(0.0, 1.0 - gap / (buffer + 1e-9))

def infer_seniority(text):
    text_lower = text.lower()
    found = -1
    for word, rank in SENIORITY_WORDS.items():
        if word in text_lower:
            found = max(found, rank)
    return found

def experience_fit(proposal, freelancer):
    req_level = infer_seniority(
        (proposal.get("title","") or "") + " " + (proposal.get("description","") or "")
    )
    fl_level = EXPERIENCE_RANK.get(
        str(freelancer.get("experience_level","")).strip().lower(), -1
    )
    if req_level == -1 and fl_level == -1:
        return 0.5
    if req_level == -1 or fl_level == -1:
        return 0.6
    diff = fl_level - req_level
    if diff == 0:  return 1.0
    if diff == 1:  return 0.85
    if diff == -1: return 0.55
    if diff >= 2:  return 0.65
    return 0.25

def avail_bucket(avail):
    tokens = set(re.findall(r"[a-z0-9\-]+", avail))
    if tokens & AVAILABILITY_FULL:  return "full"
    if tokens & AVAILABILITY_PART:  return "part"
    return "hourly"

def availability_fit(proposal, freelancer):
    avail    = str(freelancer.get("availability","")).lower()
    timeline = str(proposal.get("timeline","")).lower()
    if not avail:
        return 0.5
    bucket = avail_bucket(avail)
    if any(w in timeline for w in ("month","week","ongoing","long")):
        needed = "full"
    elif any(w in timeline for w in ("day","hour","quick","small","minor")):
        needed = "hourly"
    else:
        needed = "part"
    if bucket == needed:
        return 1.0
    if {bucket, needed} == {"full","part"}:
        return 0.7
    if {bucket, needed} == {"part","hourly"}:
        return 0.7
    return 0.4

def multi_signal_score(proposal, freelancer, semantic):
    sf  = skill_f1(proposal, freelancer)
    bc  = budget_compat(proposal, freelancer)
    ef  = experience_fit(proposal, freelancer)
    af  = availability_fit(proposal, freelancer)
    final = (W_SEMANTIC*semantic + W_SKILL_F1*sf + W_BUDGET*bc
             + W_EXPERIENCE*ef + W_AVAILABILITY*af)
    return max(0.0, min(1.0, final))

def rank_candidates(proposal, candidates):
    """Token-overlap + multi-signal scoring, mirrors _score_with_overlap."""
    p_tokens = set(tokenize(proposal_text(proposal)))
    scored = []
    for cand in candidates:
        c_tokens = set(tokenize(freelancer_text(cand)))
        union = len(p_tokens | c_tokens)
        semantic = len(p_tokens & c_tokens) / union if union else 0.0
        score = multi_signal_score(proposal, cand, semantic)
        scored.append((cand["user_id"], score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return [uid for uid, _ in scored]


# ── IR metrics ─────────────────────────────────────────────────────────────────
def precision_at_k(ranked, relevant, k):
    hits = sum(1 for r in ranked[:k] if r in relevant)
    return hits / k if k > 0 else 0.0

def recall_at_k(ranked, relevant, k):
    if not relevant: return 0.0
    hits = sum(1 for r in ranked[:k] if r in relevant)
    return hits / len(relevant)

def reciprocal_rank(ranked, relevant):
    for i, r in enumerate(ranked, 1):
        if r in relevant:
            return 1.0 / i
    return 0.0

def dcg(ranked, relevant, k):
    return sum(1.0/math.log2(i+1)
               for i, r in enumerate(ranked[:k], 1) if r in relevant)

def ndcg_at_k(ranked, relevant, k):
    actual = dcg(ranked, relevant, k)
    ideal  = dcg(list(relevant) + [x for x in ranked if x not in relevant], relevant, k)
    return actual / ideal if ideal > 0 else 0.0


# ── main ───────────────────────────────────────────────────────────────────────
def main(split="test"):
    with open(EVAL_PATH, encoding="utf-8") as f:
        dataset = json.load(f)

    samples = [s for s in dataset["samples"] if s.get("split") == split]
    print(f"Split: {split}  |  Samples: {len(samples)}")
    print(f"Scoring method: token_overlap_multisignal (fallback)\n")

    K = [1, 3, 5]
    agg = {f"precision@{k}": [] for k in K}
    agg.update({f"recall@{k}": [] for k in K})
    agg.update({f"ndcg@{k}": [] for k in K})
    rr_scores = []

    per_query_rows = []

    for s in samples:
        proposal   = s["proposal"]
        candidates = s["candidates"]
        relevant   = {c["user_id"] for c in candidates if c.get("label") == 1}
        ranked     = rank_candidates(proposal, candidates)

        row = {
            "id": s["id"],
            "title": proposal.get("title",""),
            "ranked": ranked,
            "relevant": list(relevant),
        }
        for k in K:
            p = precision_at_k(ranked, relevant, k)
            r = recall_at_k(ranked, relevant, k)
            n = ndcg_at_k(ranked, relevant, k)
            row[f"p@{k}"] = round(p, 4)
            row[f"r@{k}"] = round(r, 4)
            row[f"ndcg@{k}"] = round(n, 4)
            agg[f"precision@{k}"].append(p)
            agg[f"recall@{k}"].append(r)
            agg[f"ndcg@{k}"].append(n)

        rr = reciprocal_rank(ranked, relevant)
        row["mrr_contrib"] = round(rr, 4)
        rr_scores.append(rr)
        per_query_rows.append(row)

    # ── per-query table ──────────────────────────────────────────────────────
    print(f"{'ID':<12}{'Title':<48}{'Ranked IDs':<30}  P@1  P@3  P@5  R@1  R@3  R@5  N@1  N@3  N@5   RR")
    print("-"*140)
    for row in per_query_rows:
        ids_str = str(row["ranked"])[:28]
        print(f"{row['id']:<12}{row['title'][:47]:<48}{ids_str:<30}"
              f"  {row['p@1']:.2f} {row['p@3']:.2f} {row['p@5']:.2f}"
              f"  {row['r@1']:.2f} {row['r@3']:.2f} {row['r@5']:.2f}"
              f"  {row['ndcg@1']:.2f} {row['ndcg@3']:.2f} {row['ndcg@5']:.2f}"
              f"  {row['mrr_contrib']:.2f}")

    # ── aggregate ────────────────────────────────────────────────────────────
    n = len(samples)
    summary = {m: round(sum(v)/n, 4) for m, v in agg.items()}
    summary["mrr"] = round(sum(rr_scores)/n, 4)

    print("\n" + "="*60)
    print("AGGREGATE METRICS (test split)")
    print("="*60)
    for k in K:
        print(f"  Precision@{k}: {summary[f'precision@{k}']:.4f}")
    for k in K:
        print(f"  Recall@{k}:    {summary[f'recall@{k}']:.4f}")
    for k in K:
        print(f"  NDCG@{k}:      {summary[f'ndcg@{k}']:.4f}")
    print(f"  MRR:          {summary['mrr']:.4f}")
    print("="*60)

    # also run on train split
    train_samples = [s for s in dataset["samples"] if s.get("split") == "train"]
    print(f"\n--- Train split ({len(train_samples)} samples) for reference ---")
    t_agg = {f"precision@{k}": [] for k in K}
    t_agg.update({f"recall@{k}": [] for k in K})
    t_agg.update({f"ndcg@{k}": [] for k in K})
    t_rr = []
    for s in train_samples:
        prop = s["proposal"]; cands = s["candidates"]
        rel = {c["user_id"] for c in cands if c.get("label") == 1}
        ranked = rank_candidates(prop, cands)
        for k in K:
            t_agg[f"precision@{k}"].append(precision_at_k(ranked, rel, k))
            t_agg[f"recall@{k}"].append(recall_at_k(ranked, rel, k))
            t_agg[f"ndcg@{k}"].append(ndcg_at_k(ranked, rel, k))
        t_rr.append(reciprocal_rank(ranked, rel))
    nt = len(train_samples)
    t_sum = {m: round(sum(v)/nt, 4) for m, v in t_agg.items()}
    t_sum["mrr"] = round(sum(t_rr)/nt, 4)
    for k in K:
        print(f"  P@{k}={t_sum[f'precision@{k}']:.4f}  R@{k}={t_sum[f'recall@{k}']:.4f}  NDCG@{k}={t_sum[f'ndcg@{k}']:.4f}")
    print(f"  MRR={t_sum['mrr']:.4f}")

if __name__ == "__main__":
    main("test")
