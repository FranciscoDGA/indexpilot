'use client';

import { Recommendation } from '@/types/intelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

export function RecommendationList({ recommendations }: RecommendationListProps) {
  const sortedByScore = [...recommendations].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      {sortedByScore.map((rec) => (
        <Card key={rec.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">{rec.title}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-gray-100 text-gray-800">{rec.category}</Badge>
                  <Badge className="bg-blue-100 text-blue-800">
                    ROI: {rec.score}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">{rec.description}</p>

            {rec.action_items && rec.action_items.length > 0 && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm font-semibold mb-2">Passos:</p>
                <ul className="text-sm space-y-1">
                  {rec.action_items.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-gray-400">{idx + 1}.</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Impacto: </span>
                <span className="font-semibold">{rec.estimated_impact}</span>
              </div>
              <div>
                <span className="text-gray-500">Esforço: </span>
                <span className="font-semibold">{rec.estimated_effort}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
