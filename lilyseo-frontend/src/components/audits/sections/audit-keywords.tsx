"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Search, ArrowUpDown, Download, FileText } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

// Import visualization components
import { KeywordTrendsChart } from "../charts/keyword-trends-chart";
import { KeywordDistributionChart } from "../charts/keyword-distribution-chart";
import { KeywordScatterChart } from "../charts/keyword-scatter-chart";

interface Keyword {
  keyword: string;
  rank: number;
  previousRank: number;
  volume: number;
  difficulty: number;
  intent: string;
  url: string;
  lastUpdated: string;
  history?: Array<{
    date: string;
    rank: number;
  }>;
}

interface AuditKeywordsProps {
  keywords: Keyword[];
  projectUrl: string;
  historyData?: {
    [keywordId: string]: Array<{
      date: string;
      rank: number;
    }>;
  };
  onExportPdf?: () => void;
}

export function AuditKeywords({ keywords, projectUrl, historyData, onExportPdf }: AuditKeywordsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterIntent, setFilterIntent] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("trends");

  // Get rank change indicator
  const getRankChange = (current: number, previous: number) => {
    if (current === previous) return <Minus className="h-4 w-4 text-gray-500" />;
    if (current < previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // Get difficulty badge variant
  const getDifficultyBadge = (difficulty: number) => {
    if (difficulty <= 30) return "default";
    if (difficulty <= 60) return "secondary";
    return "destructive";
  };

  // Filter and sort keywords
  const getFilteredKeywords = useCallback(() => {
    let filtered = [...keywords];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        kw => kw.keyword.toLowerCase().includes(query)
      );
    }

    // Filter by intent
    if (filterIntent !== "all") {
      filtered = filtered.filter(
        kw => kw.intent.toLowerCase() === filterIntent.toLowerCase()
      );
    }

    // Sort keywords
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Keyword];
      const bValue = b[sortBy as keyof Keyword];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [keywords, searchQuery, filterIntent, sortBy, sortOrder]);

  const filteredKeywords = getFilteredKeywords();

  // Export keywords data as CSV
  const exportKeywordsCSV = () => {
    const headers = ["Keyword", "Rank", "Previous Rank", "Change", "Volume", "Difficulty", "Intent", "URL", "Last Updated"];
    const csvContent = [
      headers.join(","),
      ...filteredKeywords.map(kw => [
        `"${kw.keyword}"`, // Quote to handle commas in keywords
        kw.rank,
        kw.previousRank,
        kw.previousRank - kw.rank,
        kw.volume,
        kw.difficulty,
        kw.intent,
        `"${kw.url}"`, // Quote to handle commas in URLs
        kw.lastUpdated
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `keywords-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Setup virtualization for the table
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: filteredKeywords.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // Approximate row height
    overscan: 10,
  });

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportKeywordsCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        {onExportPdf && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExportPdf}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Keywords</CardTitle>
            <CardDescription>Tracked keywords</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {keywords.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Position</CardTitle>
            <CardDescription>Average ranking position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {keywords.length > 0 
                ? (keywords.reduce((acc, kw) => acc + kw.rank, 0) / keywords.length).toFixed(1)
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Keywords</CardTitle>
            <CardDescription>Keywords ranking in top 10</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {keywords.filter(kw => kw.rank <= 10).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Keyword Analysis</CardTitle>
              <CardDescription>
                Visualize your keyword performance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={activeTab === "trends" ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveTab("trends")}
              >
                Trends
              </Button>
              <Button 
                variant={activeTab === "distribution" ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveTab("distribution")}
              >
                Distribution
              </Button>
              <Button 
                variant={activeTab === "scatter" ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveTab("scatter")}
              >
                Volume vs Difficulty
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {activeTab === "trends" && (
              <KeywordTrendsChart 
                keywords={keywords} 
                historyData={historyData}
              />
            )}
            {activeTab === "distribution" && (
              <KeywordDistributionChart 
                keywords={keywords} 
              />
            )}
            {activeTab === "scatter" && (
              <KeywordScatterChart 
                keywords={keywords} 
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
          <CardDescription>
            All tracked keywords and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select
                value={filterIntent}
                onValueChange={setFilterIntent}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Intents</SelectItem>
                  <SelectItem value="informational">Informational</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="navigational">Navigational</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table with virtualization */}
            <div className="border rounded-md">
              <div className="bg-muted border-b">
                <div className="grid grid-cols-7 gap-4 px-4 py-3 text-sm font-medium">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      if (sortBy === "keyword") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("keyword");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    Keyword
                    {sortBy === "keyword" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      if (sortBy === "rank") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("rank");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    Rank
                    {sortBy === "rank" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                  <div>Change</div>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      if (sortBy === "volume") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("volume");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    Volume
                    {sortBy === "volume" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      if (sortBy === "difficulty") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("difficulty");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    Difficulty
                    {sortBy === "difficulty" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      if (sortBy === "intent") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("intent");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    Intent
                    {sortBy === "intent" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                  <div>URL</div>
                </div>
              </div>

              <div 
                ref={parentRef} 
                className="h-[400px] overflow-auto"
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const keyword = filteredKeywords[virtualRow.index];
                    return (
                      <div
                        key={virtualRow.index}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className={`grid grid-cols-7 gap-4 px-4 py-3 text-sm ${virtualRow.index % 2 ? 'bg-muted/50' : ''}`}>
                          <div className="font-medium truncate">
                            {keyword.keyword}
                          </div>
                          <div>{keyword.rank}</div>
                          <div>
                            <div className="flex items-center">
                              {getRankChange(keyword.rank, keyword.previousRank)}
                              <span className="ml-1 text-sm">
                                {Math.abs(keyword.rank - keyword.previousRank)}
                              </span>
                            </div>
                          </div>
                          <div>{keyword.volume.toLocaleString()}</div>
                          <div>
                            <Badge variant={getDifficultyBadge(keyword.difficulty)}>
                              {keyword.difficulty}
                            </Badge>
                          </div>
                          <div>
                            <Badge variant="outline">
                              {keyword.intent}
                            </Badge>
                          </div>
                          <div className="truncate">
                            <a
                              href={keyword.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {keyword.url.replace(projectUrl, '')}
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {filteredKeywords.length === 0 && (
                <div className="h-24 flex items-center justify-center text-muted-foreground">
                  No keywords found
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 