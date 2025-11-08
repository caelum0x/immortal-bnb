/**
 * Tests for TradingStats Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import TradingStats from '../TradingStats';
import * as api from '@/lib/api';

// Mock the API module
jest.mock('@/lib/api');

describe('TradingStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (api.safeApiCall as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<TradingStats />);

    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('displays trading stats after loading', async () => {
    const mockStats = {
      totalTrades: 25,
      wins: 18,
      losses: 7,
      winRate: 72,
      totalPL: 1.25,
      avgPL: 0.05,
    };

    (api.safeApiCall as jest.Mock).mockResolvedValue({
      data: mockStats,
      isMock: false,
    });

    render(<TradingStats />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('72.0%')).toBeInTheDocument();
      expect(screen.getByText('+1.2500 BNB')).toBeInTheDocument();
    });
  });

  it('shows win/loss breakdown', async () => {
    const mockStats = {
      totalTrades: 25,
      wins: 18,
      losses: 7,
      winRate: 72,
      totalPL: 1.25,
      avgPL: 0.05,
    };

    (api.safeApiCall as jest.Mock).mockResolvedValue({
      data: mockStats,
      isMock: false,
    });

    render(<TradingStats />);

    await waitFor(() => {
      expect(screen.getByText('18W / 7L')).toBeInTheDocument();
    });
  });
});
