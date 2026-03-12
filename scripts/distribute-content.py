"""
Content distribution script: article/note → Gemini Flash → social posts.
Reads markdown content, generates platform-specific social posts via Gemini API,
and auto-logs each run to CSV.

Usage:
  python scripts/distribute-content.py --slug my-article
  python scripts/distribute-content.py --latest
  python scripts/distribute-content.py --slug my-article --mark-posted
"""

import argparse
import csv
import os
import re
import sys
from datetime import datetime
from pathlib import Path

# Project root (one level up from scripts/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = PROJECT_ROOT / "src" / "content" / "articles"
NOTES_DIR = PROJECT_ROOT / "src" / "content" / "notes"
RULES_FILE = PROJECT_ROOT / ".claude" / "rules" / "content-distribution.md"
LOG_FILE = PROJECT_ROOT / "logs" / "distribution-log.csv"
SITE_URL = os.getenv("PUBLIC_SITE_URL", "https://tree-id.dev")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
SLUG_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]*$")


def validate_slug(slug: str) -> None:
    """Validate slug to prevent path traversal."""
    if not SLUG_PATTERN.match(slug):
        print(f"Error: Invalid slug '{slug}'. Only alphanumeric, hyphens, and underscores allowed.")
        sys.exit(1)


def find_content(slug: str) -> tuple[str, str, str]:
    """Find content by slug. Returns (content, content_type, slug)."""
    validate_slug(slug)

    # Check articles first (markdoc files)
    article_path = ARTICLES_DIR / slug / "index.mdoc"
    if article_path.exists():
        return article_path.read_text(encoding="utf-8"), "article", slug

    # Check notes (YAML files)
    note_path = NOTES_DIR / f"{slug}.yaml"
    if note_path.exists():
        return note_path.read_text(encoding="utf-8"), "note", slug

    raise FileNotFoundError(f"No content found for slug: {slug}")


def find_latest() -> tuple[str, str, str]:
    """Find the most recently modified content file."""
    candidates = []

    # Scan articles
    if ARTICLES_DIR.exists():
        for article_dir in ARTICLES_DIR.iterdir():
            index_file = article_dir / "index.mdoc"
            if article_dir.is_dir() and index_file.exists():
                candidates.append((index_file.stat().st_mtime, index_file, "article", article_dir.name))

    # Scan notes
    if NOTES_DIR.exists():
        for note_file in NOTES_DIR.glob("*.yaml"):
            candidates.append((note_file.stat().st_mtime, note_file, "note", note_file.stem))

    if not candidates:
        raise FileNotFoundError("No content files found")

    candidates.sort(key=lambda x: x[0], reverse=True)
    _, path, content_type, slug = candidates[0]
    return path.read_text(encoding="utf-8"), content_type, slug


def load_brand_rules() -> str:
    """Load brand voice rules for system prompt."""
    if RULES_FILE.exists():
        return RULES_FILE.read_text(encoding="utf-8")
    return ""


def build_prompt(content: str, content_type: str, slug: str) -> str:
    """Build the Gemini prompt for social post generation."""
    article_url = f"{SITE_URL}/articles/{slug}" if content_type == "article" else f"{SITE_URL}/notes/{slug}"

    return f"""Generate social media posts for this {content_type}.

Article URL: {article_url}

Content:
---
{content}
---

Generate posts for Twitter/X and LinkedIn following the brand voice rules and output format exactly.
Use the article URL with appropriate UTM parameters for each platform.
Match the language of the original content (Vietnamese → Vietnamese posts, English → English posts)."""


def call_gemini(system_prompt: str, user_prompt: str) -> str:
    """Call Gemini Flash API and return the response."""
    try:
        from google import genai
    except ImportError:
        print("Error: google-genai package not found.")
        print("Install: pip install google-genai")
        sys.exit(1)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not set in environment.")
        print("Get a free key at: https://aistudio.google.com/apikey")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=user_prompt,
        config=genai.types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,
        ),
    )
    if not response.text:
        print("Error: Gemini returned empty response (content may have been filtered).")
        sys.exit(1)
    return response.text


def count_words(content: str) -> int:
    """Count words in content, stripping leading YAML frontmatter."""
    lines = content.split("\n")
    # Strip only the leading frontmatter block (first --- to second ---)
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                lines = lines[i + 1:]
                break
    return len(" ".join(lines).split())


def log_distribution(slug: str, content_type: str, word_count: int, notes: str = ""):
    """Append a row to the distribution log CSV."""
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(LOG_FILE, "a", newline="", encoding="utf-8") as f:
        # Write header if file is empty (avoids TOCTOU race with exists() check)
        if f.tell() == 0:
            csv.writer(f).writerow(["date", "slug", "type", "platforms", "status", "word_count", "notes"])
        writer = csv.writer(f)
        writer.writerow([
            datetime.now().strftime("%Y-%m-%d"),
            slug,
            content_type,
            "twitter,linkedin,devto,hashnode,reddit,facebook,medium,hackernews,threads",
            "drafted",
            word_count,
            notes,
        ])
    print(f"\n[LOG] Appended to {LOG_FILE.relative_to(PROJECT_ROOT)}")


def mark_posted(slug: str):
    """Update the latest entry for a slug from 'drafted' to 'posted'."""
    if not LOG_FILE.exists():
        print(f"No log file found at {LOG_FILE}")
        return

    rows = []
    updated = False
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append(row)

    # Find the last row matching this slug with status "drafted"
    for i in range(len(rows) - 1, -1, -1):
        if len(rows[i]) >= 5 and rows[i][1] == slug and rows[i][4] == "drafted":
            rows[i][4] = "posted"
            updated = True
            break

    if updated:
        with open(LOG_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerows(rows)
        print(f"Marked '{slug}' as posted.")
    else:
        print(f"No drafted entry found for '{slug}'.")


def main():
    parser = argparse.ArgumentParser(description="Generate social posts from Tree Identity content")
    parser.add_argument("--slug", help="Content slug to distribute")
    parser.add_argument("--latest", action="store_true", help="Use the most recently modified content")
    parser.add_argument("--mark-posted", action="store_true", help="Mark a slug as posted in the log")
    args = parser.parse_args()

    # Handle mark-posted separately
    if args.mark_posted:
        if not args.slug:
            print("Error: --mark-posted requires --slug")
            sys.exit(1)
        mark_posted(args.slug)
        return

    # Find content
    if args.slug:
        content, content_type, slug = find_content(args.slug)
    elif args.latest:
        content, content_type, slug = find_latest()
    else:
        parser.print_help()
        sys.exit(1)

    word_count = count_words(content)
    print(f"Distributing: {slug} ({content_type})")
    print(f"Word count: {word_count}")
    print("-" * 60)

    # Load brand rules as system prompt
    system_prompt = load_brand_rules()

    # Build user prompt
    user_prompt = build_prompt(content, content_type, slug)

    # Call Gemini
    print("Calling Gemini Flash...")
    result = call_gemini(system_prompt, user_prompt)

    # Output result
    print("\n" + "=" * 60)
    print(result)
    print("=" * 60)

    # Auto-log to CSV
    log_distribution(slug, content_type, word_count)


if __name__ == "__main__":
    main()
