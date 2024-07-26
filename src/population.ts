import AbstractPrompt, { OpenAiModelEnum } from "./models/prompts/abstract";
import {
  extractJson,
  handlePromiseAllWithErrorsError,
  promiseAllWithErrors,
} from "./utils";

import { BigQueryDataManager } from "./services/bigQueryClient";
import { ChatMessage } from "./models/message";
import { OUTPUT_EVALUATOR_PROMPT_NAME } from "./models/prompts/defaults";
import PromptExample from "./models/prompts/example";
import _ from "lodash";
import additionalSystemPrompts from "./additionalSystemPrompts";
import chatController from "./services/chatController";
import fs from "fs";
import path from "path";

enum Resemblence {
  Father = "Father",
  Mother = "Mother",
  None = "None",
}

interface TestResult {
  input: string;
  expectedOutput: string;
  expectedJSON: any;
  actualOutput: string;
  actualJSON: any;
  results: { explanation: string; score: number };
}
const BATCH_SIZE = 1;
const MIN_EXAMPLES = 4;
const MAX_EXAMPLES = 12;
const MIN_CONVERSATIONS_PER_EXAMPLE = 1;
const MAX_CONVERSATIONS_PER_EXAMPLE = 3;

export class Individual {
  trainingFitness: number;
  validationFitness: number;
  prompt: AbstractPrompt;

  private constructor(
    prompt: AbstractPrompt,
    trainingFitness = 0,
    validationFitness = 0
  ) {
    this.prompt = prompt;
    this.trainingFitness = trainingFitness;
    this.validationFitness = validationFitness;
  }

  static create(prompt: AbstractPrompt): Individual {
    return new Individual(new AbstractPrompt(prompt));
  }

  randomizeExamples(
    fatherExamples: PromptExample[],
    motherExamples: PromptExample[]
  ): PromptExample[] {
    const maxLength = Math.max(fatherExamples.length, motherExamples.length);
    const examples: PromptExample[] = [];
    for (let i = 0; i < maxLength; i++) {
      // at ramdom, pick from examples1 and examples2
      // if the selection is undefined (i.e. the index is out of bounds), continue to the next iteration
      const fatherExample = fatherExamples[i];
      const motherExample = motherExamples[i];
      const example = Math.random() > 0.5 ? fatherExample : motherExample;
      if (!example) {
        continue;
      }
      examples.push(example);
    }
    return examples;
  }

  private async compareResults(
    input: string,
    expectedResponse: string,
    actualResponse: string,
    expectedJson: any[],
    actualJson: any[]
  ): Promise<{ explanation: string; score: number }> {
    const evaluatorPrompt = await AbstractPrompt.findOneByName(
      OUTPUT_EVALUATOR_PROMPT_NAME
    );

    const evaluationInput = `
    Input:
    ${input}

    Expected Response:
    ${expectedResponse}
    
    Actual Response:
    ${actualResponse}
    
    Expected JSON Snippet:
    ${JSON.stringify(expectedJson.slice(0, 5), null, 2)}
    
    Actual JSON Snippet:
    ${JSON.stringify(actualJson.slice(0, 5), null, 2)}
      `;

    const response = await chatController.chat(
      evaluatorPrompt,
      [{ sender: "user", content: evaluationInput }],
      OpenAiModelEnum.fourOmini
    );

    const { explanation, score } = response.data;
    if (_.isNil(score) || _.isNil(explanation)) {
      console.error(
        `Failed to evaluate the response | score: ${score}, explanation: ${explanation}`
      );
      throw new Error("Failed to evaluate the response");
    }
    return { explanation, score };
  }

  async test(dataset: string[], currentGeneration: number): Promise<number> {
    const testResultsPromises = dataset.map(async (folder) => {
      const inputPath = path.join(
        __dirname,
        "groundTruths",
        folder,
        "input.txt"
      );
      const outputPath = path.join(
        __dirname,
        "groundTruths",
        folder,
        "output.txt"
      );
      // const outputResultPath = path.join(
      //   __dirname,
      //   "groundTruths",
      //   folder,
      //   "output_result.json"
      // );

      const [input, expectedOutput] = await Promise.all([
        fs.promises.readFile(inputPath, "utf8"),
        fs.promises.readFile(outputPath, "utf8"),
      ]);

      const testResultPath = path.join(
        __dirname,
        "run",
        `${this.prompt.name}`,
        `generation_${currentGeneration}`,
        `${folder}_test_result.json`
      );

      if (fs.existsSync(testResultPath)) {
        console.log(
          `Test results for ${folder} already exist for generation ${currentGeneration}. Skipping.`
        );
        const testResultData = await fs.promises.readFile(
          testResultPath,
          "utf8"
        );
        return JSON.parse(testResultData).results.score;
      }

      console.log(`Testing individual with input: ${input}`);
      const response = await chatController.chat(
        this.prompt,
        [{ sender: "user", content: input }],
        OpenAiModelEnum.fourOmini
      );

      const query = response?.data?.sql;
      console.log(`Executing query`);
      const bigQueryClient = BigQueryDataManager.createInstance();
      const queryResult = await bigQueryClient
        .executeQuery(query)
        .catch((err) => {
          console.error(`Query execution failed: ${err}`);
          throw new Error(`Query execution failed: ${err}`);
        });
      console.log(`Query executed successfully`);
      const expectedJSON = await bigQueryClient.executeQuery(
        extractJson(expectedOutput)?.sql
      );
      const comparisonResult = await this.compareResults(
        input,
        expectedOutput,
        response.content,
        expectedJSON,
        queryResult
      );
      console.log(`Retrieved comparison result`);
      return comparisonResult.score;
    });
    console.log("Evaluating scores");
    const scores = await promiseAllWithErrors(testResultsPromises).catch(
      handlePromiseAllWithErrorsError
    );
    return scores.reduce((total, score) => total + score, 0);
  }

  async crossover(
    individual: Individual,
    resemblence: Resemblence
  ): Promise<Individual> {
    const crossoverPrompt = await AbstractPrompt.findOneByName(
      "Prompt Crossover"
    );

    function resemblenceContent() {
      if (resemblence === Resemblence.Father) {
        return "The child prompt should more closely resemble the father prompt";
      }
      if (resemblence === Resemblence.Mother) {
        return "The child prompt should more closely resemble the mother prompt";
      }
      return "The child prompt should be an equal combination of the mother and father prompts";
    }
    const messages: ChatMessage[] = [
      {
        sender: "user",
        content: JSON.stringify({
          father: individual.prompt.systemPrompt,
          mother: this.prompt.systemPrompt,
        }),
      },

      {
        sender: "user",
        content: `${resemblenceContent()}
        
        * Length: The length should be at least as long as the shortest prompt and longer than the longest prompt
        * Content: The child prompt should have content that is the combination of the parent prompts.
        * Similarity: The child prompt should resemble the mother and the father`,
      },
    ];
    console.log(`Creating a child with resemblence: ${resemblence}`);
    const response = await chatController
      .chat(crossoverPrompt, messages, OpenAiModelEnum.fourOmini)
      .catch((err) => {
        return { sender: "assistant", content: `Error: ${err}`, data: {} };
      });
    console.log(
      `Child created with resemblence: ${resemblence}. Randomizing examples`
    );
    const examples = this.randomizeExamples(
      this.prompt.examples,
      individual.prompt.examples
    );

    const newPrompt = new AbstractPrompt({
      ...this.prompt,
      systemPrompt: `${response.content}\n${
        response.data ? JSON.stringify(response.data) : ""
      }`,
      examples,
    });
    console.log(`Examples randomized`);
    return Individual.create(newPrompt);
  }
}

class Population {
  individuals: Individual[];
  trainingSet: string[];
  validationSet: string[];
  initialPopulationSize: number;
  originalPrompt: AbstractPrompt;
  averageTrainingScore: number;
  averageValidationScore: number;

  private constructor(
    originalPrompt: AbstractPrompt,
    individuals: Individual[],
    trainingSet: string[],
    validationSet: string[],
    initialPopulationSize: number
  ) {
    this.originalPrompt = new AbstractPrompt(originalPrompt);
    this.individuals = individuals;
    this.trainingSet = trainingSet;
    this.validationSet = validationSet;
    this.initialPopulationSize = initialPopulationSize;
    this.averageTrainingScore = 0;
    this.averageValidationScore = 0;
  }

  static generateRandomExamples(allExamples: PromptExample[]): PromptExample[] {
    const numExamples =
      Math.floor(Math.random() * (MAX_EXAMPLES - MIN_EXAMPLES)) + MIN_EXAMPLES;
    const examples: PromptExample[] = [];

    for (let i = 0; i < numExamples; i++) {
      const numConversations =
        Math.floor(
          Math.random() *
            (MAX_CONVERSATIONS_PER_EXAMPLE - MIN_CONVERSATIONS_PER_EXAMPLE)
        ) + MIN_CONVERSATIONS_PER_EXAMPLE;

      const combinedMessages: ChatMessage[] = [];
      for (let j = 0; j < numConversations; j++) {
        const exampleIndex = Math.floor(Math.random() * allExamples.length);
        const example = allExamples[exampleIndex];
        combinedMessages.push(..._.cloneDeep(example.conversation.messages));
      }
      const combinedExample = new PromptExample({
        messages: combinedMessages,
      });
      examples.push(combinedExample);
    }

    return examples;
  }

  static loadExamplesFromTrainingSet(
    prompt: AbstractPrompt,
    trainingSet: string[]
  ): PromptExample[] {
    const allExamples = [...prompt.examples];
    prompt.examples = [];

    for (const trainingExample of trainingSet) {
      const inputPath = path.join(
        __dirname,
        "groundTruths",
        trainingExample,
        "input.txt"
      );
      const outputPath = path.join(
        __dirname,
        "groundTruths",
        trainingExample,
        "output.txt"
      );

      const input = fs.readFileSync(inputPath, "utf8");
      const output = fs.readFileSync(outputPath, "utf8");

      const messages: ChatMessage[] = [
        {
          sender: "user",
          content: input,
        },
        {
          sender: "assistant",
          content: output,
        },
      ];
      const example = new PromptExample({ messages });
      allExamples.push(example);
    }

    return allExamples;
  }

  static createPopulationWithRandomExamples(
    prompt: AbstractPrompt,
    trainingSet: string[],
    validationSet: string[]
  ): Population {
    const runDirectory = path.join(__dirname, "run", `${prompt.name}`);

    // Check if the directory exists and contains any generations
    if (fs.existsSync(runDirectory)) {
      const generations = fs
        .readdirSync(runDirectory)
        .filter((name) => name.startsWith("generation_"))
        .map((name) => parseInt(name.split("_")[1]))
        .sort((a, b) => b - a);

      if (generations.length > 0) {
        // Get the latest generation
        const latestGeneration = generations[0];
        const latestGenerationPath = path.join(
          runDirectory,
          `generation_${latestGeneration}`,
          "population.json"
        );
        if (fs.existsSync(latestGenerationPath)) {
          // Read and parse the population file
          const populationData = fs.readFileSync(latestGenerationPath, "utf8");
          const population = JSON.parse(populationData);
          // Transform the parsed data back to Population and Individual instances
          const individuals: Individual[] = population.individuals.map(
            (ind: Individual) => {
              const individual = Individual.create(ind.prompt);
              return individual;
            }
          );
          console.log(
            `Loaded population for ${prompt.name} from file`,
            `| latest generation: ${latestGeneration}`
          );
          return new Population(
            prompt,
            individuals,
            population.trainingSet,
            population.validationSet,
            individuals.length
          );
        }
      }
    }

    const allExamples = Population.loadExamplesFromTrainingSet(
      prompt,
      trainingSet
    );
    const individuals: Individual[] = [];
    for (const systemPrompt of [
      prompt.systemPrompt,
      ...additionalSystemPrompts,
    ]) {
      const examples = Population.generateRandomExamples(allExamples);
      const newPrompt = new AbstractPrompt({
        ...prompt,
        examples,
        systemPrompt,
      });
      const individual = Individual.create(newPrompt);
      individuals.push(individual);
    }

    const population = Population.create(
      prompt,
      individuals,
      trainingSet,
      validationSet
    ).sort();
    return population;
  }

  static createPopulationWithPrompt(
    prompt: AbstractPrompt,
    trainingSet: string[],
    validationSet: string[]
  ): Population {
    const individuals: Individual[] = [Individual.create(prompt)];
    const population = Population.create(
      prompt,
      individuals,
      trainingSet,
      validationSet
    ).sort();
    return population;
  }

  static create(
    originalPrompt: AbstractPrompt,
    individuals: Individual[],
    trainingSet: string[],
    validationSet: string[]
  ): Population {
    const population = new Population(
      originalPrompt,
      individuals,
      trainingSet,
      validationSet,
      individuals.length
    );
    return population;
  }

  static merge(populations: Population[]): Population {
    if (populations.length === 0) {
      throw new Error("No populations to merge");
    }
    const newPopulation = new Population(
      populations[0].originalPrompt,
      _.cloneDeep(
        populations.map((population) => population.individuals)
      ).flat(),
      populations[0].trainingSet,
      populations[0].validationSet,
      populations[0].initialPopulationSize
    );
    return newPopulation;
  }

  sort(): Population {
    this.individuals.sort((a, b) => b.trainingFitness - a.trainingFitness);
    return this;
  }

  cull(): Population {
    // Assumes the population is already sorted
    console.log(`Pre-culling population size: ${this.individuals.length}`);
    if (this.individuals.length > this.initialPopulationSize) {
      this.individuals = this.individuals.slice(0, this.initialPopulationSize);
    }
    console.log(`Post-culling population size: ${this.individuals.length}`);
    return this;
  }

  selectParents(population: Population): [number, number][] {
    // Calculate the total fitness of the population
    const totalFitness = population.individuals.reduce(
      (sum, individual) => sum + individual.trainingFitness,
      0
    );

    // Compute cumulative fitness values
    const cumulativeFitness = population.individuals.map((_, index) => {
      return population.individuals
        .slice(0, index + 1)
        .reduce((sum, ind) => sum + ind.trainingFitness, 0);
    });

    const selectIndividual = (rand: number): number => {
      for (let i = 0; i < cumulativeFitness.length; i++) {
        if (rand < cumulativeFitness[i]) {
          return i;
        }
      }
      return cumulativeFitness.length - 1;
    };

    const parents: [number, number][] = [];

    // Select pairs of parents
    for (let i = 0; i < population.individuals.length / 2; i++) {
      const rand1 = Math.random() * totalFitness;
      const parent1 = selectIndividual(rand1);
      let parent2 = parent1;
      let numIterations = 0;
      while (parent2 === parent1) {
        const rand2 = Math.random() * totalFitness;
        parent2 = selectIndividual(rand2);
        numIterations++;
        if (numIterations > 10000) {
          console.log(population.individuals.map((ind) => ind.trainingFitness));
          throw new Error("Failed to select a different parent");
        }
      }

      parents.push([parent1, parent2]);
    }

    return parents;
  }

  async generateChildren(
    parentPairs: [number, number][],
    currentGeneration: number
  ): Promise<Population> {
    const childrenPromises: Promise<Individual>[] = [];
    for (const [parent1, parent2] of parentPairs) {
      const equalChild = this.individuals[parent1]
        .crossover(this.individuals[parent2], Resemblence.None)
        .then(async (child) => {
          const fitness = await child.test(this.trainingSet, currentGeneration);
          child.trainingFitness = fitness;
          return child;
        });
      const fatherChild = this.individuals[parent1]
        .crossover(this.individuals[parent2], Resemblence.Father)
        .then(async (child) => {
          const fitness = await child.test(this.trainingSet, currentGeneration);
          child.trainingFitness = fitness;
          return child;
        });
      const motherChild = this.individuals[parent1]
        .crossover(this.individuals[parent2], Resemblence.Mother)
        .then(async (child) => {
          const fitness = await child.test(this.trainingSet, currentGeneration);
          child.trainingFitness = fitness;
          return child;
        });
      childrenPromises.push(equalChild, fatherChild, motherChild);
    }
    console.log("Generating children", childrenPromises.length);
    const children = await promiseAllWithErrors(childrenPromises).catch((err) =>
      handlePromiseAllWithErrorsError(err)
    );
    console.log("Generated children", children.length);
    const newPopulation = new Population(
      this.originalPrompt,
      children,
      this.trainingSet,
      this.validationSet,
      this.initialPopulationSize
    );
    return newPopulation;
  }

  async generateMutatedChildren(population: Population): Promise<Population> {
    const randomIdx1 = Math.floor(
      Math.random() * population.individuals.length
    );
    const randomIdx2 = Math.floor(
      Math.random() * population.individuals.length
    );
    const child1 = _.cloneDeep(population.individuals[randomIdx1]);
    const child2 = _.cloneDeep(population.individuals[randomIdx2]);
    const child1Examples = Population.loadExamplesFromTrainingSet(
      child1.prompt,
      this.trainingSet
    );
    const child2Examples = Population.loadExamplesFromTrainingSet(
      child2.prompt,
      this.trainingSet
    );
    child1.prompt.examples = Population.generateRandomExamples(child1Examples);
    child2.prompt.examples = Population.generateRandomExamples(child2Examples);
    const children = [child1, child2].map(async (child) => {
      const fitness = await child.test(this.trainingSet, 0);
      child.trainingFitness = fitness;
      return child;
    });
    return Population.create(
      this.originalPrompt,
      await promiseAllWithErrors(children).catch(
        handlePromiseAllWithErrorsError
      ),
      this.trainingSet,
      this.validationSet
    );
  }

  async save(generation: number): Promise<Population> {
    // save the population to the filesystem with the generation number, the prompts in the population and their associated scores
    console.log(
      `Saving population with ${this.individuals.length} individuals`
    );
    console.log("Generation: ", generation);
    const baseRunDirectory = path.join(__dirname, "run");
    const promptRunDirectory = path.join(
      baseRunDirectory,
      `${this.originalPrompt.name}`
    );
    const generationDirectory = path.join(
      promptRunDirectory,
      `generation_${generation}`
    );

    // Create directories if they don't exist
    if (!fs.existsSync(baseRunDirectory)) {
      fs.mkdirSync(baseRunDirectory);
    }
    if (!fs.existsSync(promptRunDirectory)) {
      fs.mkdirSync(promptRunDirectory);
    }
    if (!fs.existsSync(generationDirectory)) {
      fs.mkdirSync(generationDirectory);
    }
    const populationPath = path.join(generationDirectory, "population.json");
    fs.writeFileSync(populationPath, JSON.stringify(this, null, 2));
    return this;
  }

  update(newPopulation: Population): void {
    this.individuals = _.cloneDeep(newPopulation.individuals);
  }

  calculateTrainingFitness(): void {
    this.averageTrainingScore = this.individuals.reduce(
      (sum, individual) => sum + individual.trainingFitness,
      0
    );
    this.averageTrainingScore /= this.individuals.length;
  }

  async test(currentGeneration: number): Promise<void> {
    console.log("Number of individuals: ", this.individuals.length);
    this.averageTrainingScore = 0;
    for (let i = 0; i < this.individuals.length; i += BATCH_SIZE) {
      const batch = this.individuals.slice(i, i + BATCH_SIZE);
      const trainingScores = await Promise.all(
        batch.map((individual) =>
          individual.test(this.trainingSet, currentGeneration)
        )
      );
      console.log("Batch scores: ", trainingScores);
      for (let j = 0; j < batch.length; j++) {
        const individual = batch[j];
        const score = trainingScores[j];
        console.log("Training score: ", score);
        individual.trainingFitness = score;
        this.averageTrainingScore += score;
      }
    }
    this.averageTrainingScore /= this.individuals.length;
    console.log("Average training score: ", this.averageTrainingScore);
  }

  async validate(currentGeneration: number): Promise<void> {
    console.log("Number of individuals: ", this.individuals.length);
    this.averageValidationScore = 0;
    for (let i = 0; i < this.individuals.length; i += BATCH_SIZE) {
      const batch = this.individuals.slice(i, i + BATCH_SIZE);
      const validationScores = await Promise.all(
        batch.map((individual) =>
          individual.test(this.validationSet, currentGeneration)
        )
      );
      console.log("Batch scores: ", validationScores);
      for (let j = 0; j < batch.length; j++) {
        const individual = batch[j];
        const score = validationScores[j];
        console.log("Validation score: ", score);
        individual.validationFitness = score;
        this.averageValidationScore += score;
      }
    }
    this.averageValidationScore /= this.individuals.length;
    console.log("Average validation score: ", this.averageValidationScore);
  }
}

export default Population;
