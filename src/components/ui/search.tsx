"use client"

import { useState, useRef, useEffect } from "react"
import { Search as SearchIcon, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchProps {
  placeholder?: string
  onSearch: (query: string) => void
  onClear?: () => void
  loading?: boolean
  className?: string
  debounceMs?: number
}

export function Search({
  placeholder = "Search...",
  onSearch,
  onClear,
  loading = false,
  className,
  debounceMs = 300,
}: SearchProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, onSearch, debounceMs])

  const handleClear = () => {
    setQuery("")
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "relative flex items-center border rounded-md transition-colors",
          isFocused
            ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-20"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <SearchIcon className="absolute left-3 w-4 h-4 text-gray-400" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-transparent focus:outline-none"
        />

        <div className="absolute right-3 flex items-center space-x-1">
          {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          
          {query && !loading && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface SearchResult {
  id: string
  title: string
  description?: string
  url?: string
  type?: string
}

interface SearchWithResultsProps extends SearchProps {
  results: SearchResult[]
  onResultClick: (result: SearchResult) => void
  showResults?: boolean
  maxResults?: number
}

interface Suggestion {
  text: string
  type: string
  url: string
}

interface SearchWithSuggestionsProps extends SearchProps {
  onSuggestionClick: (suggestion: Suggestion) => void
  showSuggestions?: boolean
}

export function SearchWithSuggestions({
  onSuggestionClick,
  showSuggestions = true,
  ...searchProps
}: SearchWithSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions)
        setIsOpen(data.suggestions.length > 0 && showSuggestions)
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
    }
  }

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    searchProps.onSearch(searchQuery)

    // Debounce suggestions
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery)
    }, 300)
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onSuggestionClick(suggestion)
    setIsOpen(false)
    setQuery(suggestion.text)
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "post":
        return "📄"
      case "category":
        return "📁"
      case "tag":
        return "🏷️"
      default:
        return "🔍"
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Search
        {...searchProps}
        onSearch={handleSearch}
        onClear={() => {
          searchProps.onClear?.()
          setIsOpen(false)
          setSuggestions([])
          setQuery("")
        }}
      />

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.text}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {suggestion.type}
                  </div>
                </div>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => {
                window.location.href = `/search?q=${encodeURIComponent(query)}`
                setIsOpen(false)
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              See all results for "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function SearchWithResults({
  results,
  onResultClick,
  showResults = true,
  maxResults = 10,
  ...searchProps
}: SearchWithResultsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (query: string) => {
    searchProps.onSearch(query)
    setIsOpen(query.length > 0 && showResults)
  }

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result)
    setIsOpen(false)
  }

  const displayResults = results.slice(0, maxResults)

  return (
    <div ref={containerRef} className="relative">
      <Search
        {...searchProps}
        onSearch={handleSearch}
        onClear={() => {
          searchProps.onClear?.()
          setIsOpen(false)
        }}
      />

      {isOpen && displayResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {displayResults.map((result) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </h4>
                  {result.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {result.description}
                    </p>
                  )}
                </div>
                {result.type && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {result.type}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
