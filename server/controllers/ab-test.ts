import { Request, Response } from "express";
import { storage } from "@server/storage";

export async function getAbTests(req: Request, res: Response) {
  try {
    const tests = await storage.getAbTests();
    res.json(tests);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getAbTestResults(req: Request, res: Response) {
  try {
    const tests = await storage.getAbTests();
    const results = await Promise.all(
      tests.map(async (test) => {
        const testResults = await storage.getTestResults(test.id);
        const avgAccuracy =
          testResults.length > 0
            ? Math.round(
                testResults.reduce((sum, r) => sum + (r.accuracyRate || 0), 0) /
                  testResults.length,
              )
            : 0;
        const avgProcessingTime =
          testResults.length > 0
            ? Math.round(
                (testResults.reduce(
                  (sum, r) => sum + (r.processingTime || 0),
                  0,
                ) /
                  testResults.length /
                  60) *
                  10,
              ) / 10
            : 0;
        const avgActionItems =
          testResults.length > 0
            ? Math.round(
                testResults.reduce(
                  (sum, r) => sum + (r.actionItemsFound || 0),
                  0,
                ) / testResults.length,
              )
            : 0;

        return {
          ...test,
          metrics: {
            accuracyRate: avgAccuracy,
            processingTime: avgProcessingTime,
            actionItemsFound: avgActionItems,
            testCount: testResults.length,
          },
        };
      }),
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
