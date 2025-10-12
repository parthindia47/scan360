// UserPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

const MAX_BIO = 240;

function UserPage() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  // ── Replace these with real API calls ───────────────────────────────
  async function fetchUser(u) {
    // TODO: GET /api/user/:username
    return {
      username: "tyler",
      name: "Tyler Durden",
      avatarUrl: "https://i.pinimg.com/originals/8f/fd/bb/8ffdbbc9943df39ca7bb2212f0e42eef.jpg",
      website: "https://scan360.in",
      bio: "Markets nerd. Building Scan360 to make Indian stock data usable. Coffee > tea.",
      profitIn: ["MCX", "HDFCBANK", "LTTS"],
      lossIn: ["IDEA", "PAYTM"],
      missed: ["TATAPOWER"],
    };
  }

  async function fetchUserPosts(u) {
    // TODO: GET /api/user/:username/posts
    return [
      {
        id: "p1",
        createdAt: "2025-10-10T12:40:00Z",
        text: "Longed MCX before split—booked partial, trailing rest. Thesis: volumes ↑, tech refresh.",
        symbols: ["MCX"],
      },
      {
        id: "p2",
        createdAt: "2025-10-09T08:10:00Z",
        text: "Missed the LTTS breakout retest. Will wait for a clean HL setup.",
        symbols: ["LTTS"],
      },
    ];
  }
  // ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [u, p] = await Promise.all([fetchUser(username), fetchUserPosts(username)]);
      if (!alive) return;
      setUser(u);
      setPosts(p);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [username]);

  const bioText = useMemo(() => {
    if (!user?.bio) return "";
    return user.bio.length > MAX_BIO ? user.bio.slice(0, MAX_BIO - 1) + "…" : user.bio;
  }, [user]);

  const onSubmitPost = async (e) => {
    e.preventDefault();
    const text = newPost.trim();
    if (!text) return;
    // TODO: POST /api/user/:username/posts  { text }
    const created = {
      id: "p" + (posts.length + 1),
      createdAt: new Date().toISOString(),
      text,
      symbols: extractSymbols(text),
    };
    setPosts([created, ...posts]);
    setNewPost("");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:py-6">
      {/* Header */}
      <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        {loading ? (
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-64 bg-gray-200 rounded" />
            </div>
          </div>
        ) : (
          <>
            <img
              src={user.avatarUrl}
              alt={`${user.name} avatar`}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover ring-2 ring-gray-200"
            />
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.name}</h1>
                  <div className="text-sm text-gray-600">@{user.username}</div>
                </div>
                {user.website && (
                  <div>
                  <span>🔗</span>
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline break-all"
                  >
                    {shortenUrl(user.website)}
                  </a>
                  </div>
                )}
              </div>
              {bioText && (
                <p className="mt-2 text-sm text-gray-800 leading-relaxed">{bioText}</p>
              )}
            </div>
          </>
        )}
      </header>

      {/* Quick Trades */}
      <section className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TradeCard title="Made Profit In" tickers={user?.profitIn || []} tone="profit" loading={loading} />
        <TradeCard title="Made Loss In" tickers={user?.lossIn || []} tone="loss" loading={loading} />
        <TradeCard title="Missed This Trade" tickers={user?.missed || []} tone="missed" loading={loading} />
      </section>

      {/* New Post */}
      <section className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900">Add a new post</h2>
        <form onSubmit={onSubmitPost} className="mt-3 space-y-3">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={3}
            maxLength={800}
            placeholder="Share your trade idea, notes, charts… (use $SYMBOL to tag)"
            className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 p-3 text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{newPost.length}/800</span>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              disabled={!newPost.trim()}
            >
              Post
            </button>
          </div>
        </form>
      </section>

      {/* Posts */}
      <section className="mt-4 mb-4">
        <h2 className="sr-only">Posts</h2>
        <div className="space-y-3">
          {loading ? (
            <PostSkeleton />
          ) : posts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-600">
              No posts yet.
            </div>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------- Small components ---------- */

function TradeCard({ title, tickers, tone = "profit", loading }) {
  const color =
    tone === "profit"
      ? "bg-green-50 border-green-200"
      : tone === "loss"
      ? "bg-red-50 border-red-200"
      : "bg-amber-50 border-amber-200";

  const chip =
    tone === "profit"
      ? "bg-green-100 text-green-800"
      : tone === "loss"
      ? "bg-red-100 text-red-800"
      : "bg-amber-100 text-amber-800";

  return (
    <div className={`rounded-2xl border ${color} p-4`}>
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {loading ? (
          <>
            <span className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            <span className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
            <span className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
          </>
        ) : tickers.length ? (
          tickers.map((t) => (
            <Link
              key={t}
              to={`/symbol/${t}`}
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${chip} hover:opacity-90`}
            >
              {t}
            </Link>
          ))
        ) : (
          <span className="text-xs text-gray-500">Nothing yet</span>
        )}
      </div>
    </div>
  );
}

function PostCard({ post }) {
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <time className="text-xs text-gray-500">
          {formatLocal(post.createdAt)}
        </time>
        <div className="flex gap-1">
          {post.symbols?.map((s) => (
            <Link
              key={s}
              to={`/symbol/${s}`}
              className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">{post.text}</p>
    </article>
  );
}

function PostSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="mt-3 h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
          <div className="mt-2 h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ---------- helpers ---------- */

function shortenUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatLocal(iso) {
  try {
    const d = new Date(iso);
    const dd = d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    return dd;
  } catch {
    return iso;
  }
}

/**
 * Extract $SYMBOL tags from text (e.g., "$RELIANCE looks strong")
 * Returns an array of uppercase symbols (deduped)
 */
function extractSymbols(text) {
  const re = /\$([A-Za-z][A-Za-z0-9]{0,9})\b/g;
  const out = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    out.add(m[1].toUpperCase());
  }
  return Array.from(out);
}


export default UserPage;