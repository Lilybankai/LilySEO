"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Globe, Link2, Link } from "lucide-react"

interface BacklinksProps {
  backlinksData: {
    topBacklinks?: any[];
    linkingDomains?: number;
    totalLinks?: number;
    domainAuthority?: number;
    pageAuthority?: number;
  };
}

export function BacklinksSection({ backlinksData }: BacklinksProps) {
  const hasBacklinks = backlinksData && 
    (backlinksData.topBacklinks?.length || 
     backlinksData.linkingDomains || 
     backlinksData.totalLinks || 
     backlinksData.domainAuthority || 
     backlinksData.pageAuthority);

  // Helper function to get domain from URL
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
  };

  // Helper function to format large numbers
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "N/A";
    return new Intl.NumberFormat().format(num);
  };

  // Helper function to determine authority score color
  const getAuthorityColor = (score: number | undefined) => {
    if (score === undefined) return "text-muted-foreground";
    if (score >= 60) return "text-green-600 dark:text-green-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    if (score >= 20) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  // Helper function to get quality badge for backlinks
  const getLinkQualityBadge = (link: any) => {
    // This is a simplified example - in a real implementation, you'd use more sophisticated
    // criteria based on the data available from your SEO API
    const score = link.domainAuthority || link.pageAuthority || 0;
    
    if (score >= 50) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          High Quality
        </Badge>
      );
    } else if (score >= 30) {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
          Medium Quality
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          Low Quality
        </Badge>
      );
    }
  };

  if (!hasBacklinks) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Backlinks Analysis</h2>
        <p className="text-muted-foreground">
          Overview of your website's backlink profile and domain authority
        </p>

        <Card>
          <CardHeader>
            <CardTitle>No Backlink Data Available</CardTitle>
            <CardDescription>
              We couldn't retrieve any backlink information for your website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This could be because:</p>
            <ul className="list-disc ml-5 mt-2 text-muted-foreground">
              <li>Your website is new and hasn't acquired backlinks yet</li>
              <li>There was an issue connecting to our backlink data provider</li>
              <li>The backlink data is still being processed</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Backlinks Analysis</h2>
      <p className="text-muted-foreground">
        Overview of your website's backlink profile and domain authority
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Domain Authority</CardTitle>
            <CardDescription>
              Overall domain strength
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className={`text-3xl font-bold ${getAuthorityColor(backlinksData.domainAuthority)}`}>
                {backlinksData.domainAuthority || "N/A"}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Page Authority</CardTitle>
            <CardDescription>
              Specific page strength
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <span className={`text-3xl font-bold ${getAuthorityColor(backlinksData.pageAuthority)}`}>
                {backlinksData.pageAuthority || "N/A"}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Linking Domains</CardTitle>
            <CardDescription>
              Unique domains linking to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className="text-3xl font-bold">
                {formatNumber(backlinksData.linkingDomains)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Backlinks</CardTitle>
            <CardDescription>
              All links pointing to your site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Link className="h-5 w-5 text-muted-foreground" />
              <span className="text-3xl font-bold">
                {formatNumber(backlinksData.totalLinks)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {backlinksData.topBacklinks && backlinksData.topBacklinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Backlinks</CardTitle>
            <CardDescription>
              The most valuable links pointing to your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Authority</TableHead>
                  <TableHead>Link Type</TableHead>
                  <TableHead className="text-right">Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backlinksData.topBacklinks.slice(0, 10).map((link, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex flex-col">
                        <a 
                          href={link.sourceUrl || link.source || "#"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:underline flex items-center gap-1"
                        >
                          {getDomain(link.sourceUrl || link.source || "")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {link.anchor || link.anchorText || "No anchor text"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={getAuthorityColor(link.domainAuthority || link.sourceDomainAuthority)}>
                        {link.domainAuthority || link.sourceDomainAuthority || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {link.linkType || link.type || (link.nofollow ? "nofollow" : "dofollow") || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {getLinkQualityBadge(link)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 