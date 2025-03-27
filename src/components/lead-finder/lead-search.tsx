"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, MapPin, Search as SearchIcon, Download, ChevronDown, ChevronUp, Star, Phone, Globe, MapPin as MapPinIcon, Filter, Info } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import dynamic from "next/dynamic"
import { saveLead } from "@/services/lead-finder"
import type { LeadInsert } from "@/services/lead-finder"
import LocationAutocomplete from "./location-autocomplete"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Dynamically import the map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import("@/components/lead-finder/map"), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-md" />
})

interface SearchResult {
  title: string;
  place_id: string;
  address: string;
  phone: string;
  website: string;
  rating: string;
  reviews: string;
  type: string[] | string;
  price_level?: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
  data_quality?: number;
  thumbnail?: string;
  detailed_hours?: string;
  full_address?: string;
  services?: string[];
  description?: string;
  photos?: string[];
}

interface LocationData {
  formattedAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
}

interface LeadSearchProps {
  onSearch: () => void;
  remainingSearches: number;
}

export default function LeadSearch({ onSearch, remainingSearches }: LeadSearchProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [minRating, setMinRating] = useState(3)
  const [maxRating, setMaxRating] = useState(5)
  const [searchRadius, setSearchRadius] = useState(10)
  const [maxResults, setMaxResults] = useState(10)
  const [priceLevel, setPriceLevel] = useState<string>("any")
  const [openNow, setOpenNow] = useState<boolean>(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSearch = async () => {
    if (!searchQuery || !location) {
      setError("Please enter both a search query and location")
      return
    }

    if (remainingSearches <= 0) {
      setError("You have no searches remaining. Please purchase more searches.")
      return
    }

    if (minRating > maxRating) {
      setError("Minimum rating cannot be higher than maximum rating")
      return
    }

    setIsLoading(true)
    setError(null)
    setResults([])
    setFilteredResults([])
    setSelectedResultIndex(null)
    setSelectedCategories([])
    setAvailableCategories([])

    try {
      const queryParams = new URLSearchParams({
        query: searchQuery,
        location: location,
        minRating: minRating.toString(),
        maxRating: maxRating.toString(),
        radius: searchRadius.toString(),
        maxResults: maxResults.toString()
      });
      
      if (locationData?.placeId) {
        queryParams.append('placeId', locationData.placeId);
        console.log(`Using place ID: ${locationData.placeId}`);
      }
      
      if (locationData?.coordinates) {
        queryParams.append('lat', locationData.coordinates.lat.toString());
        queryParams.append('lng', locationData.coordinates.lng.toString());
        console.log(`Using coordinates: ${locationData.coordinates.lat},${locationData.coordinates.lng}`);
      }
      
      if (priceLevel && priceLevel !== "any") {
        queryParams.append('priceLevel', priceLevel);
      }
      
      if (openNow) {
        queryParams.append('openNow', 'true');
      }
      
      console.log(`Searching for: ${searchQuery} in ${location}`);
      const response = await fetch(`/api/lead-finder/search?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Search API error response:", errorData);
        
        // Try to get a detailed error message
        let errorMessage = errorData.message || errorData.error || `Error: ${response.status} ${response.statusText}`;
        
        // Provide more user-friendly messages for known errors
        if (errorMessage.includes("is not included in the list")) {
          errorMessage = "Search contains invalid parameters. Please try a different search term or location.";
        } else if (errorMessage.includes("location field is required")) {
          errorMessage = "Please enter a valid location to search.";
        } else if (response.status === 429) {
          errorMessage = "Search limit reached. Please try again later.";
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Log detailed response for debugging
      console.log("Search API response:", {
        hasResults: !!data.results,
        resultsCount: data.results?.length || 0,
        remainingSearches: data.remaining_searches,
        firstFewResults: data.results?.slice(0, 2) || []
      });
      
      if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
        setError("No results found for your search. Try adjusting your search criteria or location.");
        console.log("No results returned from API");
        return;
      }
      
      console.log(`Found ${data.results.length} results`);
      const searchResults = data.results || [];
      setResults(searchResults)
      setFilteredResults(searchResults)
      
      // Show location warning if present
      if (data.location_warning) {
        setError(data.location_warning);
        console.warn("Location warning:", data.location_warning);
      }
      
      // Extract unique categories from all results
      const categories = searchResults.reduce((acc: string[], result: SearchResult) => {
        if (result.type) {
          if (Array.isArray(result.type)) {
            result.type.forEach(type => {
              if (!acc.includes(type)) {
                acc.push(type);
              }
            });
          } else if (typeof result.type === 'string' && !acc.includes(result.type)) {
            acc.push(result.type);
          }
        }
        return acc;
      }, []);
      
      setAvailableCategories(categories);
      onSearch()
    } catch (err: any) {
      setError(err.message || "An error occurred while searching")
      console.error("Search error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter results based on selected categories
  const applyFilters = () => {
    if (!results.length) return;
    
    if (!selectedCategories.length) {
      setFilteredResults(results);
      return;
    }
    
    const filtered = results.filter(result => {
      if (!result.type) return false;
      
      if (Array.isArray(result.type)) {
        return result.type.some(type => selectedCategories.includes(type));
      } else if (typeof result.type === 'string') {
        return selectedCategories.includes(result.type);
      }
      
      return false;
    });
    
    setFilteredResults(filtered);
  };
  
  // Update filtered results when categories change
  useEffect(() => {
    applyFilters();
  }, [selectedCategories, results]);

  const handleSaveLead = async (result: SearchResult) => {
    try {
      // Properly handle categories/type data whether it's a string or array
      let categories: string[] | null = null;
      if (result.type) {
        categories = Array.isArray(result.type) ? result.type : [result.type];
      }
      
      const leadData: LeadInsert = {
        business_name: result.title,
        rating: result.rating ? parseFloat(result.rating) : null,
        address: result.address || null,
        phone: result.phone || null,
        website: result.website || null,
        place_id: result.place_id || null,
        latitude: result.latitude || null, 
        longitude: result.longitude || null,
        categories: categories,
        status: "New",
        contacted: false
      };

      const saved = await saveLead(leadData)
      
      if (saved) {
        toast({
          title: "Lead saved",
          description: `${result.title} has been added to your leads`
        })
      } else {
        throw new Error("Failed to save lead")
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error saving lead",
        description: err.message || "An error occurred while saving the lead"
      })
    }
  }

  const handleSaveAllLeads = async () => {
    if (!filteredResults.length) return;
    
    setIsLoading(true);
    let successCount = 0;
    let failCount = 0;
    
    try {
      // Process leads in batches to avoid overwhelming the API
      for (const result of filteredResults) {
        try {
          // Properly handle categories/type data whether it's a string or array
          let categories: string[] | null = null;
          if (result.type) {
            categories = Array.isArray(result.type) ? result.type : [result.type];
          }
          
          const leadData: LeadInsert = {
            business_name: result.title,
            rating: result.rating ? parseFloat(result.rating) : null,
            address: result.address || null,
            phone: result.phone || null,
            website: result.website || null,
            place_id: result.place_id || null,
            latitude: result.latitude || null,
            longitude: result.longitude || null,
            categories: categories,
            status: "New",
            contacted: false
          };
          
          const saved = await saveLead(leadData);
          if (saved) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
          console.error("Error saving lead:", err);
        }
      }
      
      toast({
        title: "Bulk lead save completed",
        description: `Successfully saved ${successCount} leads${failCount > 0 ? `, ${failCount} failed` : ''}`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error during bulk save",
        description: err.message || "An error occurred during the bulk save operation"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCsv = () => {
    if (filteredResults.length === 0) return;
    
    // Create CSV content
    const headers = ['Business Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Categories', 'Price Level'];
    const rows = filteredResults.map(result => {
      const categories = result.type 
        ? (Array.isArray(result.type) ? result.type.join(', ') : result.type) 
        : '';
        
      return [
        result.title || '',
        result.address || '',
        result.phone || '',
        result.website || '',
        result.rating || '',
        result.reviews || '',
        categories,
        result.price_level || ''
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lead-finder-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler for location data changes
  const handleLocationDataChange = (data: LocationData) => {
    console.log("Location data changed:", data);
    setLocationData(data);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-query">Business type or category</Label>
            <Input
              id="search-query"
              placeholder="e.g. Plumber, Cafe, Restaurant"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              onLocationData={handleLocationDataChange}
              placeholder="Enter a city, state, or region"
            />
            {location && locationData?.coordinates && (
              <div className="mt-1 text-xs text-green-600 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Precise location coordinates will be used for accurate results
              </div>
            )}
            {location && !locationData?.coordinates && (
              <div className="mt-1 text-xs text-amber-600 flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Select a location from the dropdown for more accurate results
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="search-radius">Search Radius ({searchRadius} km)</Label>
              <span className="text-sm text-muted-foreground">{searchRadius} km</span>
            </div>
            <Slider
              id="search-radius"
              min={1}
              max={50}
              step={1}
              value={[searchRadius]}
              onValueChange={(value) => setSearchRadius(value[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="rating-range">Rating Range ({minRating} - {maxRating} stars)</Label>
              <span className="text-sm text-muted-foreground">{minRating} - {maxRating} ★</span>
            </div>
            <div className="pt-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between">
                    <Label htmlFor="min-rating">Minimum Rating</Label>
                    <span className="text-sm text-muted-foreground">{minRating} ★</span>
                  </div>
                  <Slider
                    id="min-rating"
                    min={1}
                    max={5}
                    step={1}
                    value={[minRating]}
                    onValueChange={(value) => setMinRating(value[0])}
                  />
                </div>
                <div>
                  <div className="flex justify-between">
                    <Label htmlFor="max-rating">Maximum Rating</Label>
                    <span className="text-sm text-muted-foreground">{maxRating} ★</span>
                  </div>
                  <Slider
                    id="max-rating"
                    min={1}
                    max={5}
                    step={1}
                    value={[maxRating]}
                    onValueChange={(value) => setMaxRating(value[0])}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-results">Maximum Results ({maxResults})</Label>
            <Slider
              id="max-results"
              min={5}
              max={50}
              step={5}
              value={[maxResults]}
              onValueChange={(value) => setMaxResults(value[0])}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price-level">Price Level</Label>
            <Select 
              value={priceLevel} 
              onValueChange={setPriceLevel}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any price level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any price level</SelectItem>
                <SelectItem value="1">$ (Inexpensive)</SelectItem>
                <SelectItem value="2">$$ (Moderate)</SelectItem>
                <SelectItem value="3">$$$ (Expensive)</SelectItem>
                <SelectItem value="4">$$$$ (Very Expensive)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Checkbox 
              id="open-now" 
              checked={openNow}
              onCheckedChange={(checked) => setOpenNow(checked as boolean)}
            />
            <Label htmlFor="open-now">Only show businesses that are open now</Label>
          </div>

          <div className="pt-6 space-y-4">
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || remainingSearches <= 0} 
              className="w-full"
            >
              {isLoading ? "Searching..." : "Search Businesses"}
              <SearchIcon className="ml-2 h-4 w-4" />
            </Button>
            
            {/* Debug test button */}
            <Button 
              onClick={() => {
                console.log("Running test search");
                setSearchQuery("Plumber");
                setLocation("London, UK");
                setTimeout(() => handleSearch(), 100);
              }} 
              variant="outline" 
              size="sm"
              className="w-full mt-2 text-xs"
            >
              Debug: Test UK Search
            </Button>
            
            {/* US Debug test button */}
            <Button 
              onClick={() => {
                console.log("Running US test search");
                setSearchQuery("Plumber");
                setLocation("New York, USA");
                setTimeout(() => handleSearch(), 100);
              }} 
              variant="outline" 
              size="sm"
              className="w-full mt-2 text-xs"
            >
              Debug: Test US Search
            </Button>
            
            {/* Display error message */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {remainingSearches <= 0 && (
              <div className="text-center">
                <p className="text-sm text-destructive">You have no searches remaining.</p>
                <p className="text-sm text-muted-foreground">Please navigate to the Usage tab to purchase more searches.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        {filteredResults.length > 0 && (
          <Map 
            results={filteredResults} 
            selectedIndex={selectedResultIndex}
            onMarkerClick={(index) => setSelectedResultIndex(index)}
          />
        )}
      </div>

      {filteredResults.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">Search Results ({filteredResults.length})</h3>
              
              {availableCategories.length > 0 && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter Results
                      {selectedCategories.length > 0 && (
                        <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                          {selectedCategories.length}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Results</SheetTitle>
                      <SheetDescription>
                        Filter results by business category
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="py-4">
                      <div className="mb-4 flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCategories([])}
                        >
                          Clear All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCategories([...availableCategories])}
                        >
                          Select All
                        </Button>
                      </div>
                      
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {availableCategories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`category-${category}`}
                              checked={selectedCategories.includes(category)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCategories([...selectedCategories, category]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter(c => c !== category));
                                }
                              }}
                            />
                            <Label htmlFor={`category-${category}`} className="text-sm">
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveAllLeads}
                disabled={isLoading}
                className="hidden md:flex items-center gap-1"
              >
                Save All Leads
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToCsv}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="hidden md:table-cell">Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result, index) => {
                  const rowId = result.place_id || `row-${index}`;
                  const isExpanded = expandedRows[rowId] || false;
                  
                  return (
                    <React.Fragment key={rowId}>
                      <TableRow 
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedResultIndex === index ? "bg-primary/10" : ""
                        }`}
                        onClick={() => setSelectedResultIndex(index)}
                      >
                        <TableCell className="p-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpand(rowId);
                            }}
                          >
                            {isExpanded ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            {result.title}
                            {result.price_level && (
                              <span className="text-xs text-muted-foreground mt-1">
                                {Array(parseInt(result.price_level))
                                  .fill('$')
                                  .join('')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{result.rating || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]">
                          {result.address}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveLead(result);
                            }}
                          >
                            Save Lead
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {isExpanded && (
                        <TableRow className="bg-muted/30 hover:bg-muted/50">
                          <TableCell colSpan={5} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <MapPinIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                  <span>{result.address || "No address available"}</span>
                                </div>
                                
                                {result.phone && (
                                  <div className="flex items-start gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <span>{result.phone}</span>
                                  </div>
                                )}
                                
                                {result.website && (
                                  <div className="flex items-start gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <a 
                                      href={result.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {result.website}
                                    </a>
                                  </div>
                                )}
                                
                                {result.hours && (
                                  <div className="mt-2 text-sm">
                                    <div className="font-medium mb-1">Business Hours</div>
                                    <div className="text-muted-foreground">
                                      {typeof result.detailed_hours === 'string' 
                                        ? result.detailed_hours 
                                        : typeof result.hours === 'string' 
                                          ? result.hours 
                                          : typeof result.hours === 'object'
                                            ? Object.entries(result.hours).map(([day, hours]) => (
                                                <div key={day} className="text-xs">
                                                  <span className="font-medium capitalize">{day}: </span>
                                                  <span>{String(hours)}</span>
                                                </div>
                                              ))
                                            : JSON.stringify(result.hours)}
                                    </div>
                                  </div>
                                )}
                                
                                {result.services && result.services.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-sm font-medium mb-1">Services</div>
                                    <div className="flex flex-wrap gap-1">
                                      {result.services.map((service, i) => (
                                        <span 
                                          key={i} 
                                          className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full"
                                        >
                                          {service}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {result.type && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {Array.isArray(result.type) 
                                      ? result.type.map((type, i) => (
                                          <span 
                                            key={i} 
                                            className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                                          >
                                            {type}
                                          </span>
                                        ))
                                      : (
                                          <span 
                                            className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                                          >
                                            {result.type}
                                          </span>
                                        )
                                    }
                                  </div>
                                )}
                                
                                {result.data_quality !== undefined && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    Data quality: {result.data_quality}/5
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                {result.photos && result.photos.length > 0 ? (
                                  <div className="mb-3 grid grid-cols-2 gap-2">
                                    {result.photos.slice(0, 4).map((photo, index) => (
                                      <img 
                                        key={index}
                                        src={photo} 
                                        alt={`${result.title} - photo ${index + 1}`} 
                                        className="rounded-md w-full h-24 object-cover"
                                        onError={(e) => {
                                          // Hide broken images
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ))}
                                  </div>
                                ) : result.thumbnail && (
                                  <div className="mb-3">
                                    <img 
                                      src={result.thumbnail} 
                                      alt={result.title} 
                                      className="rounded-md w-full max-h-32 object-cover"
                                      onError={(e) => {
                                        // Hide broken images
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                
                                {result.description && (
                                  <div className="p-3 bg-background rounded-md mb-3">
                                    <h4 className="text-sm font-medium mb-2">Description</h4>
                                    <p className="text-sm text-muted-foreground">{result.description}</p>
                                  </div>
                                )}
                                
                                {result.reviews && (
                                  <div className="p-3 bg-background rounded-md">
                                    <h4 className="text-sm font-medium mb-2">Reviews</h4>
                                    <p className="text-sm text-muted-foreground">{result.reviews}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="md:hidden">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveAllLeads}
              disabled={isLoading}
              className="w-full"
            >
              Save All Leads
            </Button>
          </div>
        </div>
      ) : (
        !isLoading && !error && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Search for businesses to see results here
          </div>
        )
      )}
    </div>
  )
} 