import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import ScoreBadge from './ScoreBadge';

describe('ScoreBadge Component', () => {
  it('correctly labels high match for score >= 75%', () => {
    const { getByText } = render(<ScoreBadge score={85} />);
    expect(getByText('High Match')).toBeDefined();
    expect(getByText('(85.0%)')).toBeDefined();
  });

  it('correctly labels medium match for 50 <= score < 75', () => {
    const { getByText } = render(<ScoreBadge score={62.5} />);
    expect(getByText('Medium Match')).toBeDefined();
    expect(getByText('(62.5%)')).toBeDefined();
  });

  it('correctly labels low match for score < 50', () => {
    const { getByText } = render(<ScoreBadge score={35} />);
    expect(getByText('Low Match')).toBeDefined();
    expect(getByText('(35.0%)')).toBeDefined();
  });
});
