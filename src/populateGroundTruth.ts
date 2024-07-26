import AbstractPrompt from "./models/prompts/abstract";
import { BigQueryDataManager } from "./services/bigQueryClient";
import Db from "./services/db";
import { PROMPT_NAME } from "./models/prompts/defaults";
import chatController from "./services/chatController";
import fs from "fs";
import inputs from "./inputs";
import readline from "readline";

async function populate_ground_truths() {
  const db = new Db("local");
  await db.connect();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  async function askQuestion(question: string): Promise<string> {
    return new Promise((resolve) =>
      rl.question(question, (answer) => {
        // Remove punctuation and transform to lowercase
        const cleanedAnswer = answer
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
          .trim()
          .toLowerCase();
        resolve(cleanedAnswer);
      })
    );
  }

  function isAffirmative(response: string): boolean {
    const affirmatives = ["yes", "yeah", "ya", "yea"];
    return affirmatives.includes(response);
  }

  function isNegative(response: string): boolean {
    const negatives = ["no", "nah", "nope"];
    return negatives.includes(response);
  }

  async function getUpdatedMessage(messages: any[], errorMessage: string) {
    const prompt = await AbstractPrompt.findOneByName(PROMPT_NAME);
    return await chatController.chat(
      prompt,
      [
        ...messages,
        {
          sender: "user",
          content: `Previous thought process: ${
            messages[messages.length - 1].content
          }\nPrevious query: ${messages[messages.length - 1].sql}`,
        },
        {
          sender: "user",
          content: `Error Message/Description: ${errorMessage}
            
            Fix the query to intentionally avoid the error described by the user. 
            `,
        },
      ],
      undefined
    );
  }

  for (const input of inputs) {
    const { text, foldername } = input;
    const outputDir = __dirname + `/groundTruths/${foldername}`;
    const inputFilePath = `${outputDir}/input.txt`;
    const outputFilePath = `${outputDir}/output.txt`;

    // Check if the output file already exists
    if (fs.existsSync(outputFilePath)) {
      console.log(`Output for ${foldername} already exists. Skipping...`);
      continue;
    }

    console.log("Input: ", text);
    const prompt = await AbstractPrompt.findOneByName(PROMPT_NAME);
    let message = await chatController.chat(
      prompt,
      [{ sender: "User", content: text }],
      undefined
    );
    let messages = [message];

    let response: any[];
    let isCorrect = false;
    let retryCount = 0;
    const maxRetries = 3;
    console.log("Thought Process: ", message.content);

    while (!isCorrect) {
      try {
        const sql = message.data.sql;
        const thoughtProcess = message.content;
        console.log("Thought Process: \n", thoughtProcess, "\n");
        console.log("SQL: \n", sql, "\n");
        response = await BigQueryDataManager.createInstance().executeQuery(sql);
        console.log(JSON.stringify(response, null, 2));

        console.log(`Manual review required for ${foldername}.`);
        console.log("\n", text, "\n");

        let userResponse = await askQuestion(
          "Is this query correct after manual review? (yes/no): "
        );

        while (!isAffirmative(userResponse) && !isNegative(userResponse)) {
          userResponse = await askQuestion(
            "Please enter a valid response (yes/no): "
          );
        }

        if (isAffirmative(userResponse)) {
          isCorrect = true;
        } else {
          const issueDescription = await askQuestion(
            "Explain in detail what's wrong with the query: "
          );
          messages = [
            ...messages,
            {
              sender: "user",
              content: `Response with SQL: ${JSON.stringify(
                response,
                null,
                2
              )}`,
            },
          ];
          message = await getUpdatedMessage(messages, issueDescription);
          messages = [...messages, message];
        }
      } catch (error) {
        console.log("Query execution error: ", error.message);
        message = await getUpdatedMessage(messages, error.message);
        messages = [...messages, message];
        retryCount++;
        if (retryCount >= maxRetries) {
          console.log("Max retries reached. Manual review required.");
          let userResponse = await askQuestion(
            "Is this query correct after manual review? (yes/no): "
          );

          while (!isAffirmative(userResponse) && !isNegative(userResponse)) {
            userResponse = await askQuestion(
              "Please enter a valid response (yes/no): "
            );
          }

          if (isAffirmative(userResponse)) {
            isCorrect = true;
          } else {
            const issueDescription = await askQuestion(
              "Explain in detail what's wrong with the query: "
            );
            message = await getUpdatedMessage(messages, issueDescription);
            messages = [...messages, message];
          }
        }
      }
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(inputFilePath, text);
    const outputContent = `${message.content}\n${JSON.stringify(
      message.data,
      null,
      2
    )}`;
    fs.writeFileSync(outputFilePath, outputContent);
  }

  rl.close();
}

(async () => {
  await populate_ground_truths();
  process.exit(0);
})();
