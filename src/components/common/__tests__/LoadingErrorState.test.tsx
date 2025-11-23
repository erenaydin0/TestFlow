import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoadingErrorState from '../LoadingErrorState';

describe('LoadingErrorState', () => {
  it('should render children when not loading and no error', () => {
    render(
      <LoadingErrorState loading={false} error={null}>
        <div>Content</div>
      </LoadingErrorState>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <LoadingErrorState loading={true} error={null}>
        <div>Content</div>
      </LoadingErrorState>
    );
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });

  it('should show custom loading message', () => {
    render(
      <LoadingErrorState loading={true} error={null} loadingMessage="Custom loading...">
        <div>Content</div>
      </LoadingErrorState>
    );
    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <LoadingErrorState loading={false} error="Something went wrong">
        <div>Content</div>
      </LoadingErrorState>
    );
    expect(screen.getByText('Veriler yüklenirken hata oluştu')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show custom error title', () => {
    render(
      <LoadingErrorState 
        loading={false} 
        error="Error message" 
        errorTitle="Custom Error Title"
      >
        <div>Content</div>
      </LoadingErrorState>
    );
    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    
    render(
      <LoadingErrorState 
        loading={false} 
        error="Error message" 
        onRetry={onRetry}
      >
        <div>Content</div>
      </LoadingErrorState>
    );

    const retryButton = screen.getByText('Tekrar Dene');
    await user.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button when onRetry is not provided', () => {
    render(
      <LoadingErrorState loading={false} error="Error message">
        <div>Content</div>
      </LoadingErrorState>
    );
    expect(screen.queryByText('Tekrar Dene')).not.toBeInTheDocument();
  });

  it('should prioritize loading over error', () => {
    render(
      <LoadingErrorState loading={true} error="Error message">
        <div>Content</div>
      </LoadingErrorState>
    );
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
    expect(screen.queryByText('Error message')).not.toBeInTheDocument();
  });
});

