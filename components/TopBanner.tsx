"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Blocks,
  Check,
  ChevronDown,
  Command,
  FileText,
  Globe2,
  LayoutDashboard,
  LayoutTemplate,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

type SearchItemType =
  | "page"
  | "block"
  | "template"
  | "area"
  | "brand"
  | "approval";

type SearchItem = {
  id: string;
  type: SearchItemType;
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
  regionId?: string;
  regionName?: string;
  templateId?: string;
  templateName?: string;
  url?: string;
  isRecent?: boolean;
};

type RecentSearch = {
  id: string;
  query: string;
  title: string;
  subtitle: string;
  href: string;
  type: SearchItemType;
  savedAt: string;
};

type Region = {
  id: string;
  name: string;
  country: string;
  locale: string;
};

const AVAILABLE_REGIONS: Region[] = [
  {
    id: "mediascout-uk",
    name: "Mediascout UK",
    country: "United Kingdom",
    locale: "en-GB",
  },
  {
    id: "mediascout-dubai",
    name: "Mediascout Dubai",
    country: "United Arab Emirates",
    locale: "en-AE",
  },
  {
    id: "mediascout-france",
    name: "Mediascout France",
    country: "France",
    locale: "fr-FR",
  },
];

const RECENT_SEARCHES_KEY = "visionir:recent-searches";
const MAX_RECENT_SEARCHES = 6;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalise(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function normaliseUrl(value: unknown) {
  let cleaned = String(value || "").trim().toLowerCase();

  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {}

  cleaned = cleaned
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("?")[0]
    .split("#")[0];

  const firstSlashIndex = cleaned.indexOf("/");
  if (firstSlashIndex >= 0) cleaned = cleaned.slice(firstSlashIndex);

  return cleaned.replace(/^\/+/, "").replace(/\/+$/, "");
}

function getRegionLabel(regionId: unknown) {
  const matched = AVAILABLE_REGIONS.find((region) => region.id === regionId);
  return matched?.name || "";
}

function getItemRegionId(data: Record<string, unknown>, fallbackRegionId: string) {
  const regionId =
    typeof data.regionId === "string"
      ? data.regionId
      : typeof data.region === "string"
        ? data.region
        : "";

  return regionId || fallbackRegionId;
}

function getItemTemplateName(data: Record<string, unknown>) {
  return typeof data.templateName === "string" && data.templateName.trim()
    ? data.templateName.trim()
    : "";
}

function getPossibleUrls(...values: unknown[]) {
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .flatMap((value) => {
      const normalised = normaliseUrl(value);
      return [value, normalised, `/${normalised}`].filter(Boolean);
    });
}

export default function TopBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const role = searchParams.get("role") || "admin";
  const regionFromUrl = searchParams.get("region");

  const searchRef = useRef<HTMLDivElement | null>(null);
  const regionRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [globalQuery, setGlobalQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState(
    AVAILABLE_REGIONS[0].id
  );
  const [dynamicItems, setDynamicItems] = useState<SearchItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  const selectedRegion =
    AVAILABLE_REGIONS.find((region) => region.id === selectedRegionId) ||
    AVAILABLE_REGIONS[0];

  useEffect(() => {
    if (
      regionFromUrl &&
      AVAILABLE_REGIONS.some((region) => region.id === regionFromUrl)
    ) {
      setSelectedRegionId(regionFromUrl);
      window.localStorage.setItem("visionir:selected-region", regionFromUrl);
      return;
    }

    const storedRegionId = window.localStorage.getItem(
      "visionir:selected-region"
    );

    if (
      storedRegionId &&
      AVAILABLE_REGIONS.some((region) => region.id === storedRegionId)
    ) {
      setSelectedRegionId(storedRegionId);

      const params = new URLSearchParams(searchParams.toString());
      params.set("region", storedRegionId);

      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [pathname, regionFromUrl, router, searchParams]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : []);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  function saveRecentSearch(item: SearchItem) {
    const query = globalQuery.trim() || item.title;

    const nextItem: RecentSearch = {
      id: `${item.type}-${item.id}`,
      query,
      title: item.title,
      subtitle: item.subtitle,
      href: item.href,
      type: item.type,
      savedAt: new Date().toISOString(),
    };

    setRecentSearches((current) => {
      const next = [
        nextItem,
        ...current.filter((recent) => recent.href !== item.href),
      ].slice(0, MAX_RECENT_SEARCHES);

      try {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {}

      return next;
    });
  }

  function clearRecentSearches() {
    setRecentSearches([]);

    try {
      window.localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  }

  function buildHref(path: string) {
    const params = new URLSearchParams();
    params.set("role", role);
    params.set("region", selectedRegionId);

    return `${path}?${params.toString()}`;
  }

  function handleSelectRegion(region: Region) {
    setSelectedRegionId(region.id);
    setIsRegionOpen(false);

    window.localStorage.setItem("visionir:selected-region", region.id);

    const params = new URLSearchParams(searchParams.toString());
    params.set("region", region.id);
    params.set("role", role);

    router.push(`${pathname}?${params.toString()}`);
  }

  const staticItems = useMemo<SearchItem[]>(
    () => [
      {
        id: "regions",
        type: "area",
        title: "Regions",
        subtitle: `Switch between ${AVAILABLE_REGIONS.map(
          (region) => region.name
        ).join(", ")}`,
        href: buildHref("/dashboard"),
        keywords: [
          "regions",
          "region picker",
          "countries",
          "sites",
          "markets",
          selectedRegion.name,
          selectedRegion.country,
          selectedRegion.locale,
          ...AVAILABLE_REGIONS.flatMap((region) => [
            region.id,
            region.name,
            region.country,
            region.locale,
          ]),
        ],
      },
      {
        id: "dashboard",
        type: "area",
        title: "Dashboard",
        subtitle: "Overview, activity and workspace summary",
        href: buildHref("/dashboard"),
        keywords: ["dashboard", "home", "overview", "summary", "activity"],
      },
      {
        id: "pages",
        type: "area",
        title: "Pages",
        subtitle: "Search and manage governed pages",
        href: buildHref("/pages"),
        keywords: ["pages", "page library", "web pages", "urls", "slugs"],
      },
      {
        id: "blocks",
        type: "area",
        title: "Blocks",
        subtitle: "Search reusable governed blocks",
        href: buildHref("/blocks"),
        keywords: ["blocks", "block library", "components", "reusable assets"],
      },
      {
        id: "templates",
        type: "area",
        title: "Templates",
        subtitle: "Global governed page structures and section rules",
        href: buildHref("/templates"),
        keywords: ["templates", "page templates", "sections", "structure"],
      },
      {
        id: "brand-system",
        type: "brand",
        title: "Brand System",
        subtitle: "Governance rules, brand controls and tokens",
        href: buildHref("/brand"),
        keywords: [
          "brand",
          "brand system",
          "governance",
          "tokens",
          "rules",
          "cta",
          "accessibility",
        ],
      },
      {
        id: "approvals",
        type: "approval",
        title: "Approvals",
        subtitle: "Review pages and blocks awaiting approval",
        href: buildHref("/approvals"),
        keywords: [
          "approvals",
          "approval",
          "review",
          "pending",
          "workflow",
          "sign off",
        ],
      },
      {
        id: "block-types",
        type: "area",
        title: "Block Types",
        subtitle: "Manage available block patterns and variants",
        href: buildHref("/block-types"),
        keywords: [
          "block types",
          "components",
          "variants",
          "patterns",
          "hero",
          "cta",
          "faq",
          "stats",
        ],
      },
    ],
    [role, selectedRegionId]
  );

  useEffect(() => {
    async function loadSearchData() {
      const nextItems: SearchItem[] = [];

      const requests = await Promise.allSettled([
        fetch(`/api/pages?role=${role}&region=${selectedRegionId}`, { cache: "no-store" }),
        fetch(`/api/blocks?role=${role}&region=${selectedRegionId}`, { cache: "no-store" }),
        fetch(`/api/templates?role=${role}&region=${selectedRegionId}`, { cache: "no-store" }),
      ]);

      const [pagesRes, blocksRes, templatesRes] = requests;

      if (pagesRes.status === "fulfilled" && pagesRes.value.ok) {
        const json = await pagesRes.value.json().catch(() => ({}));
        const pages = Array.isArray(json?.pages) ? json.pages : [];

        pages.forEach((page: any) => {
          const pageRegionId = getItemRegionId(page, selectedRegionId);
          const pageRegionName = getRegionLabel(pageRegionId) || selectedRegion.name;
          const pageTemplateName = page.templateName || "No template";
          const pageUrls = getPossibleUrls(page.slug, page.url, page.path, page.href);

          nextItems.push({
            id: `page-${page.id}`,
            type: "page",
            title: page.name || "Untitled page",
            subtitle: `${page.slug || "No slug"} · ${pageTemplateName} · ${pageRegionName}`,
            href: buildHref(`/pages/${page.id}`),
            regionId: pageRegionId,
            regionName: pageRegionName,
            templateId: page.templateId,
            templateName: pageTemplateName,
            url: page.slug || page.url || page.path || "",
            keywords: [
              page.name,
              page.slug,
              page.url,
              page.path,
              page.href,
              ...pageUrls,
              pageTemplateName,
              page.templateId,
              page.status,
              pageRegionId,
              pageRegionName,
              "page url",
              "url",
              "slug",
              "template",
              "region",
            ],
          });
        });
      }

      if (blocksRes.status === "fulfilled" && blocksRes.value.ok) {
        const json = await blocksRes.value.json().catch(() => ({}));
        const blocks = Array.isArray(json?.blocks) ? json.blocks : [];

        blocks.forEach((block: any) => {
          const data = block.data || {};
          const blockRegionId = getItemRegionId(data, selectedRegionId);
          const blockRegionName = getRegionLabel(blockRegionId) || selectedRegion.name;
          const blockTemplateName = getItemTemplateName(data);
          const blockUrls = getPossibleUrls(
            data.pageUrl,
            data.pageSlug,
            data.pagePath,
            data.url,
            data.slug
          );

          nextItems.push({
            id: `block-${block.id}`,
            type: "block",
            title:
              data.headline ||
              data.eyebrow ||
              data.name ||
              `Block ${String(block.id).slice(0, 8)}`,
            subtitle: `${data.componentType || "Block"} · ${
              data.pageName || "No page"
            } · ${blockRegionName}`,
            href: buildHref(`/blocks/${block.id}/details`),
            regionId: blockRegionId,
            regionName: blockRegionName,
            templateId: typeof data.templateId === "string" ? data.templateId : "",
            templateName: blockTemplateName,
            url:
              typeof data.pageUrl === "string"
                ? data.pageUrl
                : typeof data.pageSlug === "string"
                  ? data.pageSlug
                  : "",
            keywords: [
              data.headline,
              data.eyebrow,
              data.name,
              data.pageName,
              data.pageUrl,
              data.pageSlug,
              data.pagePath,
              data.url,
              data.slug,
              ...blockUrls,
              data.templateName,
              data.templateId,
              data.sectionLabel,
              data.componentType,
              data.componentVariant,
              block.status,
              blockRegionId,
              blockRegionName,
              "block url",
              "page url",
              "url",
              "slug",
              "template",
              "region",
            ],
          });
        });
      }

      if (templatesRes.status === "fulfilled" && templatesRes.value.ok) {
        const json = await templatesRes.value.json().catch(() => ({}));

        const templates = Array.isArray(json?.templates)
          ? json.templates
          : [];

        templates.forEach((template: any) => {
          nextItems.push({
            id: `template-${template.id}`,
            type: "template",
            title: template.name || "Untitled template",
            subtitle: `${template.category || "Template"} · Global template`,
            href: buildHref(`/templates/${template.id}`),
            regionId: "global",
            regionName: "Global",
            templateId: template.id,
            templateName: template.name,
            keywords: [
              template.name,
              template.slug,
              template.category,
              template.status,
              template.id,
              "template",
              "global template",
              "shared template",
              "all regions",
            ],
          });
        });
      }

      setDynamicItems(nextItems);
    }

    void loadSearchData();
  }, [role, selectedRegionId, selectedRegion.name]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }

      if (!regionRef.current?.contains(event.target as Node)) {
        setIsRegionOpen(false);
      }
    }

    function handleShortcut(event: KeyboardEvent) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      if (event.key === "Escape") {
        setIsOpen(false);
        setIsRegionOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleShortcut);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const recentItems = useMemo<SearchItem[]>(
    () =>
      recentSearches.map((recent) => ({
        id: `recent-${recent.id}`,
        type: recent.type,
        title: recent.title,
        subtitle: `Recent search · ${recent.subtitle}`,
        href: recent.href,
        keywords: [recent.query, recent.title, recent.subtitle],
        isRecent: true,
      })),
    [recentSearches]
  );

  const allItems = useMemo(
    () => [...staticItems, ...dynamicItems],
    [staticItems, dynamicItems]
  );

  const results = useMemo(() => {
    const q = normalise(globalQuery);
    const urlQuery = normaliseUrl(globalQuery);

    if (!q) return [...recentItems, ...allItems].slice(0, 10);

    return allItems
      .map((item) => {
        const searchable = [
          item.title,
          item.subtitle,
          item.type,
          item.regionId,
          item.regionName,
          item.templateId,
          item.templateName,
          item.url,
          ...item.keywords,
        ];

        let score = 0;

        searchable.forEach((keyword) => {
          const keywordText = normalise(keyword);
          const keywordUrl = normaliseUrl(keyword);

          if (!keywordText && !keywordUrl) return;

          if (keywordText === q) score += 12;
          else if (keywordText.startsWith(q)) score += 8;
          else if (keywordText.includes(q)) score += 4;

          if (urlQuery && keywordUrl === urlQuery) score += 16;
          else if (urlQuery && keywordUrl.includes(urlQuery)) score += 10;
        });

        if (item.regionId === selectedRegionId) score += 2;
        if (item.type === "page" && urlQuery) score += 1;
        if (item.type === "block" && urlQuery) score += 1;

        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
      .slice(0, 12);
  }, [globalQuery, allItems, recentItems, selectedRegionId]);

  function getIcon(type: SearchItemType) {
    if (type === "page") return <FileText className="h-4 w-4" />;
    if (type === "block") return <Blocks className="h-4 w-4" />;
    if (type === "template") return <LayoutTemplate className="h-4 w-4" />;
    if (type === "brand") return <ShieldCheck className="h-4 w-4" />;
    if (type === "approval") return <Sparkles className="h-4 w-4" />;

    return <LayoutDashboard className="h-4 w-4" />;
  }

  function openResult(item: SearchItem) {
    saveRecentSearch(item);
    router.push(item.href);
    setGlobalQuery("");
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-[#1b2233] bg-[#0b0f1a]/95 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-4">
          <Image
            src="/visionirlonglogo.svg"
            alt="Visionir"
            width={140}
            height={34}
            priority
            className="object-contain"
          />

          <div ref={regionRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setIsRegionOpen((current) => !current)}
              className="group inline-flex h-11 items-center gap-2 rounded-2xl border border-[#20283a] bg-[#111827]/80 px-4 text-left transition hover:border-[#2d3750] hover:bg-[#161d2d]"
            >
              <p className="truncate text-sm font-semibold text-gray-100">
                {selectedRegion.name}
              </p>

              <ChevronDown
                className={cx(
                  "h-4 w-4 shrink-0 text-gray-500 transition group-hover:text-gray-300",
                  isRegionOpen && "rotate-180 text-gray-300"
                )}
              />
            </button>

            {isRegionOpen ? (
              <div className="absolute left-0 top-[52px] w-[300px] overflow-hidden rounded-2xl border border-[#20283a] bg-[#0f1522] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                <div className="px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Organisation regions
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Regions configured for this organisation.
                  </p>
                </div>

                <div className="mt-1 space-y-1">
                  {AVAILABLE_REGIONS.map((region) => {
                    const isSelected = region.id === selectedRegion.id;

                    return (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => handleSelectRegion(region)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#171f31]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#151d2d] text-[#8ea2ff]">
                          <Globe2 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {region.name}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {region.country}
                          </p>
                        </div>

                        {isSelected ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div ref={searchRef} className="relative hidden w-[500px] xl:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />

            <input
              ref={inputRef}
              value={globalQuery}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                setIsOpen(true);
              }}
              placeholder="Search pages, URLs, blocks, templates, regions..."
              className="h-11 w-full rounded-2xl border border-[#20283a] bg-[#111827]/80 pl-11 pr-20 text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-[#5b7cff] focus:ring-4 focus:ring-[#5b7cff]/10"
            />

            {globalQuery ? (
              <button
                type="button"
                onClick={() => setGlobalQuery("")}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg border border-[#2a3147] bg-[#0f1522] px-2 py-1 text-[11px] text-gray-500">
              <Command className="h-3 w-3" />K
            </div>

            {isOpen ? (
              <div className="absolute left-0 top-[52px] w-full overflow-hidden rounded-2xl border border-[#20283a] bg-[#0f1522] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                {results.length > 0 ? (
                  <div className="max-h-[480px] overflow-y-auto p-2">
                    {!globalQuery.trim() && recentSearches.length > 0 ? (
                      <div className="mb-1 flex items-center justify-between px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                          Recent searches
                        </p>

                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-[11px] font-medium text-gray-500 transition hover:text-gray-300"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="mb-1 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                          Searching {selectedRegion.name} + global templates
                        </p>
                      </div>
                    )}

                    {results.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openResult(item)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#171f31]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#151d2d] text-[#8ea2ff]">
                          {getIcon(item.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">
                            {item.title}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {item.subtitle}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {item.regionName ? (
                            <span className="max-w-[90px] truncate rounded-full border border-[#2a3147] px-2 py-1 text-[10px] font-semibold text-gray-500">
                              {item.regionName}
                            </span>
                          ) : null}

                          {item.templateName && item.type !== "template" ? (
                            <span className="max-w-[90px] truncate rounded-full border border-[#2a3147] px-2 py-1 text-[10px] font-semibold text-gray-500">
                              {item.templateName}
                            </span>
                          ) : null}

                          <span className="rounded-full border border-[#2a3147] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                            {item.isRecent ? "recent" : item.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm font-medium text-gray-300">
                      No results found
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Try searching by page URL, block URL, region name,
                      template name, approvals or brand system.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-[#2a3147] px-4 py-2 text-sm text-gray-300 transition hover:bg-[#161b28] hover:text-white">
            Help
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c2335] text-sm font-medium text-white ring-1 ring-[#2a3147]">
            V
          </div>
        </div>
      </div>
    </header>
  );
}