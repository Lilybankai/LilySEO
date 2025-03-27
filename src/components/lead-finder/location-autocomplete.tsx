"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import Script from 'next/script'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

// Add type definitions for the Google Maps API
declare global {
  interface Window {
    google?: any;
    initAutocomplete?: () => void;
  }
}

interface LocationValue {
  formattedAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationData?: (data: LocationValue) => void; // New callback for rich location data
  placeholder?: string;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onLocationData,
  placeholder = "City, State or Zip Code",
  className
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(value)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Check if Google Maps is already loaded when component mounts
  useEffect(() => {
    if (window.google?.maps?.places && !scriptLoaded) {
      console.log("Google Maps Places API already loaded globally");
      setScriptLoaded(true);
      initializeAutocomplete();
    }
  }, [scriptLoaded]);

  // Function to initialize the autocomplete functionality
  const initializeAutocomplete = () => {
    if (inputRef.current && window.google?.maps?.places) {
      try {
        console.log("Initializing Google Places Autocomplete");
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          fields: ['address_components', 'formatted_address', 'name', 'geometry', 'place_id'],
          // No country restrictions to allow global search
        });
        
        // Set initial bias to user's location if available, but don't restrict results
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const geolocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            
            const circle = new window.google.maps.Circle({
              center: geolocation,
              radius: 50000 // 50km radius for initial bias
            });
            
            autocomplete.setBounds(circle.getBounds());
            console.log("Set initial location bias based on user location (global search enabled)");
          }, () => {
            console.log("Geolocation permission denied or unavailable");
          });
        }
        
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          console.log("Place selected:", place);
          
          if (place) {
            // Set the input value for basic compatibility
            if (place.formatted_address) {
              setInputValue(place.formatted_address);
              onChange(place.formatted_address);
            } else if (place.name) {
              setInputValue(place.name);
              onChange(place.name);
            }
            
            // Build SerpAPI-friendly location string with coordinates when available
            if (place.geometry?.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              
              // Format as SerpAPI-friendly location string with coordinates
              const locationWithCoords = place.formatted_address ? 
                `${place.formatted_address} @${lat},${lng}` : 
                `@${lat},${lng}`;
              
              // For internal use, provide rich location data
              if (onLocationData) {
                onLocationData({
                  formattedAddress: place.formatted_address || place.name,
                  coordinates: {
                    lat: lat,
                    lng: lng
                  },
                  placeId: place.place_id
                });
              }
              
              // For SerpAPI compatibility, use the location with coordinates
              onChange(locationWithCoords);
              console.log(`Using enhanced location with coordinates: ${locationWithCoords}`);
            } else if (place.place_id && onLocationData) {
              // If we don't have coordinates but have a place_id, still provide that
              onLocationData({
                formattedAddress: place.formatted_address || place.name,
                placeId: place.place_id
              });
            }
          }
        });
      } catch (err) {
        console.error("Error initializing autocomplete:", err);
        setError("Could not initialize location autocomplete");
      }
    }
  };
  
  // Setup the initialization function that will be called by the script
  useEffect(() => {
    // Skip defining initAutocomplete if it's already defined or if script is already loaded
    if (window.initAutocomplete || scriptLoaded) return;
    
    window.initAutocomplete = () => {
      console.log("Google Maps script callback initiated for autocomplete");
      setScriptLoaded(true);
      initializeAutocomplete();
    };
    
    return () => {
      // Cleanup the global function when component unmounts, but only if this component created it
      if (window.initAutocomplete === initializeAutocomplete) {
        delete window.initAutocomplete;
      }
    };
  }, [scriptLoaded, onChange]);

  // Handle input changes manually when autocomplete isn't available
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    onChange(inputValue)
  }

  const handleScriptError = () => {
    console.error("Failed to load Google Maps script");
    setError("Failed to load location services");
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyA98HLbQAzo489KysxY3tX6pjnRjCzpYiM'

  return (
    <>
      {!scriptLoaded && !window.google?.maps?.places && apiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`}
          onError={handleScriptError}
          strategy="afterInteractive"
        />
      )}
      <div className="relative">
        <div className="flex items-center">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className={`pr-16 ${className}`}
          />
          <div className="absolute right-3 flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Select a location from the dropdown for best search results. This helps find businesses in the exact area.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      </div>
    </>
  )
} 