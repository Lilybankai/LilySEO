"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'

interface AddCreditsProps {
  userId: string
  onCreditsAdded: (credits: number) => void
}

export default function AddCredits({ userId, onCreditsAdded }: AddCreditsProps) {
  const { toast } = useToast()
  const [credits, setCredits] = useState<number>(100)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddCredits = async () => {
    if (credits <= 0) {
      setError('Credits must be a positive number')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/lead-finder/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          credits,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add credits')
      }

      const data = await response.json()
      
      toast({
        title: 'Credits Added Successfully',
        description: `${credits} search credits have been added to your account.`,
      })

      // Call the callback with the added credits
      onCreditsAdded(credits)
      
      // Reset the form
      setCredits(100)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to add credits',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Search Credits</CardTitle>
        <CardDescription>
          Add more search credits to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="credits">Number of Credits</Label>
          <Input
            id="credits"
            type="number"
            min="1"
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAddCredits} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Adding...' : 'Add Credits'}
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
} 