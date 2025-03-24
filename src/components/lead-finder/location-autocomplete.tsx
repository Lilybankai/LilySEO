"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import Script from 'next/script'

// Add type definitions for the Google Maps API
declare global {
  interface Window {
    google?: any;
    initAutocomplete?: () => void;
  }
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "City, State or Zip Code",
  className
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(value)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Setup the initialization function that will be called by the script
  useEffect(() => {
    window.initAutocomplete = () => {
      console.log("Google Maps script callback initiated");
      setScriptLoaded(true)
      
      // Initialize autocomplete when script is loaded
      if (inputRef.current && window.google) {
        try {
          console.log("Initializing Google Places Autocomplete");
          const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['geocode'],
            fields: ['address_components', 'formatted_address', 'name', 'geometry']
          })
          
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            console.log("Place selected:", place);
            if (place && place.formatted_address) {
              setInputValue(place.formatted_address)
              onChange(place.formatted_address)
            }
          })
        } catch (err) {
          console.error("Error initializing autocomplete:", err);
          setError("Could not initialize location autocomplete");
        }
      }
    }
    
    return () => {
      // Cleanup the global function when component unmounts
      delete window.initAutocomplete;
    }
  }, [onChange])

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
      {!scriptLoaded && apiKey && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`}
          onError={handleScriptError}
          strategy="afterInteractive"
        />
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`pr-10 ${className}`}
        />
        <MapPin className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      </div>
    </>
  )
} 