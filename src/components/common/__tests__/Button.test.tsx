import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button, { IconButton, ButtonGroup } from '../Button';
import { Play } from 'lucide-react';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByText('Secondary')).toBeInTheDocument();

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="xs">Extra Small</Button>);
    expect(screen.getByText('Extra Small')).toBeInTheDocument();

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small')).toBeInTheDocument();

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByText('Medium')).toBeInTheDocument();

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(<Button icon={Play}>Play</Button>);
    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByText('Loading');
    expect(button).toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    await user.click(screen.getByText('Disabled'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should accept custom className', () => {
    const { container } = render(<Button className="custom-class">Test</Button>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should accept custom style', () => {
    render(<Button style={{ color: 'red' }}>Styled</Button>);
    const button = screen.getByText('Styled');
    expect(button).toHaveStyle({ color: 'red' });
  });
});

describe('IconButton', () => {
  it('should render icon button', () => {
    render(<IconButton icon={Play} aria-label="Play" />);
    const button = screen.getByLabelText('Play');
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<IconButton icon={Play} onClick={handleClick} aria-label="Play" />);
    await user.click(screen.getByLabelText('Play'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<IconButton icon={Play} size="xs" aria-label="Play" />);
    expect(screen.getByLabelText('Play')).toBeInTheDocument();

    rerender(<IconButton icon={Play} size="lg" aria-label="Play" />);
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<IconButton icon={Play} loading aria-label="Play" />);
    expect(screen.getByLabelText('Play')).toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<IconButton icon={Play} disabled aria-label="Play" />);
    expect(screen.getByLabelText('Play')).toBeDisabled();
  });
});

describe('ButtonGroup', () => {
  it('should render button group with children', () => {
    render(
      <ButtonGroup>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
      </ButtonGroup>
    );
    expect(screen.getByText('Button 1')).toBeInTheDocument();
    expect(screen.getByText('Button 2')).toBeInTheDocument();
  });

  it('should apply spacing prop', () => {
    const { container } = render(
      <ButtonGroup spacing="md">
        <Button>Button 1</Button>
        <Button>Button 2</Button>
      </ButtonGroup>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <ButtonGroup className="custom-group">
        <Button>Button 1</Button>
      </ButtonGroup>
    );
    expect(container.firstChild).toHaveClass('custom-group');
  });
});

