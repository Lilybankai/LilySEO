"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, Download, ExternalLink, Link2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

// Import visualization components
import { BacklinksGrowthChart } from "../charts/backlinks-growth-chart";
import { BacklinksDomainAuthorityChart } from "../charts/backlinks-domain-authority-chart";

interface Backlink {
  id: string;
  url: string;
  domain: string;
  title: string;
  anchorText: string;
  domainAuthority: number;
  pageAuthority: number;
  isDoFollow: boolean;
  firstDiscovered: string;
  lastChecked: string;
}

interface AuditBacklinksProps {
  backlinks: Backlink[];
  projectUrl: string;
}

export function AuditBacklinks({ backlinks, projectUrl }: AuditBacklinksProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("domainAuthority");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("growth");

  // Filter and sort backlinks
  const getFilteredBacklinks = useCallback(() => {
    let filtered = [...backlinks];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        bl => 
          bl.url.toLowerCase().includes(query) ||
          bl.domain.toLowerCase().includes(query) ||
          bl.title.toLowerCase().includes(query) ||
          bl.anchorText.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType === "dofollow") {
      filtered = filtered.filter(bl => bl.isDoFollow);
    } else if (filterType === "nofollow") {
      filtered = filtered.filter(bl => !bl.isDoFollow);
    }

    // Sort backlinks
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof Backlink];
      const bValue = b[sortBy as keyof Backlink];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        return sortOrder === "asc" 
          ? (aValue === bValue ? 0 : aValue ? 1 : -1)
          : (aValue === bValue ? 0 : aValue ? -1 : 1);
      }

      return 0;
    });

    return filtered;
  }, [backlinks, searchQuery, filterType, sortBy, sortOrder]);

  const filteredBacklinks = getFilteredBacklinks();

  // Export backlinks data as CSV
  const exportBacklinksCSV = () => {
    const headers = ["URL", "Domain", "Title", "Anchor Text", "Domain Authority", "Page Authority", "Type", "First Discovered", "Last Checked"];
    const csvContent = [
      headers.join(","),
      ...filteredBacklinks.map(bl => [
        `"${bl.url}"`, // Quote to handle commas in URLs
        `"${bl.domain}"`,
        `"${bl.title.replace(/"/g, '""')}"`, // Escape quotes in titles
        `"${bl.anchorText.replace(/"/g, '""')}"`, // Escape quotes in anchor text
        bl.domainAuthority,
        bl.pageAuthority,
        bl.isDoFollow ? "DoFollow" : "NoFollow",
        bl.firstDiscovered,
        bl.lastChecked
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `backlinks-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Setup virtualization for the table
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: filteredBacklinks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // Approximate row height
    overscan: 10,
  });

  // Get domain authority badge variant
  const getDomainAuthorityBadge = (authority: number) => {
    if (authority >= 70) return "default";
    if (authority >= 40) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportBacklinksCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Backlinks</CardTitle>
            <CardDescription>All discovered backlinks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {backlinks.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referring Domains</CardTitle>
            <CardDescription>Unique domains linking to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(backlinks.map(bl => bl.domain)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DoFollow Links</CardTitle>
            <CardDescription>Links that pass authority</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {backlinks.filter(bl => bl.isDoFollow).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Backlinks Analysis</CardTitle>
              <CardDescription>
                Visualize your backlink profile
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={activeTab === "growth" ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveTab("growth")}
              >
                Growth
              </Button>
              <Button 
                variant={activeTab === "authority" ? "default" : "outline"} 
                size="sm"
                onClick={() => setActiveTab("authority")}
              >
                Domain Authority
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {activeTab === "growth" && (
              <BacklinksGrowthChart 
                backlinks={backlinks} 
              />
            )}
            {activeTab === "authority" && (
              <BacklinksDomainAuthorityChart 
                backlinks={backlinks} 
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Backlinks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Backlinks</CardTitle>
          <CardDescription>
            All discovered backlinks to your site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search backlinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Select
                value={filterType}
                onValueChange={setFilterType}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Links</SelectItem>
                  <SelectItem value="dofollow">DoFollow</SelectItem>
                  <SelectItem value="nofollow">NoFollow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table with virtualization */}
            <div className="border rounded-md">
              <div className="bg-muted border-b">
                <div className="grid grid-cols-6 gap-4 px-4 py-3 text-sm font-medium">
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      if (sortBy === "domain") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("domain");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    Domain
                    {sortBy === "domain" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                  <div 
                    className="flex items-center cursor-pointer col-span-2"
                    onClick={() => {
                      if (sortBy === "anchorText") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("anchorText");
                        setSortOrder("asc");
                      }
                    }}
                  >
                    Anchor Text
                    {sortBy === "anchorText" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      if (sortBy === "domainAuthority") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("domainAuthority");
                        setSortOrder("desc");
                      }
                    }}
                  >
                    Authority
                    {sortBy === "domainAuthority" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      if (sortBy === "isDoFollow") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("isDoFollow");
                        setSortOrder("desc");
                      }
                    }}
                  >
                    Type
                    {sortBy === "isDoFollow" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                  <div 
                    className="flex items-center cursor-pointer"
                    onClick={() => {
                      if (sortBy === "firstDiscovered") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("firstDiscovered");
                        setSortOrder("desc");
                      }
                    }}
                  >
                    Discovered
                    {sortBy === "firstDiscovered" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
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
                    const backlink = filteredBacklinks[virtualRow.index];
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
                        <div className={`grid grid-cols-6 gap-4 px-4 py-3 text-sm ${virtualRow.index % 2 ? 'bg-muted/50' : ''}`}>
                          <div className="font-medium truncate">
                            <a
                              href={`https://${backlink.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                            >
                              {backlink.domain}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div className="col-span-2 truncate">
                            <a
                              href={backlink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                              title={backlink.title}
                            >
                              {backlink.anchorText || "(No anchor text)"}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div>
                            <Badge variant={getDomainAuthorityBadge(backlink.domainAuthority)}>
                              DA: {backlink.domainAuthority} / PA: {backlink.pageAuthority}
                            </Badge>
                          </div>
                          <div>
                            <Badge variant={backlink.isDoFollow ? "default" : "outline"}>
                              {backlink.isDoFollow ? "DoFollow" : "NoFollow"}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground">
                            {new Date(backlink.firstDiscovered).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {filteredBacklinks.length === 0 && (
                <div className="h-24 flex items-center justify-center text-muted-foreground">
                  No backlinks found
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 