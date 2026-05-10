"use client";

import { useState } from "react";

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001/api";

interface QueryMetrics {
  "precision@1": number;
  "precision@3": number;
  "precision@5": number;
  "recall@1": number;
  "recall@3": number;
  "recall@5": number;
  "ndcg@1": number;
  "ndcg@3": number;
  "ndcg@5": number;
  reciprocal_rank: number;
}

interface QueryResult {
  sample_id: string;
  proposal_title: string;
  ranked_user_ids: number[];
  relevant_user_ids: number[];
  metrics: QueryMetrics;
}

interface EvaluationResult {
  split: string;
  num_samples: number;
  scoring_method: string;
  aggregate_metrics: Record<string, number>;
  per_query_results: QueryResult[];
}

function MetricBadge({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "bg-green-100 text-green-800" : pct >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${color}`}>
      <div className="text-xs font-medium opacity-70">{label}</div>
      <div className="text-lg font-bold">{pct}%</div>
    </div>
  );
}

export default function EvaluationPage() {
  const [split, setSplit] = useState<"test" | "train">("test");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function runEval() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${FASTAPI_URL}/evaluation/run?split=${split}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }

  const agg = result?.aggregate_metrics;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">BERT Matching Evaluation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Measures Precision@K, Recall@K, MRR and NDCG against a labeled dataset of proposal–freelancer pairs.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {(["test", "train"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSplit(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                split === s
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-red-400"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} split
            </button>
          ))}
        </div>
        <button
          onClick={runEval}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
        >
          {loading ? "Running..." : "Run Evaluation"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      {result && agg && (
        <>
          {/* Summary card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {result.num_samples} samples &bull; split: <span className="font-semibold">{result.split}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Scoring: <span className="font-medium">{result.scoring_method}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">MRR</div>
                <div className="text-2xl font-bold text-gray-900">{Math.round(agg.mrr * 100)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Precision</div>
                <MetricBadge label="@1" value={agg["precision@1"]} />
                <MetricBadge label="@3" value={agg["precision@3"]} />
                <MetricBadge label="@5" value={agg["precision@5"]} />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recall</div>
                <MetricBadge label="@1" value={agg["recall@1"]} />
                <MetricBadge label="@3" value={agg["recall@3"]} />
                <MetricBadge label="@5" value={agg["recall@5"]} />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NDCG</div>
                <MetricBadge label="@1" value={agg["ndcg@1"]} />
                <MetricBadge label="@3" value={agg["ndcg@3"]} />
                <MetricBadge label="@5" value={agg["ndcg@5"]} />
              </div>
            </div>
          </div>

          {/* Per-query results */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-gray-800">Per-Query Results</h2>
            {result.per_query_results.map((qr) => {
              const isOpen = expanded === qr.sample_id;
              const allRanked = qr.ranked_user_ids.map((uid, i) => ({
                uid,
                rank: i + 1,
                relevant: qr.relevant_user_ids.includes(uid),
              }));
              return (
                <div key={qr.sample_id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : qr.sample_id)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="text-left">
                      <span className="text-xs font-mono text-gray-400">{qr.sample_id}</span>
                      <div className="text-sm font-medium text-gray-800">{qr.proposal_title}</div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>P@1&nbsp;{Math.round(qr.metrics["precision@1"] * 100)}%</span>
                      <span>MRR&nbsp;{Math.round(qr.metrics.reciprocal_rank * 100)}%</span>
                      <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50">
                      <div className="flex flex-wrap gap-2">
                        {allRanked.map(({ uid, rank, relevant }) => (
                          <span
                            key={uid}
                            className={`text-xs px-2 py-1 rounded font-mono border ${
                              relevant
                                ? "bg-green-100 border-green-300 text-green-800 font-semibold"
                                : "bg-gray-100 border-gray-200 text-gray-600"
                            }`}
                          >
                            #{rank} uid:{uid}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        {(["1", "3", "5"] as const).map((k) => (
                          <div key={k} className="space-y-1">
                            <div className="text-gray-500 font-medium">@{k}</div>
                            <div className="text-gray-800">
                              P: {Math.round(qr.metrics[`precision@${k}` as keyof QueryMetrics] as number * 100)}% &nbsp;
                              R: {Math.round(qr.metrics[`recall@${k}` as keyof QueryMetrics] as number * 100)}% &nbsp;
                              NDCG: {Math.round(qr.metrics[`ndcg@${k}` as keyof QueryMetrics] as number * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
