
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader } from 'lucide-react';

interface ProgressTrackerProps {
  progress: number;
  currentStep: string;
  isComplete: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  currentStep,
  isComplete
}) => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Extraction Progress</h3>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progress)}%
            </span>
          </div>
          
          <Progress 
            value={progress} 
            className="h-3 bg-gray-200"
          />
          
          <div className="flex items-center space-x-2">
            {!isComplete && (
              <Loader className="h-4 w-4 animate-spin text-blue-600" />
            )}
            <span className={`text-sm ${isComplete ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
              {currentStep}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
