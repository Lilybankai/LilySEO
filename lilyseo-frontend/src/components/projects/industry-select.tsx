"use client"

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import React from 'react'

// Add direct imports from cmdk as fallback
import { Command as CmdkCommand, CommandInput as CmdkInput, CommandEmpty as CmdkEmpty, CommandGroup as CmdkGroup, CommandItem as CmdkItem } from 'cmdk'

// Industry categories with subcategories
const industries = [
  {
    category: "E-commerce",
    subcategories: [
      "Fashion & Apparel",
      "Electronics",
      "Home & Garden",
      "Beauty & Personal Care",
      "Food & Grocery",
      "Health & Wellness",
      "Toys & Games",
      "Sports & Outdoors",
    ]
  },
  {
    category: "B2B",
    subcategories: [
      "SaaS",
      "Manufacturing",
      "Professional Services",
      "Wholesale",
      "Consulting",
      "Industrial Equipment",
      "Business Supplies",
    ]
  },
  {
    category: "Media & Publishing",
    subcategories: [
      "News",
      "Magazines",
      "Blogs",
      "Entertainment",
      "Podcasts",
      "Video Content",
    ]
  },
  {
    category: "Travel & Hospitality",
    subcategories: [
      "Hotels",
      "Airlines",
      "Vacation Rentals",
      "Tours & Activities",
      "Restaurants",
      "Travel Agencies",
    ]
  },
  {
    category: "Finance",
    subcategories: [
      "Banking",
      "Insurance",
      "Investment",
      "Personal Finance",
      "Cryptocurrency",
      "Financial Services",
    ]
  },
  {
    category: "Education",
    subcategories: [
      "Higher Education",
      "K-12",
      "Online Courses",
      "Tutoring",
      "Professional Training",
      "Language Learning",
    ]
  },
  {
    category: "Healthcare",
    subcategories: [
      "Hospitals",
      "Clinics",
      "Medical Practices",
      "Mental Health",
      "Telemedicine",
      "Medical Devices",
    ]
  },
  {
    category: "Real Estate",
    subcategories: [
      "Residential",
      "Commercial",
      "Rental Properties",
      "Property Management",
      "Construction",
      "Architecture",
    ]
  },
  {
    category: "Technology",
    subcategories: [
      "IT Services",
      "Software Development",
      "Hardware",
      "Cloud Services",
      "Cybersecurity",
      "AI & Machine Learning",
    ]
  },
  {
    category: "Other",
    subcategories: [
      "Non-profit",
      "Government",
      "Local Business",
      "Arts & Entertainment",
      "Legal",
      "Automotive",
      "Agriculture",
    ]
  }
]

// Flatten the industries for the command component
const flattenedIndustries = industries.flatMap(industry => 
  industry.subcategories.map(subcategory => ({
    value: `${industry.category}: ${subcategory}`,
    label: subcategory,
    category: industry.category
  }))
)

interface IndustrySelectProps {
  value: string
  onChange: (value: string) => void
  url?: string
  disabled?: boolean
}

export function IndustrySelect({ value, onChange, url, disabled }: IndustrySelectProps) {
  const [open, setOpen] = useState(false)
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(true); // Always use fallback for now
  const [searchQuery, setSearchQuery] = useState('');
  
  console.log("IndustrySelect rendering, open state:", open);
  
  // Close the popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchQuery('');
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);
  
  const handleTriggerClick = () => {
    console.log("Trigger button clicked, current open state:", open);
    setOpen(!open);
    console.log("Open state after setOpen:", !open);
  };
  
  // Handle selection of an industry
  const handleSelect = (industryValue: string) => {
    console.log("Industry selected:", industryValue);
    onChange(industryValue);
    setOpen(false);
    setSearchQuery('');
  };
  
  // Filter industries based on search query
  const filteredIndustries = React.useMemo(() => {
    if (!searchQuery) return industries;
    
    return industries.map(industry => ({
      ...industry,
      subcategories: industry.subcategories.filter(subcategory => 
        subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        industry.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(industry => industry.subcategories.length > 0);
  }, [searchQuery]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <div className="space-y-2 relative" ref={popoverRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        disabled={disabled}
        onClick={handleTriggerClick}
        type="button"
      >
        {value
          ? flattenedIndustries.find((industry) => industry.value === value)?.value
          : "Select industry..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div className="absolute top-full left-0 z-50 w-[400px] mt-1 rounded-md border bg-popover shadow-md">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search industries..."
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
              value={searchQuery}
              onChange={handleSearch}
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <div className="p-1">
              {filteredIndustries.map((industry) => (
                <div key={industry.category} className="mb-2">
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">{industry.category}</div>
                  <div>
                    {industry.subcategories.map((subcategory) => {
                      const industryValue = `${industry.category}: ${subcategory}`;
                      return (
                        <div
                          key={industryValue}
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                            value === industryValue && "bg-accent text-accent-foreground"
                          )}
                          onClick={() => {
                            console.log("Subcategory clicked:", subcategory);
                            handleSelect(industryValue);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === industryValue ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {subcategory}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {value && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {flattenedIndustries.find((industry) => industry.value === value)?.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Industry-specific recommendations will be provided based on your selection
          </span>
        </div>
      )}
    </div>
  );
} 