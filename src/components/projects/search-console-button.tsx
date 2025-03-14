import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

interface SearchConsoleButtonProps {
  onDataImported: (data: {
    keywords?: string[]
    url?: string
  }) => void
  disabled?: boolean
}

export function SearchConsoleButton({ onDataImported, disabled }: SearchConsoleButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [sites, setSites] = useState<string[]>([])
  
  const handleConnect = async () => {
    setIsLoading(true)
    
    try {
      // This would be replaced with actual OAuth flow in production
      // For now, we'll simulate a successful connection with mock data
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSites([
        'https://example.com',
        'https://mysite.com',
        'https://anothersite.org'
      ])
      
      toast.success('Successfully connected to Google Search Console')
    } catch (error) {
      toast.error('Failed to connect to Google Search Console')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleImport = async () => {
    if (!selectedSite) return
    
    setIsLoading(true)
    
    try {
      // This would be replaced with actual API call in production
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock data that would come from the API
      const importedData = {
        keywords: ['seo tools', 'keyword research', 'backlink analysis', 'rank tracking'],
        url: selectedSite
      }
      
      onDataImported(importedData)
      setIsOpen(false)
      toast.success('Successfully imported data from Google Search Console')
    } catch (error) {
      toast.error('Failed to import data from Google Search Console')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        <Image 
          src="/images/google-search-console-logo.svg" 
          alt="Google Search Console" 
          width={20} 
          height={20} 
        />
        Import from Search Console
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connect Google Search Console</DialogTitle>
            <DialogDescription>
              Import your website data and keywords directly from Google Search Console.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {sites.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Image 
                  src="/images/google-search-console-logo.svg" 
                  alt="Google Search Console" 
                  width={48} 
                  height={48} 
                />
                <p className="text-center text-sm text-muted-foreground">
                  Connect your Google Search Console account to import your website data and keywords.
                </p>
                <Button 
                  onClick={handleConnect} 
                  disabled={isLoading}
                  className="mt-2"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium">Select a website to import data from:</p>
                <div className="space-y-2">
                  {sites.map((site) => (
                    <div
                      key={site}
                      className={`flex items-center rounded-md border p-3 cursor-pointer ${
                        selectedSite === site ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedSite(site)}
                    >
                      <div className="flex-1">{site}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {sites.length > 0 && (
              <Button 
                onClick={handleImport} 
                disabled={!selectedSite || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import Data
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 