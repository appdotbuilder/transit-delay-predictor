import { db } from '../db';
import { queriesTable } from '../db/schema';
import { type PredictionInput, type PredictionOutput } from '../schema';

/**
 * Handler for predicting transit delays
 * This handler accepts route, stop, and datetime information and returns
 * a prediction using a placeholder AI model that generates random delays
 * between 0-15 minutes with confidence scores between 70-95%.
 * 
 * The prediction is stored in the database for analytics and tracking.
 * Future implementation will integrate with a Python ML service.
 */
export async function predictDelay(input: PredictionInput): Promise<PredictionOutput> {
  try {
    // Placeholder AI model - generates random delay between 0-15 minutes
    const predictionMinutes = Math.floor(Math.random() * 16); // 0-15 minutes
    
    // Generate confidence score between 70-95%
    const confidenceScore = 70 + Math.floor(Math.random() * 26); // 70-95%
    
    // Determine delay label based on prediction
    const delayLabel = predictionMinutes <= 2 ? 'On Time' : 'Delayed';
    
    // Placeholder weather data (will be integrated with weather API later)
    const placeholderWeather = ['Clear', 'Rainy', 'Cloudy', 'Snowy'][Math.floor(Math.random() * 4)];
    
    // Store the query and prediction in the database
    const result = await db.insert(queriesTable)
      .values({
        route: input.route,
        stop: input.stop,
        datetime: input.datetime,
        weather: placeholderWeather,
        prediction: predictionMinutes,
        confidence: confidenceScore // Real column - no conversion needed for integer
      })
      .returning()
      .execute();

    const queryRecord = result[0];

    // Return structured prediction response
    return {
      id: queryRecord.id,
      route: queryRecord.route,
      stop: queryRecord.stop,
      datetime: queryRecord.datetime,
      weather: queryRecord.weather,
      prediction: queryRecord.prediction,
      confidence: queryRecord.confidence, // Real column - already a number
      label: delayLabel,
      created_at: queryRecord.created_at
    };
  } catch (error) {
    console.error('Prediction failed:', error);
    throw error;
  }
}