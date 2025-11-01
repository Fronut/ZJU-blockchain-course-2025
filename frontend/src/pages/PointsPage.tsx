// src/pages/PointsPage.tsx
import React from 'react';
import { ClaimPoints } from '../components/points/ClaimPoints';

export const PointsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ClaimPoints />
    </div>
  );
};