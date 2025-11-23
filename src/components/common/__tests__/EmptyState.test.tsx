import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../EmptyState';
import { FileText } from 'lucide-react';

describe('EmptyState', () => {
  it('should render title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <EmptyState 
        title="No items" 
        description="There are no items to display"
      />
    );
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    render(
      <EmptyState 
        title="No items" 
        icon={<FileText data-testid="icon" />}
      />
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState 
        title="No items" 
        actionButton={{
          label: 'Create Item',
          onClick: handleClick,
        }}
      />
    );
    expect(screen.getByText('Create Item')).toBeInTheDocument();
  });

  it('should call action button onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <EmptyState 
        title="No items" 
        actionButton={{
          label: 'Create Item',
          onClick: handleClick,
        }}
      />
    );

    await user.click(screen.getByText('Create Item'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render action button with icon', () => {
    const IconComponent = FileText;
    render(
      <EmptyState 
        title="No items" 
        actionButton={{
          label: 'Create',
          onClick: vi.fn(),
          icon: IconComponent,
        }}
      />
    );
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <EmptyState title="No items" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should accept custom style', () => {
    render(
      <EmptyState 
        title="No items" 
        style={{ padding: '2rem' }}
      />
    );
    const element = screen.getByText('No items').closest('div');
    expect(element).toHaveStyle({ padding: '2rem' });
  });
});

