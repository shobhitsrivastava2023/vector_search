"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

type ImageDoc = {
  _id: string;
  imageUrl: string;
  description: string;
  score?: number;
};

function MasonryGrid({ images }: { images: ImageDoc[] }) {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    function update() {
      if (window.innerWidth < 640) setColumns(2);
      else if (window.innerWidth < 1024) setColumns(3);
      else setColumns(4);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Distribute images into columns
  const cols: ImageDoc[][] = Array.from({ length: columns }, () => []);
  images.forEach((img, i) => cols[i % columns].push(img));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "12px",
        padding: "0 16px 40px",
      }}
    >
      {cols.map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {col.map((img, ii) => (
            <ImageCard key={img._id} img={img} index={ci * 10 + ii} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ImageCard({ img, index }: { img: ImageDoc; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        background: "#1a1a1f",
        opacity: loaded ? 1 : 0,
        transform: loaded ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.5s ease ${index * 40}ms, transform 0.5s ease ${index * 40}ms, box-shadow 0.3s ease`,
        boxShadow: hovered
          ? "0 20px 60px rgba(0,0,0,0.6)"
          : "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <img
        src={img.imageUrl}
        alt={img.description}
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%",
          display: "block",
          transform: hovered ? "scale(1.04)" : "scale(1)",
          transition: "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Overlay on hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 50%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.7rem",
            color: "rgba(255,255,255,0.75)",
            lineClamp: 3,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {img.description}
        </p>
        {img.score !== undefined && (
          <div
            style={{
              marginTop: "0.5rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "rgba(99,102,241,0.25)",
              border: "1px solid rgba(99,102,241,0.4)",
              borderRadius: "999px",
              padding: "0.2rem 0.6rem",
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: "0.6rem", fontFamily: "'DM Mono', monospace", color: "#a5b4fc" }}>
              {(img.score * 100).toFixed(0)}% match
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ImageDoc[] | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const allImages = useQuery(api.images.getAllImages) as ImageDoc[] | undefined;
  const searchSimilar = useAction(api.images.searchSimilarImages);

  const displayImages = searchResults ?? allImages ?? [];
  const isSearchMode = searchResults !== null;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      // Get embedding for the query text
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const { embedding } = await res.json();

      // Vector search in Convex
      const results = await searchSimilar({ embedding });
      setSearchResults(results as ImageDoc[]);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setSearchResults(null);
    inputRef.current?.focus();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0c0c10;
          color: #fff;
          min-height: 100vh;
        }

        .home-root {
          min-height: 100vh;
          background: #0c0c10;
        }

        /* Ambient background */
        .home-root::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 400px;
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .header {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: rgba(12,12,16,0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .logo {
          font-family: 'Instrument Serif', serif;
          font-size: 1.4rem;
          color: #fff;
          white-space: nowrap;
          letter-spacing: -0.02em;
          flex-shrink: 0;
        }

        .logo em {
          font-style: italic;
          color: #818cf8;
        }

        /* Search bar */
        .search-form {
          flex: 1;
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }

        .search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: 0.7rem 3rem 0.7rem 1.2rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          color: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          outline: none;
          transition: all 0.25s ease;
        }

        .search-input::placeholder {
          color: rgba(255,255,255,0.25);
        }

        .search-input:focus {
          background: rgba(255,255,255,0.09);
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .search-btn {
          position: absolute;
          right: 8px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #6366f1;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .search-btn:hover { background: #4f46e5; transform: scale(1.05); }
        .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .admin-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.3);
          text-decoration: none;
          white-space: nowrap;
          padding: 0.5rem 0.8rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .admin-link:hover {
          color: rgba(255,255,255,0.6);
          border-color: rgba(255,255,255,0.15);
        }

        /* Status bar */
        .status-bar {
          padding: 1rem 1.5rem 0.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .status-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.3);
        }

        .status-label strong {
          color: rgba(255,255,255,0.6);
          font-weight: 500;
        }

        .clear-btn {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: #818cf8;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .clear-btn:hover { background: rgba(129,140,248,0.1); }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
          padding: 2rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          opacity: 0.3;
        }

        .empty-title {
          font-family: 'Instrument Serif', serif;
          font-size: 1.5rem;
          color: rgba(255,255,255,0.4);
        }

        .empty-sub {
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.2);
        }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>

      <div className="home-root">
        {/* Header */}
        <header className="header">
          <div className="logo">vis<em>search</em></div>

          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-wrap">
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                placeholder="Search by description, color, style..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              <button className="search-btn" type="submit" disabled={searching}>
                {searching ? (
                  <div className="spinner" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          <Link href="/admin" className="admin-link">admin ↗</Link>
        </header>

        {/* Status bar */}
        <div className="status-bar">
          <div className="status-label">
            {isSearchMode ? (
              <>results for <strong>"{query}"</strong> — {displayImages.length} found</>
            ) : (
              <><strong>{displayImages.length}</strong> images indexed</>
            )}
          </div>
          {isSearchMode && (
            <button className="clear-btn" onClick={clearSearch}>
              ✕ clear search
            </button>
          )}
        </div>

        {/* Grid */}
        {displayImages.length > 0 ? (
          <MasonryGrid images={displayImages} />
        ) : allImages === undefined ? (
          <div className="empty-state">
            <div className="empty-icon">⟳</div>
            <div className="empty-title">Loading...</div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">{isSearchMode ? "◎" : "⊕"}</div>
            <div className="empty-title">
              {isSearchMode ? "No results found" : "No images yet"}
            </div>
            <div className="empty-sub">
              {isSearchMode
                ? "Try a different search term"
                : "Upload images from the admin panel to get started"}
            </div>
          </div>
        )}
      </div>
    </>
  );
}