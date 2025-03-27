"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"

// Define Google Maps as a global variable
declare global {
  interface Window {
    google?: any;
    initMap?: () => void;
  }
}

// Define a marker type that can be either a Marker or AdvancedMarkerElement
type MapMarker = any; // Using any because we don't have proper Google Maps type definitions

interface SearchResult {
  title: string
  place_id: string
  address: string
  phone: string
  website: string
  rating: string
  latitude?: number
  longitude?: number
}

interface MapProps {
  results: SearchResult[]
  selectedIndex: number | null
  onMarkerClick: (index: number) => void
}

export default function Map({ results, selectedIndex, onMarkerClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [googleMap, setGoogleMap] = useState<any>(null)
  const markersRef = useRef<MapMarker[]>([])
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [infoWindow, setInfoWindow] = useState<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Store previous filtered results to compare and avoid unnecessary marker creation
  const prevResultsRef = useRef<SearchResult[]>([]);
  
  // Filter out results without coordinates
  const filteredResults = results.filter(r => r.latitude && r.longitude)
  
  // Check if Google Maps is already loaded when component mounts
  useEffect(() => {
    if (window.google?.maps && !scriptLoaded) {
      console.log("Google Maps already loaded globally");
      setScriptLoaded(true);
    }
  }, [scriptLoaded]);
  
  // Check if we have valid results with coordinates
  useEffect(() => {
    // Log filteredResults length to debug
    console.log(`Map component: Results with coordinates: ${filteredResults.length} out of ${results.length}`);
    
    // Only set error state if it needs to change from current value
    if (results.length > 0 && filteredResults.length === 0) {
      if (error !== "Results do not contain location data") {
        setError("Results do not contain location data");
      }
    } else if (filteredResults.length > 0 && error !== null) {
      setError(null);
    }
  }, [results, filteredResults, error]); // Include error in dependencies to prevent infinite loop

  useEffect(() => {
    // Skip defining initMap if it's already defined or if script is already loaded
    if (window.initMap || scriptLoaded) return;
    
    // Define global initMap function for Google Maps
    window.initMap = () => {
      console.log("Google Maps script callback initiated");
      
      try {
        console.log("Initializing Google Maps");
        
        // Find a valid marker to center the map initially
        const validMarker = filteredResults.find(r => r.latitude && r.longitude)
        const defaultCenter = validMarker?.latitude && validMarker?.longitude 
          ? { lat: validMarker.latitude, lng: validMarker.longitude } 
          : { lat: 51.505, lng: -0.09 } // Default to London if no coordinates

        console.log("Map center:", defaultCenter);

        // Create the map
        const map = new window.google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        })

        setGoogleMap(map)
        setInfoWindow(new window.google.maps.InfoWindow())
        setScriptLoaded(true) // Mark script as loaded once map is initialized
        console.log("Google Maps initialized successfully");
      } catch (err) {
        console.error("Error initializing Google Maps:", err);
        setError("Could not initialize map");
      }
    }
    
    return () => {
      // Cleanup the global function when component unmounts
      delete window.initMap;
    }
  }, [filteredResults, scriptLoaded]) // Add scriptLoaded to dependency array

  const handleScriptError = () => {
    console.error("Failed to load Google Maps script");
    setError("Failed to load map services");
  }

  // Create or update markers whenever results or the map changes
  useEffect(() => {
    if (!googleMap || !window.google) return;
    
    // Check if filtered results have actually changed to avoid unnecessary updates
    const resultsChanged = filteredResults.length !== prevResultsRef.current.length ||
      filteredResults.some((result, i) => {
        const prev = prevResultsRef.current[i];
        return !prev || 
               prev.place_id !== result.place_id || 
               prev.latitude !== result.latitude || 
               prev.longitude !== result.longitude;
      });
    
    // Update the previous results reference
    prevResultsRef.current = filteredResults;
    
    // Skip marker creation if results haven't changed
    if (!resultsChanged && markers.length > 0) {
      return;
    }

    try {
      // Clear any existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      
      // Create new markers
      const newMarkers = filteredResults.map((result, index) => {
        const position = { 
          lat: result.latitude!, 
          lng: result.longitude! 
        };
        
        // Use the AdvancedMarkerElement instead of the deprecated Marker class
        let marker: MapMarker;
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
          // Create an AdvancedMarkerElement if available (newer version of Google Maps)
          marker = new window.google.maps.marker.AdvancedMarkerElement({
            position,
            map: googleMap,
            title: result.title,
          });
          
          // Add click event with the new API
          marker.addListener("click", () => {
            onMarkerClick(index);
            
            if (infoWindow) {
              const content = `
                <div class="p-2 max-w-xs">
                  <h3 class="font-semibold">${result.title}</h3>
                  <p class="text-xs mt-1">${result.address || ""}</p>
                  ${result.rating ? `<p class="text-xs mt-1">Rating: ${result.rating} ★</p>` : ""}
                  ${result.website ? 
                    `<a href="${result.website}" target="_blank" rel="noopener noreferrer" 
                      class="text-xs text-blue-600 hover:underline block mt-2">
                      Visit Website
                    </a>` : ""
                  }
                </div>
              `;
              
              infoWindow.setContent(content);
              infoWindow.open(googleMap, marker);
            }
          });
        } else {
          // Fallback to the deprecated Marker class if AdvancedMarkerElement is not available
          marker = new window.google.maps.Marker({
            position,
            map: googleMap,
            title: result.title,
            animation: window.google.maps.Animation.DROP
          });
          
          // Add click event to the marker
          marker.addListener("click", () => {
            onMarkerClick(index);
            
            // Set info window content
            const content = `
              <div class="p-2 max-w-xs">
                <h3 class="font-semibold">${result.title}</h3>
                <p class="text-xs mt-1">${result.address || ""}</p>
                ${result.rating ? `<p class="text-xs mt-1">Rating: ${result.rating} ★</p>` : ""}
                ${result.website ? 
                  `<a href="${result.website}" target="_blank" rel="noopener noreferrer" 
                    class="text-xs text-blue-600 hover:underline block mt-2">
                    Visit Website
                  </a>` : ""
                }
              </div>
            `;
            
            if (infoWindow) {
              infoWindow.setContent(content);
              infoWindow.open(googleMap, marker);
            }
          });
        }
        
        return marker;
      });
      
      // Use ref instead of state to avoid re-renders
      markersRef.current = newMarkers;
      
      // REMOVE this line to prevent infinite update loop
      // Instead of updating state on every render, only update when length changes
      if (markers.length !== newMarkers.length) {
        setMarkers(newMarkers);
      }
    } catch (err) {
      console.error("Error creating map markers:", err);
      setError("Could not create map markers");
    }
  }, [googleMap, filteredResults, infoWindow, onMarkerClick, markers.length]); // Add markers.length to dependency array
  
  // Focus on selected marker
  useEffect(() => {
    if (!googleMap || selectedIndex === null || !filteredResults[selectedIndex]) return;
    
    try {
      const result = filteredResults[selectedIndex];
      if (!result.latitude || !result.longitude) return;
      
      const position = { lat: result.latitude, lng: result.longitude };
      
      // Pan to the selected marker
      googleMap.panTo(position);
      googleMap.setZoom(15);
      
      // Open info window on the selected marker - use ref instead of state
      if (infoWindow && markersRef.current.length > selectedIndex) {
        // Create the content for the info window
        const content = `
          <div class="p-2 max-w-xs">
            <h3 class="font-semibold">${result.title}</h3>
            <p class="text-xs mt-1">${result.address || ""}</p>
            ${result.rating ? `<p class="text-xs mt-1">Rating: ${result.rating} ★</p>` : ""}
            ${result.website ? 
              `<a href="${result.website}" target="_blank" rel="noopener noreferrer" 
                class="text-xs text-blue-600 hover:underline block mt-2">
                Visit Website
              </a>` : ""
            }
          </div>
        `;
        
        // Use a single operation to update the info window to minimize re-renders
        const marker = markersRef.current[selectedIndex];
        if (marker) {
          infoWindow.setContent(content);
          infoWindow.open(googleMap, marker);
        }
      }
    } catch (err) {
      console.error("Error focusing on marker:", err);
    }
  }, [googleMap, selectedIndex, filteredResults, infoWindow]); // Don't include markers in dependency array

  // Initialize map when Google Maps is available and we have valid results
  useEffect(() => {
    // Only initialize if maps script is loaded, we don't have a map instance yet, and we have at least one valid result
    if (window.google?.maps && !googleMap && filteredResults.length > 0 && scriptLoaded) {
      // Add a small timeout to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        if (!mapRef.current) {
          console.error("Map container element not found");
          setError("Map container not available");
          return;
        }
        
        console.log("Initializing map directly with already loaded Google Maps");
        
        try {
          // Find a valid marker to center the map initially
          const validMarker = filteredResults.find(r => r.latitude && r.longitude)
          const defaultCenter = validMarker?.latitude && validMarker?.longitude 
            ? { lat: validMarker.latitude, lng: validMarker.longitude } 
            : { lat: 51.505, lng: -0.09 } // Default to London if no coordinates

          console.log("Direct map initialization center:", defaultCenter);

          // Create the map
          const map = new window.google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          });

          setGoogleMap(map);
          setInfoWindow(new window.google.maps.InfoWindow());
        } catch (err) {
          console.error("Error in direct map initialization:", err);
          setError("Failed to initialize map");
        }
      }, 100); // 100ms delay
      
      return () => clearTimeout(timer);
    }
  }, [googleMap, filteredResults, scriptLoaded]);

  if (filteredResults.length === 0) {
    return (
      <div className="h-[400px] bg-muted flex items-center justify-center rounded-md">
        <p className="text-muted-foreground">No location data available</p>
      </div>
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyA98HLbQAzo489KysxY3tX6pjnRjCzpYiM';

  // Only render the script tag if needed
  const shouldLoadScript = !scriptLoaded && apiKey && !window.google?.maps;

  return (
    <div className="h-[400px] rounded-md overflow-hidden border">
      <div ref={mapRef} className="h-full w-full"></div>
      {shouldLoadScript && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`}
          onError={handleScriptError}
          strategy="afterInteractive"
        />
      )}
    </div>
  );
}