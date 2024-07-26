export function removeJson(text: string) {
  if (!text) {
    return text;
  }
  let firstBrace = text.indexOf("```");
  if (firstBrace === -1) {
    firstBrace = text.indexOf("{");
  }
  let lastBrace = text.lastIndexOf("```");
  let lastIndex = 3;
  if (lastBrace === -1) {
    lastBrace = text.lastIndexOf("}");
    lastIndex = 1;
  }
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return text;
  }
  let result =
    text.substring(0, firstBrace) + text.substring(lastBrace + lastIndex);
  try {
    const json = extractJson(text);
    if (!json) {
      return text;
    }
    const extraNewLinesRegex = /\n\s*\n/g;
    result = result.replace(extraNewLinesRegex, "\n");
    return result.trim();
  } catch (e) {
    return text;
  }
}

export function extractJson(text: string): Record<string, any> | undefined {
  if (!text) {
    return undefined;
  }

  // Use regex to find the JSON content within the text
  const jsonMatch = text.match(/{[\s\S]*}/);
  if (!jsonMatch) {
    return undefined;
  }

  // Extract the JSON string from the matched content
  let jsonString = jsonMatch[0];

  // Remove known non-JSON markers and sanitize the string
  jsonString = jsonString
    .replace(/```SQL/g, "")
    .replace(/```sql/g, "")
    .replace(/```JSON/g, "")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace("\n", " ")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " "); // Remove non-printable characters

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return undefined;
  }
}

export function shuffleArray(array: any[]): any[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export class PromiseAllWithErrorsError<T> extends Error {
  successes: T[];
  errors: string[];

  constructor(successes: T[], errors: string[]) {
    super(`Errors: ${errors.join("; ")}`);
    this.name = "PromiseAllWithErrorsError";
    this.successes = successes;
    this.errors = errors;
  }
}

export const handlePromiseAllWithErrorsError = (err: Error) => {
  if (err instanceof PromiseAllWithErrorsError) {
    for (const error of err.errors) {
      console.error(error);
    }
    return err.successes;
  }
  throw err;
};

export async function promiseAllWithErrors<T>(
  promises: Promise<T>[]
): Promise<T[]> {
  const results = await Promise.allSettled(promises);

  const fulfilled: T[] = [];
  const errors: string[] = [];

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      fulfilled.push(result.value);
    } else {
      errors.push(result.reason);
    }
  });

  if (errors.length > 0) {
    throw new PromiseAllWithErrorsError(fulfilled, errors);
  }

  return fulfilled;
}
