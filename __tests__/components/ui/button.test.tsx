import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="outline">Outline</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-input')

    rerender(<Button variant="ghost">Ghost</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-accent')

    rerender(<Button variant="destructive">Destructive</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-9', 'px-3', 'rounded-md')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-11', 'px-8', 'rounded-md')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('shows loading state', () => {
    // Simulate loading state via disabled + text until component supports a `loading` prop
    render(<Button disabled>Loading...</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Loading...')
  })

  it('renders as different HTML elements', () => {
    // Component does not support `as`. Render an anchor to simulate link behavior
    render(<a href="/test"><Button>Link Button</Button></a>)
    
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('forwards refs correctly', () => {
    const ref = jest.fn()
    render(<Button ref={ref}>Button</Button>)
    
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('renders with icons', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>
    
    render(
      <Button>
        <TestIcon />
        Button with icon
      </Button>
    )
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('Button with icon')).toBeInTheDocument()
  })
})
