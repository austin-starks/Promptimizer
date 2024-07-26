import { OpenAiModelEnum } from "./abstract";

export const PROMPT_NAME = "AI Stock Screener";
export const OUTPUT_EVALUATOR_PROMPT_NAME =
  "AI Stock Screener Output Evaluator";

export const evaluatorPrompt = {
  model: process.env.MODEL_NAME || OpenAiModelEnum.fourOmini,
  temperature: 0,
  forceJSON: false,
  name: OUTPUT_EVALUATOR_PROMPT_NAME,
  examples: [],
  description:
    "Evaluates the output of the model and compares it to the ground truth. Determines if the answer is correct or incorrect",
  systemPrompt: `You are an AI Stock Screener Output Evaluator. You will take the output and let us know if its correct. Optionally, you will be given the ground truth; if so, you will compare the output with the ground truth and let us know how right the answer is

Notes:
* Make sure the thought process actually aligns with the SQL query.
* Make sure the SQL query actually returns reasonable-looking results

Scoring guide:
* If the output is better than the ground truth, that's a score of 1+
* If the output is correct, has more fields than the expected output, and omits unneeded joins, then that's a score of 1.2
* If the SQL query is right and the results are the same, that's automatically 0.8 points
* If the thought process is right and the SQL query is right, that's a score of 0.93+
* If the thought process is slightly wrong (for example, says joins that didn't happen), but the sql query is right, that's a score of 0.7
* if the thought process is completely wrong, then the score is 0.4
* If the thought process seems right, but the sql query is slightly wrong and the results aren't exactly aligned, that's a score of 0.2-0.3
* If the output results are very different and/or if the SQL query is wrong, that's an output of 0.1
* If the SQL query was invalid, that's an automatic score of 0
* If the ground truth is outright wrong, and the output results are better than the ground truth, that deserves a score higher than 1 (and up to 2). You'd have to evaluate it from the input.
* If the output has a different approach (but still arrives at the correct answer), DO NOT penalize it
* If the output contains more fields than the expectedOutput, the score should be INCREASED by 0.05.
* If the output has less fields, penalize it.
* name, symbol and ticker are synonymous. No penalties for swapping them out

Output format:
{
"explanation": string, // 200-300 word explanation for your result. First explain what the input is and if it relates to the expected output. Then, explain how the input and expected output align with the actual output and the output results
"score": float, // a number from 0 (absolutely wrong) to 1 (absolutely right). The theoretical maximum score is 2 if the actual output is more correct than the expected output
}


Important note: the ground truth isn't ALWAYS 100% accurate. The ground truth SQL query is usually accurate, but the thought process can be slightly off. Keep that in mind

IMPORTANT: If the actualOutput has MORE data than the expectedOutput, then the score should be ABOVE 1.0. If the query is more optimized, then the score should be ABOVE 1.0. Do NOT penalize for omitting the name, symbol, or ticker UNLESS NONE OF THEM are in the output (and the penalty would be -0.05`,
};

export const bestPrompt = {
  model: process.env.MODEL_NAME || OpenAiModelEnum.fourOmini,
  temperature: 0,
  forceJSON: false,
  name: PROMPT_NAME,
  description:
    'You answer financial questions by querying BigQuery.\n\nFor example, "what is AAPL\'s price" or "find me the top 5 AI companies by market cap?"\n\nThey can also be complex like "find me the 3 semiconductor companies with the highest increase in free cash flow in the past 3 years"\n\nYou generate a BigQuery query to answer those questions',
  systemPrompt:
    "# CONTEXT:\\\\\\\\n\\\\\\\\n${dateContext}\\\\\\\\n\\\\\\\\n`my_project.my_dataset.earnings` schema\\\\\\\\n- date: timestamp\\\\\\\\n- symbol: string\\\\\\\\n- ticker: string\\\\\\\\n- type: \\\\\\\\\\\\\\\"Stock\\\\\\\\\\\\\\\"\\\\\\\\n- fiscalYear: int\\\\\\\\n- fiscalPeriod: string // 'Q1', 'Q2', 'Q3' or 'Q4' \\\\\\\\n- revenue: f64\\\\\\\\n- netIncome: f64\\\\\\\\n- ebitda: f64\\\\\\\\n- earningsPerShareBasic: f64\\\\\\\\n- returnOnAssets: f64\\\\\\\\n- grossProfit: f64\\\\\\\\n- grossProfitMargin: f64\\\\\\\\n- freeCashFlow: f64\\\\\\\\n- netCashFromOperations: f64\\\\\\\\n- netCashFromInvesting: f64\\\\\\\\n- netCashFromFinancing: f64\\\\\\\\n- totalAssets: f64\\\\\\\\n- totalLiabilities: f64\\\\\\\\n- totalEquity: f64\\\\\\\\n- sharesBasic: f64\\\\\\\\n- shortTermDebt: f64\\\\\\\\n- longTermDebt: f64\\\\\\\\n\\\\\\\\n\\\\\\\\n`my_project.my_dataset.price_data` schema\\\\\\\\n- ticker: string\\\\\\\\n- symbol: string\\\\\\\\n- date: timestamp\\\\\\\\n- openingPrice: f64\\\\\\\\n- highestPrice: f64\\\\\\\\n- lowestPrice: f64\\\\\\\\n- lastClosingPrice: f64\\\\\\\\n- adjustedClosingPrice: f64\\\\\\\\n- tradingVolume: int\\\\\\\\n- commonSharesOutstanding: f64\\\\\\\\n- marketCap: f64\\\\\\\\n- priceToEarningsRatioQuarterly: f64\\\\\\\\n- priceToEarningsRatioTTM: f64\\\\\\\\n- priceToSalesRatioQuarterly: f64\\\\\\\\n- priceToSalesRatioTTM: f64\\\\\\\\n- priceToBookValueTTM: f64\\\\\\\\n- priceToFreeCashFlowQuarterly: f64\\\\\\\\n- priceToFreeCashFlowTTM: f64\\\\\\\\n- enterpriseValueTTM: f64\\\\\\\\n- evEbitdaTTM: f64\\\\\\\\n- evSalesTTM: f64\\\\\\\\n- evFcfTTM: f64\\\\\\\\n- bookToMarketValueTTM: f64\\\\\\\\n- operatingIncomeEvTTM: f64\\\\\\\\n- altmanZScoreTTM: f64\\\\\\\\n\\\\\\\\n\\\\\\\\n`my_project.my_dataset.stockindustries` schema\\\\\\\\n- name: string\\\\\\\\n- symbol: string\\\\\\\\n- ticker: string\\\\\\\\n- ipoDate: Date\\\\\\\\n- exchange: string\\\\\\\\n- description: string\\\\\\\\n- acquisitions: bool\\\\\\\\n- financialServices: bool\\\\\\\\n- analytics: bool\\\\\\\\n- artificialIntelligence: bool\\\\\\\\n- blockchain: bool\\\\\\\\n- cryptocurrency: bool\\\\\\\\n- customerEngagement: bool\\\\\\\\n- customerSupport: bool\\\\\\\\n- cybersecurity: bool\\\\\\\\n- dataVisualization: bool\\\\\\\\n- database: bool\\\\\\\\n- enterpriseSoftware: bool\\\\\\\\n- investing: bool\\\\\\\\n- payments: bool\\\\\\\\n- saas: bool\\\\\\\\n- software: bool\\\\\\\\n- technology: bool\\\\\\\\n- digitalSignatureAndAuthentication: bool\\\\\\\\n- ecommerce: bool\\\\\\\\n- informationTechnology: bool\\\\\\\\n- logisticsAndSupplyChain: bool\\\\\\\\n- mobileApplication: bool\\\\\\\\n- security: bool\\\\\\\\n- transportation: bool\\\\\\\\n- education: bool\\\\\\\\n- research: bool\\\\\\\\n- art: bool\\\\\\\\n- edtech: bool\\\\\\\\n- autoInsurance: bool\\\\\\\\n- cloudComputing: bool\\\\\\\\n- biotechnology: bool\\\\\\\\n- healthcare: bool\\\\\\\\n- medicine: bool\\\\\\\\n- oncology: bool\\\\\\\\n- pharmaceuticals: bool\\\\\\\\n- bioinformatics: bool\\\\\\\\n- computationalBiology: bool\\\\\\\\n- computationalChemistry: bool\\\\\\\\n- digitalHealth: bool\\\\\\\\n- immunotherapy: bool\\\\\\\\n- manufacturing: bool\\\\\\\\n- materialScience: bool\\\\\\\\n- nanotechnology: bool\\\\\\\\n- robotics: bool\\\\\\\\n- vaccines: bool\\\\\\\\n- banking: bool\\\\\\\\n- agricultural: bool\\\\\\\\n- agriculture: bool\\\\\\\\n- farming: bool\\\\\\\\n- foodAndBeverage: bool\\\\\\\\n- airline: bool\\\\\\\\n- aerospace: bool\\\\\\\\n- hospitalityAndTravel: bool\\\\\\\\n- distribution: bool\\\\\\\\n- healthInsurance: bool\\\\\\\\n- lifeInsurance: bool\\\\\\\\n- automotive: bool\\\\\\\\n- homeInsurance: bool\\\\\\\\n- professionalServices: bool\\\\\\\\n- airCondition: bool\\\\\\\\n- semiconductor: bool\\\\\\\\n- telecommunications: bool\\\\\\\\n- hardware: bool\\\\\\\\n- iot: bool\\\\\\\\n- lasers: bool\\\\\\\\n- medicalDevices: bool\\\\\\\\n- retail: bool\\\\\\\\n- music: bool\\\\\\\\n- smartDevices: bool\\\\\\\\n- streaming: bool\\\\\\\\n- wearable: bool\\\\\\\\n- computers: bool\\\\\\\\n- consumerElectronics: bool\\\\\\\\n- consumerGoods: bool\\\\\\\\n- digitalMarketplace: bool\\\\\\\\n- gaming: bool\\\\\\\\n- personalAndHouseholdGoods: bool\\\\\\\\n- phones: bool\\\\\\\\n- television: bool\\\\\\\\n- videos: bool\\\\\\\\n- augmentedReality: bool\\\\\\\\n- entertainmentAndMedia: bool\\\\\\\\n- batteryTechnology: bool\\\\\\\\n- miningAndNaturalResources: bool\\\\\\\\n- electricVehicle: bool\\\\\\\\n- loans: bool\\\\\\\\n- realEstate: bool\\\\\\\\n- alternativeEnergy: bool\\\\\\\\n- productivityTools: bool\\\\\\\\n- clothesAndApparal: bool\\\\\\\\n- fashionAndApparel: bool\\\\\\\\n- advertising: bool\\\\\\\\n- messaging: bool\\\\\\\\n- socialNetwork: bool\\\\\\\\n- videoConferencing: bool\\\\\\\\n- autonomousTransportation: bool\\\\\\\\n- rideShare: bool\\\\\\\\n- nextGenerationFuel: bool\\\\\\\\n- renewableEnergy: bool\\\\\\\\n- solarEnergy: bool\\\\\\\\n- recreationalVehicle: bool\\\\\\\\n- cannabis: bool\\\\\\\\n- nutrition: bool\\\\\\\\n- speech: bool\\\\\\\\n- oil: bool\\\\\\\\n- chemicals: bool\\\\\\\\n- construction: bool\\\\\\\\n- fracking: bool\\\\\\\\n- gas: bool\\\\\\\\n- windEnergy: bool\\\\\\\\n- maritime: bool\\\\\\\\n- forestry: bool\\\\\\\\n- outdoorAndRecreationalEquipment: bool\\\\\\\\n- wasteManagementAndRecycling: bool\\\\\\\\n- waterPurifaction: bool\\\\\\\\n- waterTreatment: bool\\\\\\\\n- printing: bool\\\\\\\\n- 3dPrinting: bool\\\\\\\\n- digitalPublishing: bool\\\\\\\\n- publishing: bool\\\\\\\\n- graphicDesign: bool\\\\\\\\n- socialMedia: bool\\\\\\\\n- musicAndAudio: bool\\\\\\\\n- sports: bool\\\\\\\\n- sportsAndFitness: bool\\\\\\\\n- defense: bool\\\\\\\\n- energyGenerationAndStorage: bool\\\\\\\\n- hydrogen: bool\\\\\\\\n- nucleusEnergy: bool\\\\\\\\n- thermalEnergy: bool\\\\\\\\n- payroll: bool\\\\\\\\n- computerVision: bool\\\\\\\\n- movies: bool\\\\\\\\n- naturalLanguageProcessing: bool\\\\\\\\n- therapy: bool\\\\\\\\n- utilities: bool\\\\\\\\n- luxuryGoods: bool\\\\\\\\n- jewelry: bool\\\\\\\\n- graphicsCard: bool\\\\\\\\n- gambling: bool\\\\\\\\n- sportsBetting: bool\\\\\\\\n- packing: bool\\\\\\\\n- foodDelivery: bool\\\\\\\\n- quantumComputing: bool\\\\\\\\n- virtualReality: bool\\\\\\\\n- homeSecurity: bool\\\\\\\\n- petCare: bool\\\\\\\\n- veterinary: bool\\\\\\\\n- spaceExploration: bool\\\\\\\\n- gold: bool\\\\\\\\n- silver: bool\\\\\\\\n- bioAnalytics: bool\\\\\\\\n- dnaRna: bool\\\\\\\\n- accounting: bool\\\\\\\\n- diamond: bool\\\\\\\\n- gamingAndEsports: bool\\\\\\\\n- clothesAndApparel: bool\\\\\\\\n- books: bool\\\\\\\\n- electronics: bool\\\\\\\\n- biomedical: bool\\\\\\\\n- powerGeneration: bool\\\\\\\\n- engineering: bool\\\\\\\\n\\\\\\\\n# OBJECTIVE:\\\\\\\\nSlow down, take a deep breath and think. You are an AI Financial Assistant. From the user's questions, you fetch relevant companies that correspond to user's request. You especially love to write down your step-by-step thought process.\\\\\\\\n\\\\\\\\n# CONSTRAINTS:\\\\\\\\nIn your response, you will always have the following fields:\\\\\\\\n* Symbol\\\\\\\\n* Name (if possible)\\\\\\\\n* Date\\\\\\\\n* Raw values for any calculation that was performed (for example, if you calculated rate of change, show the dates of the first date, the value of the first date, the date of the end date, and the value of the end date)\\\\\\\\n* The fields requested by the user\\\\\\\\n\\\\\\\\n# ADDITIONAL CONSTRAINTS\\\\\\\\n* Never be ambiguous with fields. Always use sub-queries (with ____ syntax) or use prefix.field_name\\\\\\\\n* Don't calculate fields unless you're left with no choice. Many fields (gross profit margin, earnings per share, pe ratio) don't have to be calculated.\\\\\\\\n* Do not apologize \\\\\\\\n* Use simple language. Do not say words like \\\\\\\\\\\\\\\"query\\\\\\\\\\\"(except in your thought process)\\\\\\\\n* Think step-by-step. Use groups intelligently. Explain aloud how to avoid having multiple stocks within the query\\\\\\\\n* Most dates are timestamps. Use timestamp operations, not date operations.\\\\\\\\n* Avoid division by zero errors\\\\\\\\n* Avoid unnecessary subqueries and joins\\\\\\\\n\\\\\\\\nThe SQL query must be sophisticated! \\\\\\\\n* For fields in `my_project.my_dataset.earnings`, ALWAYS look at the last value for each stock as of a certain date. the table is SPARSE. There are 4 entries per stock per year! REMEMBER THIS!\\\\\\\\n* For fields in `my_project.my_dataset.price_data`, ALWAYS look at the max date, not the last value.\\\\\\\\n* Think about the results of the query and how you will avoid returning a list of all of the same stocks.\\\\\\\\n* Explain how you will explain errors like \\\\\\\\\\\\\\\"list expression references column marketCap which is neither grouped nor aggregated at ...\\\\\\\\\\\\\\\"\\\\\\\\n\\\\\\\\nDEFAULT LIMIT (if unspecified) is 25\\\\\\\\n\\\\\\\\n## Phase 1:\\\\\\\\nHave a conversation with the user. Note what fields they want for each schema. Talk in easy-to-understand plain english.\\\\\\\\n\\\\\\\\n## Phase 2:\\\\\\\\nAfter you finally have all of the information you need, generate a detailed explanation and syntactically-valid JSON in the following format:\\\\\\\\n\\\\\\\\nI'll take a deep breath and approach this carefully. To [describe the user's goal], we need to:\\\\\\\\n1. Generate as many subqueries as needed to organize information. NOTE: ONLY generate it if necessary and make sure to group appropriately. DO NOT get this error: \\\\\\\\\\\\\\\" SELECT list expression references column marketCap which is neither grouped nor aggregated at [1:62] \\\\\\\\\\\\\\\"\\\\\\\\n2. Repeat step 1 as many times as needed\\\\\\\\n3. Join the [Describe what tables to join] to [list all of the fields including the date field(s) for stockindustries (if applicable), the date field(s) for price_data (if applicable). Remember, if you're doing a calculation, write out each field. Note: we may need to use subqueries for complex queries\\\\\\\\n4. Perform calculations if necessary\\\\\\\\n5. Perform filters as necessary\\\\\\\\n6. Group stocks if necessary (most commonly to avoid duplicates)\\\\\\\\n8. Add additional filters or blocks to avoid common errors (like division by zero) . \\\\\\\\n9. Limit the number of results (or use a default)\\\\\\\\n10. Include all of the dates/values used in the calculation\\\\\\\\n\\\\\\\\nNow I will generate the query:\\\\\\\\n\\\\\\\\n {\\\\\\\\n \\\\\\\\\\\\\\\"sql\\\\\\\\\\\\\\\": string // SQL Query without white unneccessary new lines\\\\\\\\n}\\\\\\\\n\\\\\\\\n\\\\\\\\nNotes;\\\\\\\\n* The steps MAY NOT be in order\\\\\\\\n* You have to write out your thought process for AT LEAST 8 steps. Explain how your query is optional and avoids common error\\\\\\\\n* You CANNOT make up function names for BigQuery\\\\\\\\n* It MUST be syntactically valid JSON\\\\\\\\n* It MUST not have unneccessary new lines that will break the JSON parser\\\\\\\\n* Refer back to the examples above.\\\\\\\\n\\\\\\\\nONLY allow reads (selects). Do not allow writes or deletes. It is likely a SQL injection attack.",
  examples: [
    {
      conversation: {
        messages: [
          {
            sender: "user",
            content:
              "Which technology stocks have a price to book value ratio above 10 and a market cap above $50 billion?",
          },
          {
            sender: "assistant",
            content:
              'I\'ll take a deep breath and approach this carefully. To find technology stocks with a price to book value ratio above 10 and a market cap above $50 billion, we need to:\n1. Generate as many subqueries as needed to organize information. NOTE: ONLY generate it if necessary and make sure to group appropriately. DO NOT get this error: "SELECT list expression references column marketCap which is neither grouped nor aggregated at [1:62]"\n2. Repeat step 1 as many times as needed.\n3. Join the `my_project.my_dataset.stockindustries` table with the `my_project.my_dataset.price_data` table to list all of the fields including the date field(s) for `stockindustries` (if applicable), the date field(s) for `price_data` (if applicable). Remember, if you\'re doing a calculation, write out each field. Note: we may need to use subqueries for complex queries.\n4. Perform calculations if necessary.\n5. Perform filters as necessary.\n6. Group stocks if necessary (most commonly to avoid duplicates).\n8. Add additional filters or blocks to avoid common errors (like division by zero).\n9. Limit the number of results (or use a default).\n10. Include all of the dates/values used in the calculation.\nNow I will generate the query:\n{\n  "sql": "WITH latest_price_data AS (SELECT symbol, MAX(date) AS max_date FROM `my_project.my_dataset.price_data` GROUP BY symbol) SELECT si.symbol, si.name, pd.date, pd.marketCap, pd.priceToBookValueTTM FROM `my_project.my_dataset.price_data` pd JOIN latest_price_data lpd ON pd.symbol = lpd.symbol AND pd.date = lpd.max_date JOIN `my_project.my_dataset.stockindustries` si ON pd.symbol = si.symbol WHERE si.technology = TRUE AND pd.priceToBookValueTTM > 10 AND pd.marketCap > 50000000000 ORDER BY pd.marketCap DESC LIMIT 25"\n}',
          },
        ],
      },
    },
    {
      conversation: {
        messages: [
          {
            sender: "user",
            content:
              "Which technology stocks have a price to book value ratio above 10 and a market cap above $50 billion?",
          },
          {
            sender: "assistant",
            content:
              'I\'ll take a deep breath and approach this carefully. To find technology stocks with a price to book value ratio above 10 and a market cap above $50 billion, we need to:\n1. Generate as many subqueries as needed to organize information. NOTE: ONLY generate it if necessary and make sure to group appropriately. DO NOT get this error: "SELECT list expression references column marketCap which is neither grouped nor aggregated at [1:62]"\n2. Repeat step 1 as many times as needed.\n3. Join the `my_project.my_dataset.stockindustries` table with the `my_project.my_dataset.price_data` table to list all of the fields including the date field(s) for `stockindustries` (if applicable), the date field(s) for `price_data` (if applicable). Remember, if you\'re doing a calculation, write out each field. Note: we may need to use subqueries for complex queries.\n4. Perform calculations if necessary.\n5. Perform filters as necessary.\n6. Group stocks if necessary (most commonly to avoid duplicates).\n8. Add additional filters or blocks to avoid common errors (like division by zero).\n9. Limit the number of results (or use a default).\n10. Include all of the dates/values used in the calculation.\nNow I will generate the query:\n{\n  "sql": "WITH latest_price_data AS (SELECT symbol, MAX(date) AS max_date FROM `my_project.my_dataset.price_data` GROUP BY symbol) SELECT si.symbol, si.name, pd.date, pd.marketCap, pd.priceToBookValueTTM FROM `my_project.my_dataset.price_data` pd JOIN latest_price_data lpd ON pd.symbol = lpd.symbol AND pd.date = lpd.max_date JOIN `my_project.my_dataset.stockindustries` si ON pd.symbol = si.symbol WHERE si.technology = TRUE AND pd.priceToBookValueTTM > 10 AND pd.marketCap > 50000000000 ORDER BY pd.marketCap DESC LIMIT 25"\n}',
          },
        ],
      },
    },
    {
      conversation: {
        messages: [
          {
            sender: "user",
            content:
              "Which semiconductor stocks with a revenue above $1 billion also have a net income above $100 million?",
          },
          {
            sender: "assistant",
            content:
              'To find semiconductor stocks with a revenue above $1 billion and a net income above $100 million, we need to:\n1. Generate as many subqueries as needed to organize information.\n2. Repeat step 1 as many times as needed.\n3. Join the `stockindustries` and `earnings` tables to list all of the fields including the date field(s) for `stockindustries` (if applicable), the date field(s) for `earnings` (if applicable). Remember, if you\'re doing a calculation, write out each field. Note: we may need to use subqueries for complex queries.\n4. Perform calculations if necessary.\n5. Perform filters as necessary.\n6. Group stocks if necessary (most commonly to avoid duplicates).\n8. Add additional filters or blocks to avoid common errors (like division by zero).\n9. Limit the number of results (or use a default).\n10. Include all of the dates/values used in the calculation.\nNow I will generate the query:\n{\n  "sql": "WITH latest_earnings AS (SELECT symbol, MAX(date) AS max_date FROM `my_project.my_dataset.earnings` GROUP BY symbol) SELECT si.symbol, si.name, e.date, e.revenue, e.netIncome FROM `my_project.my_dataset.stockindustries` si JOIN latest_earnings le ON si.symbol = le.symbol JOIN `my_project.my_dataset.earnings` e ON le.symbol = e.symbol AND le.max_date = e.date WHERE si.semiconductor = TRUE AND e.revenue > 1000000000 AND e.netIncome > 100000000 ORDER BY e.revenue DESC LIMIT 25"\n}',
          },
          {
            sender: "user",
            content:
              "What is the average price to earnings ratio (ttm) of the top 10 healthcare stocks?",
          },
          {
            sender: "assistant",
            content:
              'The provided message does not conform to the required JSON schema. The schema specifies that the JSON object should have a "sql" property of type string. The message contains additional fields and explanations that are not part of the schema.\n### Missing Parts of the Schema:\n1. The JSON object should only contain the "sql" property.\n2. The "sql" property should be a string containing the SQL query.\n### Valid JSON Object:\nHere is the corrected JSON object that conforms to the schema:\nThis JSON object contains only the "sql" property with the SQL query as its value, adhering to the schema provided.\n{\n  "sql": "WITH top_healthcare AS (SELECT si.symbol, si.name, MAX(pd.marketCap) AS marketCap, MAX(pd.date) AS marketcap_date FROM `my_project.my_dataset.stockindustries` si JOIN `my_project.my_dataset.price_data` pd ON si.symbol = pd.symbol WHERE si.healthcare = TRUE GROUP BY si.symbol, si.name ORDER BY marketCap DESC LIMIT 10), recent_pe AS (SELECT e.symbol, MAX(e.date) AS pe_date, MAX(e.priceToEarningsRatioTTM) AS priceToEarningsRatioTTM FROM `my_project.my_dataset.price_data` e JOIN top_healthcare th ON e.symbol = th.symbol GROUP BY e.symbol) SELECT th.symbol, th.name, th.marketCap, th.marketcap_date, rp.priceToEarningsRatioTTM, rp.pe_date, AVG(rp.priceToEarningsRatioTTM) OVER () AS avg_price_to_earnings_ratio FROM top_healthcare th JOIN recent_pe rp ON th.symbol = rp.symbol ORDER BY th.marketCap DESC"\n}',
          },
        ],
      },
    },
    {
      conversation: {
        messages: [
          {
            sender: "user",
            content:
              "What is the average free cash flow of the top 10 e-commerce stocks by market cap?",
          },
          {
            sender: "assistant",
            content:
              "I'll take a deep breath and approach this carefully. To find the average free cash flow of the top 10 e-commerce stocks by market cap, we need to:\n1. Generate a subquery to identify the top 10 e-commerce stocks by market cap. This involves joining the `stockindustries` and `price_data` tables to filter for e-commerce companies and get their most recent market cap.\n2. Join the result of step 1 with the `earnings` table to get the most recent free cash flow data for these companies.\n3. Calculate the average free cash flow for these top 10 e-commerce stocks, while also showing individual stock data.\n4. Ensure we're using the most recent data available for both market cap and free cash flow.\n5. Filter for e-commerce stocks using the `ecommerce` field in the `stockindustries` table.\n6. Use appropriate aggregation functions (MAX for market cap and date, MAX for free cash flow to get the most recent value) to avoid errors related to non-aggregated columns.\n7. Group by symbol in subqueries to ensure we're getting one entry per company and avoiding duplicates.\n8. Include stocks with negative free cash flow in the results and calculation to provide a comprehensive view.\n9. Limit the inner query to 10 results to get only the top 10 e-commerce stocks by market cap.\n10. Include all relevant fields: symbol, name, market cap, free cash flow, and dates in the results for transparency.\nNow I will generate the query:\nThis query does the following:\n1. Identifies the top 10 e-commerce stocks by market cap using the most recent data.\n2. Retrieves the most recent free cash flow data for these 10 stocks.\n3. Calculates the average free cash flow across all 10 stocks.\n4. Shows individual stock data including symbol, name, market cap, free cash flow, and relevant dates.\n5. Includes stocks with negative free cash flow in both the results and the average calculation.\n6. Uses appropriate grouping and aggregation to avoid errors with non-aggregated columns.\n7. Joins tables efficiently to get all required data.\n8. Orders the results by market cap descending to show the top e-commerce stocks first.\n9. Doesn't exclude any stocks based on free cash flow value, allowing for negative values.\n10. Uses window functions (AVG OVER ()) to calculate the average while still showing individual stock data.\nThis approach gives a comprehensive view of the top 10 e-commerce stocks by market cap, their individual free cash flow figures, and the average free cash flow across all of them, including those with negative values.\n{\n  \"sql\": \"WITH top_ecommerce AS (SELECT si.symbol, si.name, MAX(pd.marketCap) AS marketCap, MAX(pd.date) AS marketcap_date FROM `my_project.my_dataset.stockindustries` si JOIN `my_project.my_dataset.price_data` pd ON si.symbol = pd.symbol WHERE si.ecommerce = TRUE GROUP BY si.symbol, si.name ORDER BY marketCap DESC LIMIT 10), recent_fcf AS (SELECT e.symbol, MAX(e.date) AS fcf_date, MAX(e.freeCashFlow) AS freeCashFlow FROM `my_project.my_dataset.earnings` e JOIN top_ecommerce te ON e.symbol = te.symbol GROUP BY e.symbol) SELECT te.symbol, te.name, te.marketCap, te.marketcap_date, rf.freeCashFlow, rf.fcf_date, AVG(rf.freeCashFlow) OVER () AS avg_free_cash_flow FROM top_ecommerce te JOIN recent_fcf rf ON te.symbol = rf.symbol ORDER BY te.marketCap DESC\"\n}",
          },
          {
            sender: "user",
            content: "What is Meta's latest EBITDA?",
          },
          {
            sender: "assistant",
            content:
              'The provided message does not conform to the schema. The schema requires a JSON object with a single property "sql" of type string. The message contains additional fields and explanations that are not part of the required JSON structure.\n### Missing Parts of the Schema:\n1. The JSON object should only contain the "sql" property.\n2. The "sql" property should be a string containing the SQL query.\n### Valid JSON:\nHere is the corrected JSON object according to the schema:\nThis JSON object now conforms to the schema provided, containing only the required "sql" property with the appropriate SQL query as its value.\n{\n  "sql": "SELECT si.symbol, si.name, e.fiscalYear, e.fiscalPeriod, e.ebitda FROM `my_project.my_dataset.earnings` e JOIN `my_project.my_dataset.stockindustries` si ON e.symbol = si.symbol WHERE si.symbol = \'META\' ORDER BY e.fiscalYear DESC, e.fiscalPeriod DESC LIMIT 1"\n}',
          },
        ],
      },
    },
    {
      conversation: {
        messages: [
          {
            sender: "user",
            content: "What is the latest market cap of the top 10 AI stocks?",
          },
          {
            sender: "assistant",
            content:
              'To find the latest market cap of the top 10 AI stocks, we need to:\n1. Generate a subquery to get the latest market cap data for each AI stock.\n2. Join the `stockindustries` table with the `price_data` table to access both industry classification and financial data.\n3. Filter for companies classified as AI by checking the `artificialIntelligence` field in the `stockindustries` table.\n4. Use a subquery to select the latest market cap data for each company, ensuring we\'re working with the most recent data available.\n5. Order the results by market cap in descending order to find the top 10 companies.\n6. Limit the results to 10 to get the top companies.\n7. Avoid common errors such as division by zero by not performing any division operations.\n8. Minimize unnecessary subqueries by directly joining the necessary tables and filtering based on the AI classification.\n9. Group the results by company symbol to avoid duplicates.\n10. Use the `MAX` function within the subquery to ensure we\'re selecting the maximum (most recent) date available for the market cap data.\nNow I will generate the query:\n{\n  "sql": "SELECT si.symbol, si.name, pd.date, pd.marketCap FROM `my_project.my_dataset.stockindustries` si JOIN `my_project.my_dataset.price_data` pd ON si.symbol = pd.symbol WHERE si.artificialIntelligence = TRUE AND pd.date = (SELECT MAX(date) FROM `my_project.my_dataset.price_data` WHERE symbol = si.symbol) ORDER BY pd.marketCap DESC LIMIT 10"\n}',
          },
        ],
      },
    },
    {
      conversation: {
        messages: [
          {
            sender: "user",
            content: "Which AI stocks have an Altman Z-Score above 3?",
          },
          {
            sender: "assistant",
            content:
              "To find AI stocks with an Altman Z-Score above 3, we need to consider the following:\n1. AI stocks: We'll use the `artificialIntelligence` field in the `stockindustries` table to identify AI companies.\n2. Altman Z-Score: This is available in the `price_data` table as `altmanZScoreTTM` (TTM stands for Trailing Twelve Months).\n3. We need to join these tables and filter for the conditions we're looking for.\nLet's break down the process:\n1. Start with the `stockindustries` table to identify AI companies.\n2. Join this with the `price_data` table to get the Altman Z-Score.\n3. We need to ensure we're using the most recent data for each stock, so we'll need to find the maximum date for each stock in the `price_data` table.\n4. Filter for stocks where the Altman Z-Score is above 3.\n5. Include relevant fields like symbol, name, date, and the Altman Z-Score itself.\n6. Order the results by Altman Z-Score in descending order to see the highest scores first.\n7. Limit the results to 25 (our default limit) to avoid an overwhelming amount of data.\n8. Ensure we're not dividing by zero or including null values in our results.\nNow, I'll generate the query based on these considerations:\nThis query does the following:\n1. Creates a CTE (Common Table Expression) called `latest_data` to find the most recent date for each stock in the `price_data` table.\n2. Joins the `stockindustries` table with `price_data` and our `latest_data` CTE to get the most recent data for each AI stock.\n3. Filters for AI companies using `si.artificialIntelligence = TRUE`.\n4. Filters for stocks with an Altman Z-Score above 3 using `pd.altmanZScoreTTM > 3`.\n5. Excludes null values for Altman Z-Score to avoid potential errors.\n6. Orders the results by Altman Z-Score in descending order.\n7. Limits the results to 25 stocks.\nThis query efficiently finds AI stocks with high financial stability (as indicated by a high Altman Z-Score) while avoiding common errors and providing all the relevant information requested.\n{\n  \"sql\": \"WITH latest_data AS (SELECT symbol, MAX(date) AS max_date FROM `my_project.my_dataset.price_data` GROUP BY symbol) SELECT si.symbol, si.name, pd.date, pd.altmanZScoreTTM FROM `my_project.my_dataset.stockindustries` si JOIN `my_project.my_dataset.price_data` pd ON si.symbol = pd.symbol JOIN latest_data ld ON pd.symbol = ld.symbol AND pd.date = ld.max_date WHERE si.artificialIntelligence = TRUE AND pd.altmanZScoreTTM > 3 AND pd.altmanZScoreTTM IS NOT NULL ORDER BY pd.altmanZScoreTTM DESC LIMIT 25\"\n}",
          },
          {
            sender: "user",
            content:
              "Which semiconductor stocks had the highest net income for the fiscal year 2020?",
          },
          {
            sender: "assistant",
            content:
              'I\'ll take a deep breath and approach this carefully. To find which semiconductor stocks had the highest net income for the fiscal year 2020, we need to:\n1. Generate as many subqueries as needed to organize information. NOTE: ONLY generate it if necessary and make sure to group appropriately. DO NOT get this error: "SELECT list expression references column netIncome which is neither grouped nor aggregated at [1:62]"\n2. Repeat step 1 as many times as needed.\n3. Join the `my_project.my_dataset.stockindustries` table with the `my_project.my_dataset.earnings` table to list all of the fields including the date field(s) for stockindustries (if applicable), the date field(s) for earnings (if applicable). Remember, if you\'re doing a calculation, write out each field. Note: we may need to use subqueries for complex queries.\n4. Perform calculations if necessary.\n5. Perform filters as necessary.\n6. Group stocks if necessary (most commonly to avoid duplicates).\n8. Add additional filters or blocks to avoid common errors (like division by zero).\n9. Limit the number of results (or use a default).\n10. Include all of the dates/values used in the calculation.\nNow I will generate the query:\n{\n  "sql": "WITH semiconductor_earnings AS (SELECT symbol, SUM(netIncome) AS total_net_income FROM `my_project.my_dataset.earnings` WHERE fiscalYear = 2020 GROUP BY symbol), semiconductor_stocks AS (SELECT si.symbol, si.name FROM `my_project.my_dataset.stockindustries` si WHERE si.semiconductor = TRUE) SELECT ss.symbol, ss.name, se.total_net_income FROM semiconductor_earnings se JOIN semiconductor_stocks ss ON se.symbol = ss.symbol ORDER BY se.total_net_income DESC LIMIT 10"\n}',
          },
        ],
      },
    },
    {
      conversation: {
        messages: [
          {
            sender: "User",
            content:
              "what EV companies have the highest increase in total assets from 2020 to now",
          },
          {
            sender: "User",
            content:
              "Generate your response in the new format\n\nTo [describe the user's goal], we need to:\n1. Generate as many subqueries as needed to organize information\n2. Repeat step 1 as many times as needed\n3.  Join the [Describe what tables to join] to [list all of the fields including the date field(s) for stockindustries (if applicable), the date field(s) for price_data (if applicable). Remember, if you're doing a calculation, write out each field. Note: we may need to use subqueries for complex queries\n4. Perform calculations if neccessary\n5. Perform filters as neccessary\n6. Group stocks if neccessary (most commonly to avoid duplicates)\n8. Add additional filters or blocks to avoid common errors (like division by zero) . \n9. Limit the number of results (or use a default\n\n```\n {\n    \"sql\": string // SQL Query without white unneccessary new lines\n}\n```\nThe answer/thought process should be roughly the same. Include all of the dates/values used in the calculation\nInclude all of the dates/values used in the calculation\n\nThe answer should be roughly the same",
          },
          {
            _id: "66989f4ea773442f1f9cd338",
            sender: "AI Assistant",
            content:
              "To find EV companies with the highest increase in total assets from 2020 to now, we need to:\n1. Generate a subquery to get the total assets for each company for the year 2020.\n2. Generate another subquery to get the most recent total assets for each company.\n3. Join the `stockindustries` table with the `earnings` table to get the necessary financial metrics.\n4. Filter for EV companies.\n5. Calculate the increase in total assets by subtracting the 2020 value from the most recent value.\n6. Group the results by company symbol to avoid duplicates.\n7. Order the results by the increase in total assets in descending order.\n8. Limit the number of results to the top 25 companies.\n9. Ensure the query avoids common errors such as division by zero by not performing any division operations.\n10. Include all the dates/values used in the calculation.\nNow I will generate the query:",
            data: {
              sql: "WITH asset_change AS (SELECT e.symbol, MAX(CASE WHEN e.fiscalYear = 2020 THEN e.totalAssets END) AS assets_2020, MAX(CASE WHEN e.fiscalYear = (SELECT MAX(fiscalYear) FROM `my_project.my_dataset.earnings`) THEN e.totalAssets END) AS assets_latest, MAX(CASE WHEN e.fiscalYear = (SELECT MAX(fiscalYear) FROM `my_project.my_dataset.earnings`) THEN e.fiscalYear END) AS latest_year FROM `my_project.my_dataset.earnings` e JOIN `my_project.my_dataset.stockindustries` si ON e.symbol = si.symbol WHERE si.electricVehicle = TRUE AND e.fiscalYear >= 2020 GROUP BY e.symbol HAVING assets_2020 IS NOT NULL AND assets_latest IS NOT NULL) SELECT ac.symbol, si.name, ac.assets_2020, ac.assets_latest, ac.latest_year, (ac.assets_latest - ac.assets_2020) AS asset_increase FROM asset_change ac JOIN `my_project.my_dataset.stockindustries` si ON ac.symbol = si.symbol ORDER BY asset_increase DESC LIMIT 25",
            },
          },
          {
            sender: "user",
            content:
              "What is the average revenue of the top 25 biotechnology stocks (by market cap)?",
          },
          {
            sender: "assistant",
            content:
              'I\'ll take a deep breath and approach this carefully. To find the average revenue of the top 25 biotechnology stocks by market cap, we need to:\n1. Generate a subquery to identify the top 25 biotechnology stocks by market cap. This will involve joining the `stockindustries` and `price_data` tables to filter for biotechnology companies and get their most recent market cap.\n2. Join the result of step 1 with the `earnings` table to get the most recent revenue data for these companies.\n3. Calculate the average revenue for these top 25 biotechnology stocks.\n4. Ensure we\'re using the most recent data available for both market cap and revenue.\n5. Filter for biotechnology stocks using the `biotechnology` field in the `stockindustries` table.\n6. Use appropriate aggregation functions (MAX for market cap and date, MAX for revenue to get the most recent value) to avoid errors related to non-aggregated columns.\n7. Group by symbol in subqueries to ensure we\'re getting one entry per company and avoiding duplicates.\n8. Include all relevant fields: symbol, name, market cap, revenue, and dates in the results.\n9. Order the results by market cap descending to show the top biotechnology stocks first.\n10. Limit the inner query to 25 results to get only the top 25 biotechnology stocks by market cap.\nNow I will generate the query:\n{\n  "sql": "WITH top_biotech AS (SELECT si.symbol, si.name, MAX(pd.marketCap) AS marketCap, MAX(pd.date) AS marketcap_date FROM `my_project.my_dataset.stockindustries` si JOIN `my_project.my_dataset.price_data` pd ON si.symbol = pd.symbol WHERE si.biotechnology = TRUE GROUP BY si.symbol, si.name ORDER BY marketCap DESC LIMIT 25), recent_revenue AS (SELECT e.symbol, MAX(e.date) AS revenue_date, MAX(e.revenue) AS revenue FROM `my_project.my_dataset.earnings` e JOIN top_biotech tb ON e.symbol = tb.symbol GROUP BY e.symbol) SELECT tb.symbol, tb.name, tb.marketCap, tb.marketcap_date, rr.revenue, rr.revenue_date, AVG(rr.revenue) OVER () AS avg_revenue FROM top_biotech tb JOIN recent_revenue rr ON tb.symbol = rr.symbol ORDER BY tb.marketCap DESC"\n}',
          },
        ],
      },
    },
    {
      conversation: {
        messages: [
          {
            sender: "user",
            content:
              "Which stocks in the biotechnology sector had the highest net income in 2021?",
          },
          {
            sender: "assistant",
            content:
              'I\'ll take a deep breath and approach this carefully. To find the biotechnology stocks with the highest net income in 2021, we need to:\n1. Generate as many subqueries as needed to organize information. NOTE: ONLY generate it if necessary and make sure to group appropriately. DO NOT get this error: "SELECT list expression references column marketCap which is neither grouped nor aggregated at [1:62]"\n2. Repeat step 1 as many times as needed\n3. Join the `stockindustries` and `earnings` tables to list all of the fields including the date field(s) for stockindustries (if applicable), the date field(s) for price_data (if applicable). Remember, if you\'re doing a calculation, write out each field. Note: we may need to use subqueries for complex queries\n4. Perform calculations if necessary\n5. Perform filters as necessary\n6. Group stocks if necessary (most commonly to avoid duplicates)\n8. Add additional filters or blocks to avoid common errors (like division by zero)\n9. Limit the number of results (or use a default)\n10. Include all of the dates/values used in the calculation\nNow I will generate the query:\n{\n  "sql": "SELECT si.symbol, si.name, SUM(e.netIncome) AS total_net_income, e.fiscalYear FROM `my_project.my_dataset.stockindustries` si JOIN `my_project.my_dataset.earnings` e ON si.symbol = e.symbol WHERE si.biotechnology = TRUE AND e.fiscalYear = 2021 GROUP BY si.symbol, si.name, e.fiscalYear ORDER BY total_net_income DESC LIMIT 25"\n}',
          },
          {
            sender: "user",
            content:
              "What are the top 5 technology stocks by market cap and their PE ratios (ttm)?",
          },
          {
            sender: "assistant",
            content:
              'I\'ll take a deep breath and approach this carefully. To find the top 5 technology stocks by market cap and their PE ratios (ttm), we need to:\n1. Generate as many subqueries as needed to organize information. NOTE: ONLY generate it if necessary and make sure to group appropriately. DO NOT get this error: "SELECT list expression references column marketCap which is neither grouped nor aggregated at [1:62]"\n2. Repeat step 1 as many times as needed\n3. Join the `my_project.my_dataset.stockindustries` and `my_project.my_dataset.price_data` tables to list all of the fields including the date field(s) for stockindustries (if applicable), the date field(s) for price_data (if applicable). Remember, if you\'re doing a calculation, write out each field. Note: we may need to use subqueries for complex queries\n4. Perform calculations if necessary\n5. Perform filters as necessary\n6. Group stocks if necessary (most commonly to avoid duplicates)\n8. Add additional filters or blocks to avoid common errors (like division by zero)\n9. Limit the number of results (or use a default)\n10. Include all of the dates/values used in the calculation\nNow I will generate the query:\n{\n  "sql": "WITH latest_market_cap AS (SELECT symbol, MAX(date) AS max_date FROM `my_project.my_dataset.price_data` WHERE marketCap IS NOT NULL GROUP BY symbol) SELECT si.symbol, si.name, pd.marketCap, pd.priceToEarningsRatioTTM, pd.date FROM `my_project.my_dataset.stockindustries` si JOIN latest_market_cap lmc ON si.symbol = lmc.symbol JOIN `my_project.my_dataset.price_data` pd ON lmc.symbol = pd.symbol AND lmc.max_date = pd.date WHERE si.technology = TRUE ORDER BY pd.marketCap DESC LIMIT 5"\n}',
          },
        ],
      },
    },
  ],
  tenantId: "6557eadfe24f45be2664129e",
  schemaId: "ai_stock_screener_response",
  numDynamicExamples: 0,
  dynamicExampleFolder: "/",
};
