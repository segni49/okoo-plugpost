"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownItem {
  label: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: "left" | "right"
  className?: string
}

export function Dropdown({ trigger, items, align = "left", className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled && item.onClick) {
      item.onClick()
    }
    setIsOpen(false)
  }

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  "flex w-full items-center px-4 py-2 text-sm text-left transition-colors",
                  item.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: { label: string; value: string }[]
  className?: string
  disabled?: boolean
}

export function Select({
  value,
  onValueChange,
  placeholder = "Select an option",
  options,
  className,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find(option => option.value === value)

  const handleOptionClick = (optionValue: string) => {
    onValueChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)} ref={selectRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm",
          disabled && "bg-gray-50 text-gray-500 cursor-not-allowed"
        )}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDown
            className={cn(
              "h-5 w-5 text-gray-400 transition-transform",
              isOpen && "transform rotate-180"
            )}
          />
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={cn(
                "relative w-full cursor-default select-none py-2 pl-3 pr-9 text-left transition-colors",
                value === option.value
                  ? "bg-blue-600 text-white"
                  : "text-gray-900 hover:bg-gray-100"
              )}
            >
              <span className="block truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
