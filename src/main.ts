import {
  PROMPT_NAME,
  bestPrompt,
  evaluatorPrompt,
} from "./models/prompts/defaults";

import AbstractPrompt from "./models/prompts/abstract";
import Db from "./services/db";
import Population from "./population";
import fs from "fs";
import fsPromises from "fs/promises";
import inputs from "./inputs";
import path from "path";
import { shuffleArray } from "./utils";

const NUM_GENERATIONS = 50;

interface OptimizationData {
  trainingSet: string[]; // Array of foldernames
  testSet: string[]; // Array of foldernames
}

async function createPrompt() {
  const evaluator = new AbstractPrompt(evaluatorPrompt);
  await evaluator.save();
  const prompt = new AbstractPrompt(bestPrompt);
  await prompt.save();
  return prompt;
}

function prepareData(): OptimizationData {
  const optimizationFolder = __dirname + "/optimization";
  if (!fs.existsSync(optimizationFolder)) {
    fs.mkdirSync(optimizationFolder);
  }
  const trainingSetPath = optimizationFolder + "/trainingSet.json";
  const testSetPath = optimizationFolder + "/testSet.json";
  if (fs.existsSync(trainingSetPath) && fs.existsSync(testSetPath)) {
    const trainingSet = JSON.parse(fs.readFileSync(trainingSetPath, "utf8"));
    const testSet = JSON.parse(fs.readFileSync(testSetPath, "utf8"));
    return { trainingSet, testSet };
  } else {
    const foldernames = shuffleArray(inputs.map((input) => input.foldername));
    const trainingSet = foldernames.slice(
      0,
      Math.floor(foldernames.length * 0.8)
    );
    const testSet = foldernames.slice(Math.floor(foldernames.length * 0.8));
    fs.writeFileSync(trainingSetPath, JSON.stringify(trainingSet));
    fs.writeFileSync(testSetPath, JSON.stringify(testSet));
    return { trainingSet, testSet };
  }
}

export async function testOriginalPrompt() {
  const db = new Db("local");
  await db.connect();
  console.log("Connected to DB");
  const { trainingSet, testSet } = prepareData();
  console.log("Looking for prompt", PROMPT_NAME);
  const prompt = await AbstractPrompt.findOneByName(PROMPT_NAME);

  const originalPromptPpulation = Population.createPopulationWithPrompt(
    new AbstractPrompt({ ...prompt, name: `Original ${prompt.name}` }),
    trainingSet,
    testSet
  );
  await originalPromptPpulation.test(0);
  await originalPromptPpulation.validate(0);
  await originalPromptPpulation.save(0);
}

interface GenerationSummary {
  generationNumber: number;
  averageTrainingFitness: number;
  averageValidationFitness: number;
}

async function createPromptSummary(promptName: string): Promise<void> {
  const runDirectory = path.join(__dirname, "run", promptName);
  const summaries: GenerationSummary[] = [];

  try {
    const generations = await fsPromises.readdir(runDirectory);

    for (const generation of generations) {
      if (generation.startsWith("generation_")) {
        const generationNumber = parseInt(generation.split("_")[1]);
        const populationPath = path.join(
          runDirectory,
          generation,
          "population.json"
        );

        try {
          const populationData = await fsPromises.readFile(
            populationPath,
            "utf8"
          );
          const population = JSON.parse(populationData);

          summaries.push({
            generationNumber,
            averageTrainingFitness: population.averageTrainingScore || 0,
            averageValidationFitness: population.averageValidationScore || 0,
          });
        } catch (error) {
          console.error(
            `Error reading population file for ${generation}:`,
            error
          );
        }
      }
    }

    // Sort summaries by generation number
    summaries.sort((a, b) => a.generationNumber - b.generationNumber);

    // Write the summary to a JSON file
    const summaryPath = path.join(runDirectory, "prompt_summary.json");
    await fsPromises.writeFile(summaryPath, JSON.stringify(summaries, null, 2));

    console.log(`Summary created for ${promptName} at ${summaryPath}`);
  } catch (error) {
    console.error(`Error creating summary for ${promptName}:`, error);
  }
}

async function optimizePrompt() {
  const db = new Db("local");
  await db.connect();
  console.log("Connected to DB");
  const { trainingSet, testSet } = prepareData();
  console.log("Looking for prompt", PROMPT_NAME);
  let prompt: AbstractPrompt;
  try {
    prompt = await AbstractPrompt.findOneByName(PROMPT_NAME);
  } catch (error) {
    console.log("Prompt not found. Creating new prompt");
    prompt = await createPrompt();
  }

  console.log("Creating population");
  const population = Population.createPopulationWithRandomExamples(
    prompt,
    trainingSet,
    testSet
  );
  await population.test(0);
  await population.validate(0);
  await population.save(0);

  for (
    let currentGeneration = 1;
    currentGeneration <= NUM_GENERATIONS;
    currentGeneration++
  ) {
    console.log("Generation: ", currentGeneration);
    const parentPairs = population.selectParents(population);
    console.log("Parent pairs: ", parentPairs);
    const children = await population.generateChildren(
      parentPairs,
      currentGeneration
    );
    console.log("Children: ", children.individuals.length);
    const mutatedChildren = await population.generateMutatedChildren(children);
    console.log("Mutated children: ", mutatedChildren.individuals.length);
    const newPopulation = Population.merge([
      population,
      children,
      mutatedChildren,
    ]);
    console.log(
      `First Fitness: ${newPopulation.individuals[0].trainingFitness}`
    );
    console.log(
      `Last Fitness: ${
        newPopulation.individuals[newPopulation.individuals.length - 1]
          .trainingFitness
      }`
    );
    console.log(`New Population size: ${newPopulation.individuals.length}`);
    newPopulation.sort();
    newPopulation.cull();
    console.log(`Culled Population size: ${newPopulation.individuals.length}`);
    console.log("Final population: ", newPopulation.individuals.length);
    population.update(newPopulation);
    console.log(
      "Testing population on training set",
      `Individuals: ${population.individuals.length}`
    );
    population.calculateTrainingFitness();
    await population.validate(currentGeneration);
    await population.save(currentGeneration);
  }
}

(async () => {
  await optimizePrompt();
  process.exit(0);
})();
