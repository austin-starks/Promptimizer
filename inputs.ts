const inputs = [
  // Easy Questions
  {
    text: "What is IBM's latest gross profit?",
    foldername: "easy_ibm_latest_gross_profit",
  },
  {
    text: "What is Netflix's highest price today?",
    foldername: "easy_netflix_highest_price_today",
  },
  {
    text: "What is Facebook's latest trading volume?",
    foldername: "easy_facebook_latest_trading_volume",
  },
  {
    text: "What is the latest earnings per share for Amazon?",
    foldername: "easy_amazon_latest_eps",
  },
  {
    text: "What is the total liabilities of Apple?",
    foldername: "easy_apple_total_liabilities",
  },
  {
    text: "What is the price to book value ratio for Google?",
    foldername: "easy_google_price_to_book_value",
  },
  {
    text: "What is the free cash flow of Microsoft for the latest fiscal year?",
    foldername: "easy_microsoft_free_cash_flow",
  },
  {
    text: "What is the market cap of Tesla?",
    foldername: "easy_tesla_market_cap",
  },
  {
    text: "What is the net income of Intel?",
    foldername: "easy_intel_net_income",
  },
  {
    text: "What is the latest return on assets for NVIDIA?",
    foldername: "easy_nvidia_return_on_assets",
  },
  {
    text: "What is Apple's price today?",
    foldername: "easy_apple_price_today",
  },
  {
    text: "What is NVIDIA's latest revenue?",
    foldername: "easy_nvidia_latest_revenue",
  },
  {
    text: "What is Ford's PE ratio (ttm)?",
    foldername: "easy_ford_pe_ratio_ttm",
  },
  {
    text: "What is Microsoft's net income for the latest fiscal year?",
    foldername: "easy_microsoft_net_income",
  },
  {
    text: "What is Amazon's gross profit margin?",
    foldername: "easy_amazon_gross_profit_margin",
  },
  {
    text: "What is Tesla's free cash flow?",
    foldername: "easy_tesla_free_cash_flow",
  },
  {
    text: "What is Google's return on assets?",
    foldername: "easy_google_return_on_assets",
  },
  {
    text: "What is Meta's latest EBITDA?",
    foldername: "easy_meta_latest_ebitda",
  },
  {
    text: "What is Intel's total assets?",
    foldername: "easy_intel_total_assets",
  },
  {
    text: "What is Cisco's latest earnings per share?",
    foldername: "easy_cisco_latest_eps",
  },

  // Medium Questions
  {
    text: "What is the total equity of the top 5 software companies?",
    foldername: "medium_top_5_software_total_equity",
  },
  {
    text: "What are the top 10 stocks by trading volume?",
    foldername: "medium_top_10_trading_volume",
  },
  {
    text: "Which healthcare stocks have the highest price to earnings ratio?",
    foldername: "medium_highest_pe_healthcare",
  },
  {
    text: "What is the latest market cap of the top 10 AI stocks?",
    foldername: "medium_top_10_ai_market_cap",
  },
  {
    text: "Which stocks in the transportation industry have a net income above $1 billion in 2023?",
    foldername: "medium_transportation_net_income",
  },
  {
    text: "What is the average price to sales ratio of the top 5 cloud computing stocks?",
    foldername: "medium_avg_ps_ratio_cloud_computing",
  },
  {
    text: "Which semiconductor stocks have a gross profit margin above 60%?",
    foldername: "medium_semiconductor_gross_profit_margin",
  },
  {
    text: "What is the free cash flow of the top 5 retail stocks?",
    foldername: "medium_top_5_retail_free_cash_flow",
  },
  {
    text: "Which pharmaceutical stocks have the highest EBITDA?",
    foldername: "medium_highest_ebitda_pharma",
  },
  {
    text: "What are the 10 stocks with the lowest (positive) price to free cash flow ratio?",
    foldername: "medium_top_10_tech_pfcf_ratio",
  },
  {
    text: "What is the price of the top 10 AI stocks by market cap?",
    foldername: "medium_top_10_ai_stocks",
  },
  {
    text: "What is the average revenue of the top 25 biotechnology stocks (by market cap)?",
    foldername: "medium_avg_revenue_top_25_biotech",
  },
  {
    text: "Which semiconductor stocks with a revenue above $1 billion also have a net income above $100 million?",
    foldername: "medium_semiconductor_stocks_revenue",
  },
  {
    text: "What are the top 5 stocks in the financial services industry by market cap?",
    foldername: "medium_top_5_financial_services",
  },
  {
    text: "What 10 technology stocks have the highest PE ratio?",
    foldername: "medium_top_10_tech_pe_ratio",
  },
  {
    text: "Which stocks in the healthcare industry have a net income above $500 million?",
    foldername: "medium_healthcare_stocks_net_income",
  },
  {
    text: "What is the average free cash flow of the top 10 e-commerce stocks by market cap?",
    foldername: "medium_avg_free_cash_flow_top_10_ecommerce",
  },
  {
    text: "Which EV stocks have a gross profit margin above 50%?",
    foldername: "medium_ev_stocks_gross_profit_margin",
  },
  {
    text: "What are the latest EBITDA values for the top 10 pharmaceutical stocks?",
    foldername: "medium_top_10_pharma_ebitda",
  },
  {
    text: "Which AI stocks have an Altman Z-Score above 3?",
    foldername: "medium_ai_stocks_altman_z_score",
  },

  // Hard Questions
  {
    text: "What 10 companies with a market cap of $100 billion or more had the lowest price to free cash flow ratio on June 16th 2021?",
    foldername: "hard_lowest_price_fcf_ratio",
  },
  {
    text: "What EV stocks with a free cash flow above a billion dollars had the highest volume month to date?",
    foldername: "hard_ev_stocks_highest_volume",
  },
  {
    text: "Which biotechnology stocks had the highest earnings per share for Q4 of the previous fiscal year?",
    foldername: "hard_biotech_highest_eps_q4",
  },
  {
    text: "What are the top 5 stocks in the renewable energy sector by market cap and their PE ratios?",
    foldername: "hard_top_5_renewable_energy_pe_ratio",
  },
  {
    text: "Which semiconductor stocks had the highest net income for the fiscal year 2020?",
    foldername: "hard_semiconductor_highest_net_income",
  },
  {
    text: "What are the top 5 pharmaceutical stocks by EBITDA and their latest revenues?",
    foldername: "hard_top_5_pharma_ebitda_revenue",
  },
  {
    text: "Which technology stocks have a price to book value ratio above 10 and a market cap above $50 billion?",
    foldername: "hard_tech_stocks_price_book_value",
  },
  {
    text: "What is the average gross profit margin of the top 10 cloud computing stocks by market cap?",
    foldername: "hard_avg_gross_profit_margin_cloud_computing",
  },
  {
    text: "Which stocks in the artificial intelligence sector had the highest free cash flow in the last quarter?",
    foldername: "hard_ai_stocks_highest_fcf",
  },
  {
    text: "What 5 e-commerce stocks with a market cap above $50 billion had the lowest price to sales ratio (ttm)?",
    foldername: "hard_lowest_price_sales_ratio_ecommerce",
  },
  {
    text: "What 5 companies with a market cap above $200 billion have the highest earnings per share?",
    foldername: "hard_highest_eps_200b_market_cap",
  },
  {
    text: "Which stocks in the biotechnology sector had the highest net income in 2021?",
    foldername: "hard_biotech_highest_net_income_2021",
  },
  {
    text: "What are the top 5 technology stocks by market cap and their PE ratios (ttm)?",
    foldername: "hard_top_5_tech_pe_ratio",
  },
  {
    text: "Which renewable energy stocks had the highest gross profit margin in the latest quarter?",
    foldername: "hard_highest_gross_profit_renewable_energy",
  },
  {
    text: "What are the top 5 semiconductor stocks by revenue and their latest net incomes?",
    foldername: "hard_top_5_semiconductor_revenue_net_income",
  },
  {
    text: "Which stocks in the artificial intelligence sector had the highest market cap in 2020?",
    foldername: "hard_highest_market_cap_ai_2020",
  },
  {
    text: "What is the average price to earnings ratio (ttm) of the top 10 healthcare stocks?",
    foldername: "hard_avg_pe_ratio_healthcare",
  },
  {
    text: "Which technology stocks had the highest free cash flow in 2019?",
    foldername: "hard_highest_fcf_tech_2019",
  },
  {
    text: "What are the top 5 pharmaceutical stocks by market cap and their latest gross profits?",
    foldername: "hard_top_5_pharma_market_cap_gross_profit",
  },
  {
    text: "Which cloud computing stocks had the highest price to sales ratio in 2020?",
    foldername: "hard_highest_ps_ratio_cloud_computing_2020",
  },
];

export default inputs;
