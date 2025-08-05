import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Lightbulb } from "lucide-react";
import type { AbTest } from "@shared/schema";

interface TestResultWithMetrics extends AbTest {
  metrics: {
    accuracyRate: number;
    processingTime: number;
    actionItemsFound: number;
    testCount: number;
  };
}

export default function ABTesting() {
  const { data: testResults, isLoading } = useQuery<TestResultWithMetrics[]>({
    queryKey: ["/api/ab-tests/results"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getModelBgColor = (model: string, isWinner: boolean) => {
    if (isWinner) return "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200";
    if (model === "speed") return "bg-orange-50 border-orange-200";
    return "bg-gray-50 border-gray-200";
  };

  const getModelStatus = (model: string, metrics: any) => {
    if (!metrics) return { label: "No Data", color: "bg-gray-100 text-gray-700" };
    
    // Find the best performing model based on accuracy
    const bestAccuracy = Math.max(...(testResults?.map((r: any) => r.metrics?.accuracyRate || 0) || [0]));
    
    if (metrics.accuracyRate === bestAccuracy && bestAccuracy > 0) {
      return { label: "Winner", color: "bg-green-100 text-green-700" };
    }
    
    if (model === "default") {
      return { label: "Control", color: "bg-gray-100 text-gray-700" };
    }
    
    return { label: "Testing", color: "bg-orange-100 text-orange-700" };
  };

  const getBestModel = (): TestResultWithMetrics | null => {
    if (!testResults || testResults.length === 0) return null;
    
    return testResults.reduce((best: TestResultWithMetrics | null, current: TestResultWithMetrics) => {
      if (!best || (current.metrics?.accuracyRate || 0) > (best.metrics?.accuracyRate || 0)) {
        return current;
      }
      return best;
    }, null);
  };

  const bestModel = getBestModel();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">A/B Testing Performance</h2>
          <Button className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Create New Test</span>
          </Button>
        </div>

        {!testResults || testResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No A/B test results available</p>
            <p className="text-sm">Upload meetings to start collecting test data</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {testResults.map((test) => {
                const status = getModelStatus(test.model, test.metrics);
                const isWinner = status.label === "Winner";
                
                return (
                  <div key={test.id} className={`rounded-lg p-4 border ${getModelBgColor(test.model, isWinner)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">{test.name}</h3>
                      <Badge variant="outline" className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Accuracy Rate</span>
                        <span className="font-medium text-gray-900">
                          {test.metrics?.accuracyRate || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Processing Time</span>
                        <span className="font-medium text-gray-900">
                          {test.metrics?.processingTime || 0} min
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Action Items Found</span>
                        <span className="font-medium text-gray-900">
                          {test.metrics?.actionItemsFound || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tests Run</span>
                        <span className="font-medium text-gray-900">
                          {test.metrics?.testCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Test Insights */}
            {bestModel && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Test Insights</h4>
                    <p className="text-sm text-blue-800">
                      The {bestModel.name} shows the best overall performance with{" "}
                      {bestModel.metrics?.accuracyRate}% accuracy and{" "}
                      {bestModel.metrics?.actionItemsFound} average action items detected per test.
                      {bestModel.model === "enhanced" && 
                        " While processing takes longer, the improved accuracy makes it the recommended choice for important meetings."
                      }
                      {bestModel.model === "speed" && 
                        " The faster processing time makes it ideal for quick turnaround requirements."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
