import re
from urllib.parse import urlparse
from typing import Optional
from ..schemas.email import UrlInspectionFinding

URL_EXTRACTOR_REGEX = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+', re.IGNORECASE)
IPV4_REGEX = re.compile(r'^(?:\d{1,3}\.){3}\d{1,3}$')
SUSPICIOUS_TLDS = {".xyz", ".top", ".cc", ".tk", ".buzz", ".ml", ".ga", ".cf", ".gq", ".work", ".click"}
LOOKALIKE_PATTERNS = [
    (r'paypa[1l]', "PayPal lookalike substitution"),
    (r'micr[o0]s[o0]ft', "Microsoft lookalike substitution"),
    (r'g[o0]{2}gle', "Google lookalike substitution"),
    (r'app[1l]e', "Apple lookalike substitution"),
    (r'amaz[o0]n', "Amazon lookalike substitution"),
    (r'netf[1l]ix', "Netflix lookalike substitution"),
    (r'docus[1i]gn', "DocuSign lookalike substitution"),
    (r'wellsf[a4]rgo', "Wells Fargo lookalike substitution"),
]

def inspect_links_in_text(text: str) -> list[UrlInspectionFinding]:
    """
    Safely extracts and statically parses URLs from text without performing network requests.
    Identifies syntactic risk factors such as IP-address hostnames, typosquatting, and risky TLDs.
    """
    raw_urls = URL_EXTRACTOR_REGEX.findall(text)
    findings: list[UrlInspectionFinding] = []
    seen_urls = set()

    for raw_url in raw_urls:
        clean_url = raw_url.strip(".,;:()[]{}<>\"'")
        if not clean_url or clean_url in seen_urls:
            continue
        seen_urls.add(clean_url)

        # Normalize URL for parsing if scheme is missing
        parseable_url = clean_url if clean_url.startswith(("http://", "https://")) else f"http://{clean_url}"

        try:
            parsed = urlparse(parseable_url)
            hostname = (parsed.hostname or "").lower()
            try:
                port = parsed.port
            except ValueError:
                port = None
        except Exception:
            findings.append(UrlInspectionFinding(
                raw_url=clean_url,
                scheme="unknown",
                hostname="unparseable",
                path="",
                port=None,
                is_ip_address=False,
                has_lookalike_domain=False,
                suspicious_tld=False,
                indicators=["Malformed or unparseable URL syntax"],
                severity="medium"
            ))
            continue

        path = parsed.path or "/"
        indicators: list[str] = []
        severity = "clean"

        # 1. IP Address Host Check
        is_ip = bool(IPV4_REGEX.match(hostname))
        if is_ip:
            indicators.append("Hostname is a direct numerical IPv4 address rather than a registered domain")
            severity = "critical"

        # 2. Lookalike / Homoglyph Check
        has_lookalike = False
        for pattern, desc in LOOKALIKE_PATTERNS:
            if re.search(pattern, hostname, re.IGNORECASE):
                indicators.append(f"Potential typosquatting pattern detected: {desc}")
                has_lookalike = True
                severity = "critical"
                break

        # 3. High-Risk TLD Check
        suspicious_tld = False
        for tld in SUSPICIOUS_TLDS:
            if hostname.endswith(tld):
                indicators.append(f"Domain uses high-abuse top-level domain ({tld})")
                suspicious_tld = True
                if severity != "critical":
                    severity = "high"
                break

        # 4. Insecure HTTP Protocol with sensitive keywords
        if parsed.scheme == "http":
            indicators.append("Unencrypted HTTP protocol used")
            if any(k in (path + (parsed.query or "")).lower() for k in ["login", "signin", "auth", "verify", "password", "token"]):
                indicators.append("Authentication path served over unencrypted HTTP")
                if severity == "clean":
                    severity = "high"
            elif severity == "clean":
                severity = "medium"

        # 5. Excessive subdomains (e.g. login.paypal.com.suspicious-domain.com)
        subdomain_parts = hostname.split(".")
        if len(subdomain_parts) > 4 and not is_ip:
            indicators.append("Unusually high number of subdomains (>4), often used to disguise actual landing domain")
            if severity in ("clean", "low"):
                severity = "medium"

        # 6. Embedded credential / token parameters
        if parsed.query and any(p in parsed.query.lower() for p in ["token=", "session=", "key=", "pwd=", "redirect="]):
            indicators.append("Query string carries authentication token or explicit redirect parameter")
            if severity == "clean":
                severity = "low"

        findings.append(UrlInspectionFinding(
            raw_url=clean_url,
            scheme=parsed.scheme or "http",
            hostname=hostname or "unknown",
            path=path,
            port=port,
            is_ip_address=is_ip,
            has_lookalike_domain=has_lookalike,
            suspicious_tld=suspicious_tld,
            indicators=indicators,
            severity=severity
        ))

    return findings

