# Automated Prompt Optimization

This project implements an automated system for optimizing AI prompts using genetic algorithms and machine learning techniques. It's designed to evolve and improve prompts for specific tasks, particularly focused on AI-driven stock screening.

## Check out NexusTrade

To see the results of the optimized prompt, check out [NexusTrade.io](https://nexustrade.io/). NexusTrade is an AI-Powered automated trading and investment platform that allows users to create, test, optimize, and deploy algorithmic trading strategies.

With the stock screener, you can ask any of the questions within the groundTruths directory, including:

- Which semiconductor stocks had the highest net income for the fiscal year 2020?
- What are the latest EBITDA values for the top 10 pharmaceutical stocks (by market cap)?
- What is the average free cash flow of the top 10 e-commerce stocks by market cap?

Any question about technical or fundamental data, NexusTrade's AI Stock Screener can answer. Try it today for free!

## Features

- Genetic algorithm-based optimization of AI prompts
- Population management with crossover and mutation operations
- Training and validation using separate datasets
- Automated evaluation of prompt performance
- Multi-generational evolution of prompts
- Customizable parameters for population size, generations, and more

## Prerequisites

Before you run this project, ensure you have the following prerequisites set up:

1. **Node.js**: Make sure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).

2. **Populate `inputs.ts`**: Create and populate the `inputs.ts` file with the following format:

```javascript
const inputs = [
  {
    text: "<Question to ask the model>",
    foldername: "foldername_for_the_input_output",
  },
];

export default inputs;
```

3. **Populate `additionalSystemPrompts.ts`**: Create and populate the `additionalSystemPrompts.ts` file with the following format:

```javascript
const additionalSystemPrompts = [
  "System Prompt 1",
  "System Prompt 2",
  "System Prompt 3",
  "System Prompt 4",
  "System Prompt 5",
];

export default additionalSystemPrompts;
```

4. **Set Up Environment Variables**: Create a `.env` file in the root directory of the project and add the following environment variables:

```plaintext
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_APPLICATION_CREDENTIALS_JSON=path_to_your_google_application_credentials_json
CLOUD_DB=your_cloud_db_connection_string
LOCAL_DB=your_local_db_connection_string
```

Replace `your_anthropic_api_key`, `your_openai_api_key`, `path_to_your_google_application_credentials_json`, `your_cloud_db_connection_string`, and `your_local_db_connection_string` with your actual API keys, the path to your Google application credentials JSON file, and your database connection strings.

For the local db, you can populate it with the following:

```plaintext
LOCAL_DB="mongodb://127.0.0.1:27017/promptoptimizer"
```

By default, the system will use the local database specified in `process.env.LOCAL_DB`. If you want to use a cloud database, ensure `process.env.CLOUD_DB` is populated and modify the code to use it as needed.

## Installation

### Node.js Dependencies

To install the necessary Node.js dependencies, run the following command in the root directory of the project:

```bash
npm install
```

### TypeScript and ts-node

To run TypeScript files directly, you need to install `ts-node`. You can install it globally using the following command:

```bash
npm install -g ts-node
```

Alternatively, you can add it as a dev dependency to your project:

```bash
npm install --save-dev ts-node
```

### Python Dependencies

To install the necessary Python dependencies, ensure you have Python installed and then run the following command in the root directory of the project:

```bash
pip install -r requirements.txt
```

This will install the following Python packages:

- `matplotlib`
- `seaborn`
- `pandas`

### MongoDB Installation

To install MongoDB locally, follow these steps:

1. **Download MongoDB**: Go to the [MongoDB Download Center](https://www.mongodb.com/try/download/community) and download the MongoDB Community Server for your operating system.

2. **Install MongoDB**:

- **Windows**: Run the downloaded `.msi` installer and follow the installation instructions.
- **macOS**: Use Homebrew to install MongoDB. Open a terminal and run:

```bash
brew tap mongodb/brew
brew install mongodb-community@5.0
```

- **Linux**: Follow the specific instructions for your Linux distribution on the MongoDB website.

3. **Start MongoDB**:

- **Windows**: MongoDB should start automatically after installation. If not, you can start it manually by running `mongod` in the command prompt.
- **macOS**: Start MongoDB using Homebrew services:

```bash
brew services start mongodb/brew/mongodb-community
```

- **Linux**: Start MongoDB by running:

```bash
sudo systemctl start mongod
```

4. **Verify Installation**: To verify that MongoDB is running, open a terminal or command prompt and run:

```bash
mongo
```

This should open the MongoDB shell, indicating that MongoDB is installed and running correctly.

## Running the TypeScript Script

To run the TypeScript script, you can use `ts-node`. Ensure you have `ts-node` installed as described above, and then run the following command:

```bash
ts-node main.ts
```

Alternatively, you can compile the TypeScript code to JavaScript and then run it using Node.js:

1. Compile the TypeScript code:

```bash
tsc
```

2. Run the compiled JavaScript code:

```bash
node dist/main.js
```

## Running the Python Script

The Python script for visualizing the training and validation fitness over generations is located in the repository. To run the script, use the following command:

```bash
python graph.py
```

By following these instructions, you'll ensure that all necessary dependencies are installed and the project is set up correctly.
