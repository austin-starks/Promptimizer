import { BigQuery } from "@google-cloud/bigquery";

export class BigQueryDataManager {
  private bigquery: BigQuery;

  constructor() {
    const credentials = this.setupCredentials();
    this.bigquery = new BigQuery({ credentials });
  }

  private setupCredentials() {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credentialsJson) {
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set"
      );
    }
    try {
      return JSON.parse(credentialsJson);
    } catch (error) {
      throw new Error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON");
    }
  }

  async executeQuery(query: string): Promise<any[]> {
    try {
      if (!query) {
        throw new Error("Query is empty");
      }
      const options = {
        query: query,
        location: "US",
      };
      const [job] = await this.bigquery.createQueryJob(options);
      console.log(`Job ${job.id} started.`);
      const [rows] = await job.getQueryResults();

      return rows;
    } catch (error) {
      console.error("Error executing query: ", error);
      throw error;
    }
  }
  static createInstance() {
    return new BigQueryDataManager();
  }
}
