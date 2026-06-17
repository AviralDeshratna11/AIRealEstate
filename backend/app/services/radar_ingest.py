"""Real-time ingestion for the Mumbai Redevelopment Radar.

This module fetches *live* data and merges it into the in-memory Radar store so
the feature is dynamic rather than purely seeded. It is built to actually work
from inside the backend container and to degrade gracefully when the network or
an LLM key is unavailable.

Sources (in order of reliability for a container):
  1. Wikipedia REST summary + infobox  -> current project metadata
     (status, cost, length, dates, last-modified). Reliable, no auth, citable.
  2. Google News RSS                    -> fresh signals -> claims + alerts.
  3. Optional LLM extraction            -> structured RadarProject from an
     arbitrary official URL, only when OPENAI_API_KEY is set.

Safety: Wikipedia and news are tertiary/secondary sources, so projects/claims
from them are recorded with source_type=news and never auto-marked "verified".
The seeded official projects are preserved; live items are upserted alongside.
"""

from __future__ import annotations

import logging
import re
import threading
import xml.etree.ElementTree as ET
from urllib.parse import quote_plus
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any

import httpx

from app.radar_models import (
    ClaimStatus,
    IngestionJob,
    ProjectLocalityImpact,
    ProjectStatus,
    ProjectType,
    RadarAlert,
    RadarClaim,
    RadarProject,
    SourceType,
    TimeHorizon,
)

logger = logging.getLogger("radar.ingest")

USER_AGENT = "ASTRA-Estate-Radar/1.0 (real-estate intelligence; +https://astra.estate)"
WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"
WIKI_PAGE = "https://en.wikipedia.org/wiki/{title}"
GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={q}&hl=en-IN&gl=IN&ceid=IN:en"

_LOCK = threading.Lock()
_LAST_RUN: dict[str, Any] = {"at": None, "projects": 0, "claims": 0}
_running = threading.Event()


# --------------------------------------------------------------------------- #
# Live source registry — real Mumbai/MMR projects on Wikipedia. Some are NEW
# (not in the seed) so live ingest genuinely expands coverage.
# --------------------------------------------------------------------------- #
LIVE_PROJECT_SOURCES: list[dict[str, Any]] = [
    {"slug": "metro-line-3", "title": "Line_3_(Mumbai_Metro)", "type": "metro", "authority": "MMRC/MMRDA",
     "localities": ["bandra", "worli", "lower-parel"], "categories": ["connectivity", "employment"]},
    {"slug": "metro-line-2a", "title": "Line_2A_(Mumbai_Metro)", "type": "metro", "authority": "MMRDA",
     "localities": ["andheri", "borivali"], "categories": ["connectivity"]},
    {"slug": "metro-line-7", "title": "Line_7_(Mumbai_Metro)", "type": "metro", "authority": "MMRDA",
     "localities": ["andheri", "borivali"], "categories": ["connectivity"]},
    {"slug": "mthl-atal-setu", "title": "Mumbai_Trans_Harbour_Link", "type": "bridge", "authority": "MMRDA",
     "localities": ["ulwe", "panvel", "navi-mumbai"], "categories": ["connectivity", "employment"]},
    {"slug": "coastal-road", "title": "Coastal_Road_(Mumbai)", "type": "coastal", "authority": "BMC",
     "localities": ["worli", "bandra", "lower-parel"], "categories": ["connectivity", "public_realm", "livability"]},
    {"slug": "nmia", "title": "Navi_Mumbai_International_Airport", "type": "airport", "authority": "CIDCO",
     "localities": ["ulwe", "panvel", "kharghar", "navi-mumbai"], "categories": ["employment", "connectivity"]},
    {"slug": "dharavi-redevelopment", "title": "Dharavi", "type": "slum_redevelopment", "authority": "DRP/SRA",
     "localities": ["dadar", "bandra"], "categories": ["redevelopment", "employment", "zoning"]},
    {"slug": "versova-bandra-sea-link", "title": "Versova%E2%80%93Bandra_Sea_Link", "type": "bridge", "authority": "MSRDC",
     "localities": ["andheri", "bandra"], "categories": ["connectivity"]},
    {"slug": "thane-borivali-tunnel", "title": "Thane%E2%80%93Borivali_Tunnel", "type": "tunnel", "authority": "MMRDA",
     "localities": ["borivali", "thane"], "categories": ["connectivity"]},
    {"slug": "goregaon-mulund-link-road", "title": "Goregaon%E2%80%93Mulund_Link_Road", "type": "road", "authority": "BMC",
     "localities": ["powai", "ghatkopar"], "categories": ["connectivity"]},
    {"slug": "mumbai-ahmedabad-hsr", "title": "Mumbai%E2%80%93Ahmedabad_high-speed_rail_corridor", "type": "rail", "authority": "NHSRCL",
     "localities": ["thane", "navi-mumbai"], "categories": ["connectivity", "employment"]},
    {"slug": "navi-mumbai-metro", "title": "Navi_Mumbai_Metro", "type": "metro", "authority": "CIDCO",
     "localities": ["kharghar", "panvel", "navi-mumbai"], "categories": ["connectivity"]},
]

# Locality-level live news queries (slug -> search query).
NEWS_QUERIES: list[dict[str, str]] = [
    {"slug": "borivali", "q": "Borivali redevelopment OR metro Mumbai"},
    {"slug": "chembur", "q": "Chembur Mumbai metro OR redevelopment"},
    {"slug": "worli", "q": "Worli BDD chawl OR coastal road"},
    {"slug": "thane", "q": "Thane metro OR redevelopment infrastructure"},
    {"slug": "ulwe", "q": "Ulwe Navi Mumbai airport"},
    {"slug": "andheri", "q": "Andheri redevelopment OR metro"},
]

_SEEN_NEWS: set[str] = set()


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _client() -> httpx.Client:
    return httpx.Client(timeout=8.0, headers={"User-Agent": USER_AGENT}, follow_redirects=True)


def _map_status(text: str | None) -> ProjectStatus:
    t = (text or "").lower()
    if not t:
        return ProjectStatus.proposed
    if "partially" in t or ("operational" in t and "non" not in t and "fully" not in t and "under" in t):
        return ProjectStatus.partially_operational
    if any(k in t for k in ["operational", "opened", "in service", "completed", "complete"]):
        return ProjectStatus.operational
    if "under construction" in t or "construction" in t or "ongoing" in t:
        return ProjectStatus.under_construction
    if "tender" in t:
        return ProjectStatus.tendering
    if any(k in t for k in ["approved", "sanctioned", "cleared"]):
        return ProjectStatus.approved
    if any(k in t for k in ["stalled", "shelved", "on hold"]):
        return ProjectStatus.stalled
    if "delayed" in t:
        return ProjectStatus.delayed
    if any(k in t for k in ["proposed", "planned", "planning"]):
        return ProjectStatus.proposed
    return ProjectStatus.under_construction


def _parse_budget_crore(text: str | None) -> float | None:
    """Best-effort parse of an Indian-currency cost string into INR crore."""
    if not text:
        return None
    t = text.replace(",", "").replace("₹", " ").replace("Rs", " ").replace("INR", " ")
    # crore
    m = re.search(r"([\d.]+)\s*(?:crore|cr\b)", t, re.I)
    if m:
        try:
            return round(float(m.group(1)), 1)
        except ValueError:
            pass
    # lakh crore -> *100000 crore
    m = re.search(r"([\d.]+)\s*lakh\s*crore", t, re.I)
    if m:
        return round(float(m.group(1)) * 100000, 1)
    # billion (USD/▮) -> approx crore (1 bn USD ~ 8300 cr); skip currency nuance, flag rough
    m = re.search(r"([\d.]+)\s*billion", t, re.I)
    if m:
        return round(float(m.group(1)) * 830, 1)
    return None


def _first_year(text: str | None) -> str | None:
    if not text:
        return None
    m = re.search(r"(19|20)\d{2}", text)
    return m.group(0) if m else None


def _wiki_infobox(title: str, client: httpx.Client) -> dict[str, str]:
    """Fetch a Wikipedia page and extract infobox label->value pairs."""
    try:
        from bs4 import BeautifulSoup  # local import so module still loads without bs4
    except Exception:
        return {}
    try:
        r = client.get(WIKI_PAGE.format(title=title))
        if r.status_code != 200:
            return {}
        soup = BeautifulSoup(r.text, "html.parser")
        box = soup.select_one("table.infobox")
        if not box:
            return {}
        out: dict[str, str] = {}
        for row in box.select("tr"):
            th = row.find("th")
            td = row.find("td")
            if th and td:
                label = th.get_text(" ", strip=True)
                value = td.get_text(" ", strip=True)
                if label and value:
                    out[label] = value
        return out
    except Exception as exc:  # network / parse error
        logger.warning("infobox fetch failed for %s: %s", title, exc)
        return {}


def _wiki_summary(title: str, client: httpx.Client) -> dict[str, Any]:
    try:
        r = client.get(WIKI_SUMMARY.format(title=title))
        if r.status_code != 200:
            return {}
        return r.json()
    except Exception as exc:
        logger.warning("summary fetch failed for %s: %s", title, exc)
        return {}


def _ig(box: dict[str, str], *labels: str) -> str | None:
    for key, val in box.items():
        kl = key.lower()
        if any(lbl in kl for lbl in labels):
            return val
    return None


# --------------------------------------------------------------------------- #
# Build a RadarProject from a live Wikipedia source
# --------------------------------------------------------------------------- #
def _build_live_project(src: dict[str, Any], client: httpx.Client) -> RadarProject | None:
    title = src["title"]
    summary = _wiki_summary(title, client)
    box = _wiki_infobox(title, client)
    if not summary and not box:
        return None

    name = summary.get("title") or title.replace("_", " ")
    extract = summary.get("extract") or ""
    page_url = (
        summary.get("content_urls", {}).get("desktop", {}).get("page")
        or WIKI_PAGE.format(title=title)
    )
    ts = summary.get("timestamp")  # ISO last-revision time -> real "last verified"
    last_verified = ts[:10] if isinstance(ts, str) else datetime.now(timezone.utc).date().isoformat()

    status = _map_status(_ig(box, "status") or extract)
    budget = _parse_budget_crore(_ig(box, "cost", "budget", "project cost"))
    length = _ig(box, "line length", "length", "total length")
    start = _first_year(_ig(box, "construction started", "started", "commenced", "begin"))
    eta = _first_year(_ig(box, "planned opening", "expected", "completion", "scheduled"))
    opened = _first_year(_ig(box, "opened", "operational", "inaugurated"))
    actual = opened if status in (ProjectStatus.operational, ProjectStatus.partially_operational) else None

    try:
        ptype = ProjectType(src["type"])
    except ValueError:
        ptype = ProjectType.road

    pid = f"live-{src['slug']}"
    localities = [s for s in src.get("localities", [])]

    impacts: list[ProjectLocalityImpact] = []
    horizon = TimeHorizon.h_0_1 if status in (ProjectStatus.operational, ProjectStatus.partially_operational) else TimeHorizon.h_1_3
    for slug in localities:
        impacts.append(ProjectLocalityImpact(
            id=f"imp-{pid}-{slug}", project_id=pid, locality_id=slug, locality_name=slug.replace("-", " ").title(),
            impact_type=src.get("categories", ["connectivity"])[0], impact_score=66.0, time_horizon=horizon,
            distance_km=None,
            explanation=f"{name} may affect {slug.replace('-', ' ').title()} ({ptype.value}). Live-ingested from Wikipedia — verify against official MMRDA/CIDCO/BMC sources.",
            positive_factors=["live source", "current status"], negative_factors=["tertiary source", "verify officially"],
            confidence_score=0.55,
        ))

    impact_bits = []
    if length:
        impact_bits.append(length)
    if budget:
        impact_bits.append(f"~₹{budget:,.0f} cr")
    impact_summary = (extract[:280] or f"{name} — live-ingested project.")
    risk_summary = "Live-ingested from a tertiary source (Wikipedia). Confirm status, cost and timeline against the official authority before relying on it."

    claim = RadarClaim(
        id=f"clm-{pid}", claim_text=f"{name}: status reported as '{status.value}'{(' · ' + ', '.join(impact_bits)) if impact_bits else ''} (Wikipedia, last revised {last_verified}).",
        claim_type="status", entity_type="project", entity_id=pid, project_id=pid,
        locality_id=localities[0] if localities else None,
        source_url=page_url, source_name="Wikipedia", source_type=SourceType.news, source_date=last_verified,
        extracted_at=last_verified, status=ClaimStatus.likely, confidence_score=0.6, reliability_score=0.55,
        evidence_snippet=(extract[:240] or None), last_checked_at=last_verified,
    )

    return RadarProject(
        id=pid, name=name, slug=pid, project_type=ptype, authority=src.get("authority", "—"),
        status=status, description=extract[:600], budget_amount=budget,
        start_date=start, expected_completion_date=eta, actual_completion_date=actual,
        source_url=page_url, source_type=SourceType.news, source_date=last_verified,
        reliability_score=0.55, confidence_score=0.6, last_verified_at=last_verified, stale=False,
        affected_localities=localities, impact_categories=src.get("categories", []),
        impact_summary=impact_summary, risk_summary=risk_summary, impacts=impacts, claims=[claim],
    )


# --------------------------------------------------------------------------- #
# Google News -> claims + alerts
# --------------------------------------------------------------------------- #
def _fetch_news(query: str, client: httpx.Client, limit: int = 4) -> list[dict[str, str]]:
    try:
        r = client.get(GOOGLE_NEWS_RSS.format(q=quote_plus(query)))
        if r.status_code != 200:
            return []
        root = ET.fromstring(r.text)
        items = []
        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            pub = (item.findtext("pubDate") or "").strip()
            src_el = item.find("source")
            source = src_el.text.strip() if src_el is not None and src_el.text else "News"
            if title:
                items.append({"title": title, "link": link, "pub": pub, "source": source})
            if len(items) >= limit:
                break
        return items
    except Exception as exc:
        logger.warning("news fetch failed for %r: %s", query, exc)
        return []


def _news_to_records(client: httpx.Client) -> tuple[list[RadarClaim], list[RadarAlert]]:
    claims: list[RadarClaim] = []
    alerts: list[RadarAlert] = []
    today = datetime.now(timezone.utc).date().isoformat()
    for entry in NEWS_QUERIES:
        slug, q = entry["slug"], entry["q"]
        for art in _fetch_news(q, client):
            key = f"{slug}:{art['title'][:80]}"
            if key in _SEEN_NEWS:
                continue
            _SEEN_NEWS.add(key)
            claims.append(RadarClaim(
                id=f"clm-news-{abs(hash(key)) % (10**10)}", claim_text=art["title"], claim_type="signal",
                entity_type="locality", entity_id=slug, locality_id=slug, source_url=art["link"] or None,
                source_name=art["source"], source_type=SourceType.news, source_date=today, extracted_at=today,
                status=ClaimStatus.likely, confidence_score=0.5, reliability_score=0.5,
                evidence_snippet=art["title"], last_checked_at=today,
            ))
    # Surface the newest few as alerts for the demo user.
    for c in claims[:5]:
        alerts.append(RadarAlert(
            id=f"alt-news-{c.id}", user_id="demo", locality_id=c.locality_id, alert_type="news_signal",
            title=f"News: {c.claim_text[:90]}", message=f"{c.source_name}: {c.claim_text}",
            priority="medium", status="unread", created_at=datetime.now(timezone.utc).isoformat(),
        ))
    return claims, alerts


# --------------------------------------------------------------------------- #
# Optional LLM extraction from an arbitrary URL
# --------------------------------------------------------------------------- #
def extract_project_from_url(url: str, hint: str | None = None) -> RadarProject | None:
    """Use an LLM to extract a structured project from an arbitrary page. Needs OPENAI_API_KEY."""
    try:
        from app.config import get_settings
        settings = get_settings()
        if not settings.openai_api_key:
            return None
        from bs4 import BeautifulSoup
        from openai import OpenAI
    except Exception:
        return None
    try:
        with _client() as client:
            r = client.get(url)
            if r.status_code != 200:
                return None
            text = BeautifulSoup(r.text, "html.parser").get_text(" ", strip=True)[:6000]
        oa = OpenAI(api_key=settings.openai_api_key)
        prompt = (
            "Extract a single infrastructure/redevelopment project from this page as JSON with keys: "
            "name, project_type (one of metro,rail,road,bridge,tunnel,coastal,airport,new_town,business_park,"
            "redevelopment,slum_redevelopment,mhada,sra,dp_road,public_realm,zoning,commercial_hub), authority, "
            "status (proposed,approved,tendering,under_construction,partially_operational,operational,delayed,stalled,cancelled), "
            "budget_crore (number or null), expected_completion_year (string or null), description (<=400 chars). "
            f"{('Context hint: ' + hint) if hint else ''}\n\nPAGE:\n{text}"
        )
        resp = oa.chat.completions.create(
            model=settings.openai_model, messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}, temperature=0,
        )
        import json
        data = json.loads(resp.choices[0].message.content or "{}")
        if not data.get("name"):
            return None
        try:
            ptype = ProjectType(data.get("project_type", "road"))
        except ValueError:
            ptype = ProjectType.road
        slug = re.sub(r"[^a-z0-9]+", "-", data["name"].lower()).strip("-")[:40]
        pid = f"live-llm-{slug}"
        today = datetime.now(timezone.utc).date().isoformat()
        return RadarProject(
            id=pid, name=data["name"], slug=pid, project_type=ptype, authority=data.get("authority") or "—",
            status=_map_status(data.get("status")), description=(data.get("description") or "")[:600],
            budget_amount=data.get("budget_crore"), expected_completion_date=data.get("expected_completion_year"),
            source_url=url, source_type=SourceType.document, source_date=today, reliability_score=0.6,
            confidence_score=0.6, last_verified_at=today, stale=False, affected_localities=[],
            impact_categories=[ptype.value], impact_summary=(data.get("description") or "")[:280],
            risk_summary="LLM-extracted from a single page; verify against the official source.",
            impacts=[], claims=[RadarClaim(
                id=f"clm-{pid}", claim_text=f"{data['name']} extracted from {url}.", claim_type="status",
                entity_type="project", entity_id=pid, project_id=pid, source_url=url, source_name="LLM extraction",
                source_type=SourceType.document, source_date=today, extracted_at=today, status=ClaimStatus.unverified,
                confidence_score=0.55, reliability_score=0.6, evidence_snippet=data.get("description"), last_checked_at=today,
            )],
        )
    except Exception as exc:
        logger.warning("LLM extraction failed for %s: %s", url, exc)
        return None


# --------------------------------------------------------------------------- #
# Merge into the live store + orchestration
# --------------------------------------------------------------------------- #
def _upsert_project(project: RadarProject) -> str:
    """Insert or update a project in the radar_data store. Returns 'created'|'updated'."""
    from app.services import radar_data as rd
    existing = rd.PROJECT_BY_ID.get(project.id)
    if existing:
        idx = rd.PROJECTS.index(existing)
        rd.PROJECTS[idx] = project
        rd.PROJECT_BY_ID[project.id] = project
        action = "updated"
    else:
        rd.PROJECTS.append(project)
        rd.PROJECT_BY_ID[project.id] = project
        action = "created"
    # refresh this project's claims in the ledger
    rd.CLAIMS_BY_PROJECT[project.id] = list(project.claims)
    for c in project.claims:
        if all(c.id != existing_c.id for existing_c in rd.CLAIMS):
            rd.CLAIMS.append(c)
        if c.locality_id:
            bucket = rd.CLAIMS_BY_LOCALITY.setdefault(c.locality_id, [])
            if all(c.id != x.id for x in bucket):
                bucket.append(c)
    return action


def _add_news(claims: list[RadarClaim], alerts: list[RadarAlert]) -> int:
    from app.services import radar_data as rd
    added = 0
    for c in claims:
        if all(c.id != x.id for x in rd.CLAIMS):
            rd.CLAIMS.append(c)
            added += 1
        if c.locality_id:
            bucket = rd.CLAIMS_BY_LOCALITY.setdefault(c.locality_id, [])
            if all(c.id != x.id for x in bucket):
                bucket.append(c)
    demo_alerts = rd.ALERTS.setdefault("demo", [])
    existing_ids = {a.id for a in demo_alerts}
    for a in alerts:
        if a.id not in existing_ids:
            demo_alerts.insert(0, a)  # newest first
    return added


def ingest_live(use_llm_urls: list[str] | None = None) -> list[IngestionJob]:
    """Fetch live data and merge it into the Radar store. Returns ingestion jobs with real counts."""
    from app.services import radar_data as rd

    if _running.is_set():
        logger.info("ingest already running; skipping concurrent run")
        return []
    _running.set()
    jobs: list[IngestionJob] = []
    started = rd._now()
    try:
        created = updated = failed = 0
        with _client() as client:
            with ThreadPoolExecutor(max_workers=8) as pool:
                futures = {pool.submit(_build_live_project, src, client): src for src in LIVE_PROJECT_SOURCES}
                projects: list[RadarProject] = []
                for fut in as_completed(futures):
                    try:
                        p = fut.result()
                    except Exception:
                        p = None
                    if p:
                        projects.append(p)
                    else:
                        failed += 1
            with _LOCK:
                for p in projects:
                    action = _upsert_project(p)
                    created += action == "created"
                    updated += action == "updated"
            news_claims, news_alerts = _news_to_records(client)
            with _LOCK:
                news_added = _add_news(news_claims, news_alerts)

        jobs.append(IngestionJob(
            id=rd._uid("job"), source_name="Wikipedia (Mumbai/MMR projects)", source_url="https://en.wikipedia.org/",
            job_type="project", status="completed", records_found=len(LIVE_PROJECT_SOURCES),
            records_created=created, records_updated=updated, error_message=(f"{failed} sources unreachable" if failed else None),
            started_at=started, completed_at=rd._now(),
        ))
        jobs.append(IngestionJob(
            id=rd._uid("job"), source_name="Google News (locality signals)", source_url="https://news.google.com/",
            job_type="signal", status="completed", records_found=news_added, records_created=news_added,
            records_updated=0, started_at=started, completed_at=rd._now(),
        ))

        # Optional LLM extraction from explicit URLs
        for url in (use_llm_urls or []):
            p = extract_project_from_url(url)
            if p:
                with _LOCK:
                    _upsert_project(p)
                jobs.append(IngestionJob(
                    id=rd._uid("job"), source_name=f"LLM extraction: {url}", source_url=url, job_type="project",
                    status="completed", records_found=1, records_created=1, records_updated=0,
                    started_at=started, completed_at=rd._now(),
                ))

        rd.INGESTION_JOBS.extend(jobs)
        rd._audit("ingest.live", "ingestion", None,
                  f"Live ingest: {created} projects created, {updated} updated, {failed} unreachable; news signals merged.")
        _LAST_RUN.update({"at": rd._now(), "projects": created + updated, "claims": len(rd.CLAIMS)})
        logger.info("live ingest done: created=%s updated=%s failed=%s", created, updated, failed)
    finally:
        _running.clear()
    return jobs


def ingest_single(source: Any) -> IngestionJob:
    """Real single-source ingest used by POST /ingest/source. LLM-extracts if a URL + key are present."""
    from app.services import radar_data as rd
    started = rd._now()
    url = getattr(source, "source_url", None)
    name = getattr(source, "source_name", "manual source")
    created = 0
    err = None
    if url:
        p = extract_project_from_url(url, hint=name)
        if p:
            with _LOCK:
                _upsert_project(p)
            created = 1
        else:
            err = "Could not extract a project (no OpenAI key, unreachable, or no parseable project)."
    else:
        err = "No source_url provided; nothing to fetch."
    job = IngestionJob(
        id=rd._uid("job"), source_name=name, source_url=url, job_type=getattr(source, "job_type", "project"),
        status="completed" if created else "failed", records_found=created, records_created=created,
        records_updated=0, error_message=err, started_at=started, completed_at=rd._now(),
    )
    rd.INGESTION_JOBS.append(job)
    rd._audit("ingest.source", "ingestion", job.id, f"Live single-source ingest from {name}: {created} created. {err or ''}".strip())
    return job


def last_run() -> dict[str, Any]:
    return dict(_LAST_RUN)
