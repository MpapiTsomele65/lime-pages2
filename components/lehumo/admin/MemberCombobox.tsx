"use client";

/**
 * MemberCombobox — searchable typeahead picker for the Lehumo
 * member list. Designed for the admin Contributions page (and any
 * future "pick a member" surface — bulk EFT importer, refund
 * dialog, etc).
 *
 * Why a custom combobox instead of a select:
 *   - 30-100 members is past the comfortable bound of a native
 *     dropdown but still small enough to fully client-filter
 *     without async pagination.
 *   - Native `<select>` doesn't let admins search by Leh-number or
 *     email, which is how they actually identify members from a
 *     bank statement ("EFT from Leh07" / "deposit from
 *     thabo@…").
 *
 * Behaviour:
 *   - User types → live filter (case-insensitive contains) on
 *     `fullName`, formatted `Leh##` number, and `email`.
 *   - Arrow Up/Down to move highlight, Enter to select, Escape
 *     to close.
 *   - Click outside the input + listbox closes; click on a result
 *     selects + closes.
 *   - Selected state renders as a compact chip ABOVE the input
 *     once chosen, with an X to clear back to the search state.
 *   - Empty selection: input is visible, dropdown opens on focus.
 *
 * A11y:
 *   - `role="combobox"` on the input with `aria-expanded` /
 *     `aria-controls` / `aria-activedescendant` pointing at the
 *     active option's id.
 *   - `role="listbox"` on the dropdown, `role="option"` on each
 *     row with `aria-selected` reflecting the highlight.
 *   - The hidden listbox is `aria-hidden="true"` when closed.
 *   - Focus stays in the input throughout — arrow keys move
 *     selection without losing focus, in line with WAI-ARIA's
 *     listbox-collapsed pattern.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  formatMemberNumber,
  type LehumoMember,
} from "@/lib/definitions";

interface MemberComboboxProps {
  members: LehumoMember[];
  /** Currently selected member's Airtable record ID. */
  value: string | null;
  onChange: (memberId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Optional className for the root wrapper. */
  className?: string;
}

export function MemberCombobox({
  members,
  value,
  onChange,
  placeholder = "Search members by name, number, or email…",
  disabled = false,
  className = "",
}: MemberComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  // Resolve the currently-selected member from the list. Memoised so
  // a 60-row scan doesn't run on every keystroke; the lookup is by id.
  const selected = useMemo(
    () => members.find((m) => m.id === value) ?? null,
    [members, value],
  );

  // Filter list. Case-insensitive contains on:
  //   - full name
  //   - formatted member number ("Leh07")
  //   - email
  // No `query` → show top 8 alphabetically (avoids dumping all
  // 50+ rows into the dropdown on focus).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...members]
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .slice(0, 8);
    }
    return members.filter((m) => {
      const haystack = [
        m.fullName,
        formatMemberNumber(m.memberNumber),
        m.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, members]);

  // Keep highlight in bounds whenever the filtered list shrinks.
  useEffect(() => {
    if (highlightIdx >= filtered.length) {
      setHighlightIdx(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, highlightIdx]);

  // Close on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function commit(member: LehumoMember) {
    onChange(member.id);
    setQuery("");
    setOpen(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlightIdx((i) => Math.min(filtered.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const pick = filtered[highlightIdx];
      if (pick) commit(pick);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
  }

  // ── Selected state: chip with X. Click X clears, then the
  //    input re-renders ready for a new search. ───────────────
  if (selected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 rounded-lg border border-[#0B1933]/15 bg-white px-3 py-2 flex-1 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#B8FF00]/15 text-[10px] font-bold text-[#0B1933]">
            {formatMemberNumber(selected.memberNumber)
              .replace(/^Leh/, "")
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#0B1933] truncate">
              {selected.fullName || "—"}
            </p>
            <p className="text-[11px] text-[#6B7280] truncate">
              {formatMemberNumber(selected.memberNumber)}
              {selected.email ? ` · ${selected.email}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              // Give the input a chance to render before focusing.
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            disabled={disabled}
            className="ml-1 h-6 w-6 shrink-0 rounded-full bg-[#F8F9FA] hover:bg-[#EDEDED] flex items-center justify-center text-[#6B7280] hover:text-[#0B1933] transition-colors disabled:opacity-40"
            aria-label="Clear selected member"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state: searchable input + dropdown ─────────────────
  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIdx(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && filtered[highlightIdx]
              ? `${listboxId}-opt-${filtered[highlightIdx].id}`
              : undefined
          }
          autoComplete="off"
          className="w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 py-2 text-sm text-[#0B1933] placeholder:text-[#9CA3AF] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Dropdown — anchored beneath the input, max-height with
          overflow so a 50-row match list doesn't take the page. */}
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Members"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-xs text-[#9CA3AF] text-center">
              No members match &ldquo;{query}&rdquo;
            </li>
          ) : (
            filtered.map((m, i) => {
              const active = i === highlightIdx;
              return (
                <li
                  key={m.id}
                  id={`${listboxId}-opt-${m.id}`}
                  role="option"
                  aria-selected={active}
                  onMouseDown={(e) => {
                    // mousedown not click so the input doesn't blur
                    // before we can call commit().
                    e.preventDefault();
                    commit(m);
                  }}
                  onMouseEnter={() => setHighlightIdx(i)}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                    active ? "bg-[#0B1933]/[0.04]" : "hover:bg-[#0B1933]/[0.02]"
                  }`}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#B8FF00]/15 text-[10px] font-bold text-[#0B1933]">
                    {formatMemberNumber(m.memberNumber)
                      .replace(/^Leh/, "")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#0B1933] truncate">
                      {m.fullName || "—"}
                    </p>
                    <p className="text-[11px] text-[#6B7280] truncate">
                      {formatMemberNumber(m.memberNumber)}
                      {m.email ? ` · ${m.email}` : ""}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
