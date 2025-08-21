import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Composer from '@/components/chat/Composer';

describe('Composer', () => {
  const mockOnSend = jest.fn();
  const mockRef = React.createRef<any>();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Composer onSend={mockOnSend} loading={false} ref={mockRef} />);
    
    expect(screen.getByPlaceholderText(/paste a property description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate listing/i })).toBeInTheDocument();
  });

  it('handles input changes', async () => {
    const user = userEvent.setup();
    render(<Composer onSend={mockOnSend} loading={false} ref={mockRef} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test input');
    
    expect(textarea).toHaveValue('Test input');
  });

  it('calls onSend when form is submitted', async () => {
    const user = userEvent.setup();
    render(<Composer onSend={mockOnSend} loading={false} ref={mockRef} />);
    
    const textarea = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /generate listing/i });
    
    await user.type(textarea, 'Test input');
    await user.click(button);
    
    expect(mockOnSend).toHaveBeenCalledWith('Test input');
  });

  it('clears input after sending', async () => {
    const user = userEvent.setup();
    render(<Composer onSend={mockOnSend} loading={false} ref={mockRef} />);
    
    const textarea = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /generate listing/i });
    
    await user.type(textarea, 'Test input');
    await user.click(button);
    
    expect(textarea).toHaveValue('');
  });

  it('does not send empty input', async () => {
    const user = userEvent.setup();
    render(<Composer onSend={mockOnSend} loading={false} ref={mockRef} />);
    
    const button = screen.getByRole('button', { name: /generate listing/i });
    await user.click(button);
    
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('trims whitespace from input', async () => {
    const user = userEvent.setup();
    render(<Composer onSend={mockOnSend} loading={false} ref={mockRef} />);
    
    const textarea = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /generate listing/i });
    
    await user.type(textarea, '  Test input  ');
    await user.click(button);
    
    expect(mockOnSend).toHaveBeenCalledWith('Test input');
  });

  it('shows loading state', () => {
    render(<Composer onSend={mockOnSend} loading={true} ref={mockRef} />);
    
    expect(screen.getByRole('button', { name: /generating/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('exposes ref methods', () => {
    render(<Composer onSend={mockOnSend} loading={false} ref={mockRef} />);
    
    expect(mockRef.current).toHaveProperty('setInput');
    expect(mockRef.current).toHaveProperty('clearInput');
  });

  it('clears input when clearInput is called', async () => {
    const user = userEvent.setup();
    render(<Composer onSend={mockOnSend} loading={false} ref={mockRef} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test input');
    
    await act(async () => {
      mockRef.current.clearInput();
    });
    
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });
});
