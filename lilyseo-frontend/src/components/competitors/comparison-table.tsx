"use client";

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

// Define a type for the competitor data expected by this table
// Adjust based on the actual structure of analysis_data
interface CompetitorAnalysisData {
  id: string;
  name: string;
  url: string;
  analysis?: {
    metrics: {
      domainAuthority?: number;
      backlinks?: number;
      referringDomains?: number; // Assuming this field exists
      trafficEstimate?: number; // Assuming this field exists
      keywordCount?: number;
      pageSpeed?: {
        desktop?: number;
        mobile?: number;
      };
    };
  } | null;
}

interface CompetitorComparisonTableProps {
  competitors: CompetitorAnalysisData[];
}

// Explicitly define the sortable keys, including nested ones
type SortKey =
  | 'name'
  | 'url'
  | 'domainAuthority'
  | 'backlinks'
  | 'referringDomains'
  | 'trafficEstimate'
  | 'keywordCount'
  | 'desktopSpeed'
  | 'mobileSpeed';

type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey | null;
  direction: SortDirection;
}

// Helper to get nested metric values safely
const getMetricValue = (competitor: CompetitorAnalysisData, key: SortKey): number | string | undefined => {
  if (key === 'name') return competitor.name || competitor.url; // Use name or fallback to url
  if (key === 'url') return competitor.url;

  const metrics = competitor.analysis?.metrics;
  if (!metrics) return undefined;

  if (key === 'domainAuthority') return metrics.domainAuthority;
  if (key === 'backlinks') return metrics.backlinks;
  if (key === 'referringDomains') return metrics.referringDomains;
  if (key === 'trafficEstimate') return metrics.trafficEstimate;
  if (key === 'keywordCount') return metrics.keywordCount;
  if (key === 'desktopSpeed') return metrics.pageSpeed?.desktop;
  if (key === 'mobileSpeed') return metrics.pageSpeed?.mobile;

  return undefined;
};

export function CompetitorComparisonTable({ competitors }: CompetitorComparisonTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'domainAuthority', direction: 'descending' });

  const sortedCompetitors = useMemo(() => {
    let sortableItems = [...competitors];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = getMetricValue(a, sortConfig.key!);
        const bValue = getMetricValue(b, sortConfig.key!);

        // Handle undefined/null values - push them to the bottom
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        // Basic numeric/string comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [competitors, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    // If sorting by the same key, toggle direction
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    // Default to descending for metrics, ascending for name/url
    else if (sortConfig.key !== key && (key !== 'name' && key !== 'url')) {
       direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortArrow = (key: SortKey) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    // Enclose icon in a span for alignment and spacing consistency
    return <span className="inline-flex items-center ml-1"><ArrowUpDown className="h-4 w-4" /></span>;
  };

  const renderValue = (value: number | string | undefined) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground">N/A</span>;
    }
    // Format large numbers nicely
    if (typeof value === 'number' && value >= 1000) {
       return value.toLocaleString();
    }
    return value;
  };

  return (
    <div className="overflow-x-auto border rounded-md"> {/* Added border and rounding */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => requestSort('name')} className="cursor-pointer hover:bg-muted/50 whitespace-nowrap">
              <span className="inline-flex items-center"> {/* Wrapper for alignment */}
                Competitor
                {renderSortArrow('name')}
              </span>
            </TableHead>
            <TableHead onClick={() => requestSort('domainAuthority')} className="cursor-pointer hover:bg-muted/50 text-right whitespace-nowrap">
               <span className="inline-flex items-center"> {/* Wrapper for alignment */}
                 DA
                 {renderSortArrow('domainAuthority')}
               </span>
            </TableHead>
            <TableHead onClick={() => requestSort('backlinks')} className="cursor-pointer hover:bg-muted/50 text-right whitespace-nowrap">
              <span className="inline-flex items-center"> {/* Wrapper for alignment */}
                Backlinks
                {renderSortArrow('backlinks')}
              </span>
            </TableHead>
            <TableHead onClick={() => requestSort('referringDomains')} className="cursor-pointer hover:bg-muted/50 text-right whitespace-nowrap">
              <span className="inline-flex items-center"> {/* Wrapper for alignment */}
                Ref. Domains
                {renderSortArrow('referringDomains')}
              </span>
            </TableHead>
            <TableHead onClick={() => requestSort('trafficEstimate')} className="cursor-pointer hover:bg-muted/50 text-right whitespace-nowrap">
              <span className="inline-flex items-center"> {/* Wrapper for alignment */}
                Est. Traffic
                {renderSortArrow('trafficEstimate')}
              </span>
            </TableHead>
             <TableHead onClick={() => requestSort('keywordCount')} className="cursor-pointer hover:bg-muted/50 text-right whitespace-nowrap">
              <span className="inline-flex items-center"> {/* Wrapper for alignment */}
                Keywords
                {renderSortArrow('keywordCount')}
              </span>
            </TableHead>
            <TableHead onClick={() => requestSort('desktopSpeed')} className="cursor-pointer hover:bg-muted/50 text-right whitespace-nowrap">
              <span className="inline-flex items-center"> {/* Wrapper for alignment */}
                Desktop Speed
                {renderSortArrow('desktopSpeed')}
              </span>
            </TableHead>
            <TableHead onClick={() => requestSort('mobileSpeed')} className="cursor-pointer hover:bg-muted/50 text-right whitespace-nowrap">
               <span className="inline-flex items-center"> {/* Wrapper for alignment */}
                 Mobile Speed
                 {renderSortArrow('mobileSpeed')}
               </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCompetitors.map((competitor) => (
            <TableRow key={competitor.id}>
              <TableCell className="font-medium whitespace-nowrap">
                 <div className="flex flex-col">
                   <span className="font-semibold">{competitor.name || competitor.url}</span> {/* Made name bold */}
                   <a
                     href={competitor.url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-xs text-muted-foreground hover:text-primary transition-colors" // Use primary color on hover
                     onClick={(e) => e.stopPropagation()} // Prevent row click if needed
                   >
                     {competitor.url} <ExternalLink className="inline-block h-3 w-3 ml-0.5 align-baseline" /> {/* Adjusted icon alignment */}
                   </a>
                 </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{renderValue(getMetricValue(competitor, 'domainAuthority'))}</TableCell> {/* Use tabular-nums for alignment */}
              <TableCell className="text-right tabular-nums">{renderValue(getMetricValue(competitor, 'backlinks'))}</TableCell>
              <TableCell className="text-right tabular-nums">{renderValue(getMetricValue(competitor, 'referringDomains'))}</TableCell>
              <TableCell className="text-right tabular-nums">{renderValue(getMetricValue(competitor, 'trafficEstimate'))}</TableCell>
              <TableCell className="text-right tabular-nums">{renderValue(getMetricValue(competitor, 'keywordCount'))}</TableCell>
              <TableCell className="text-right tabular-nums">{renderValue(getMetricValue(competitor, 'desktopSpeed'))}</TableCell>
              <TableCell className="text-right tabular-nums">{renderValue(getMetricValue(competitor, 'mobileSpeed'))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Display message only if there are no competitors after filtering (parent component handles initial empty state) */}
      {competitors.length === 0 && (
         <div className="text-center py-10 text-muted-foreground px-4"> {/* Added padding */}
           No completed competitor analyses found for this project to display in the table.
         </div>
      )}
    </div>
  );
} 