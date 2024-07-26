import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config({ path: ".env" });

const cloudDB = process.env.CLOUD_DB;
const localDB = process.env.LOCAL_DB;
const connectionMap = new Map();
connectionMap.set("cloudDB", cloudDB);
connectionMap.set("cloud", cloudDB);
connectionMap.set("localDB", localDB);
connectionMap.set("local", localDB);

mongoose.set("strictQuery", false);

class Db {
  /**
   * The MongoDB database class
   *
   * @remarks
   * This class handles the connection to the MongoDB database. This can be the local
   * connection, cloud connection, or a test connection (in-memory database).
   */

  private dbType: string;
  private mongod: any;
  public connectionURL: string;

  constructor(dbType: "local" | "cloud" | "nexustrade" | "nexustrade-cloud") {
    this.setDbType(dbType);
  }

  private setDbType(dbType: string) {
    if (!dbType) throw new Error("No database type provided");
    this.dbType = dbType;
  }

  private async connectHelper() {
    const connectionURL = connectionMap.get(this.dbType);
    if (!connectionURL) {
      throw new Error("Invalid database type provided");
    }
    this.connectionURL = connectionURL;
    await mongoose.connect(connectionURL);
    console.log(
      "Successfully connected to " + this.dbType + " database server!"
    );
  }

  private async connectTest() {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongod = new MongoMemoryServer();
    this.mongod = mongod;
    await this.mongod.start();
    const uri = this.mongod.getUri();
    await mongoose.connect(uri);
  }

  public async connect() {
    if (
      this.dbType === "cloud" ||
      this.dbType === "local" ||
      this.dbType === "nexustrade" ||
      this.dbType === "nexustrade-cloud"
    ) {
      await this.connectHelper();
    } else if (this.dbType === "test") {
      await this.connectTest();
    }
  }

  public async closeDatabase() {
    if (
      !this.dbType ||
      this.dbType === "cloud" ||
      this.dbType === "local" ||
      this.dbType === "nexustrade" ||
      this.dbType === "nexustrade-cloud"
    ) {
      await mongoose.connection.close();
    } else if (this.dbType === "test") {
      await mongoose.connection.close();
      await this.mongod.stop();
    }
  }

  public async clearDatabase() {
    if (this.dbType === "test") {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
      return;
    }
    throw new Error("Cannot clear database in non-test environment");
  }
}

export default Db;
