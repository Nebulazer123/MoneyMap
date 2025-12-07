# Lifestyle Merchant Pools — Phase 2

Source of truth for **PLAN.md §5.4.2–5.4.3**  
File: `docs/lifestyle_merchant_pools_v1.md`

These pools define the **selection universe** for the LifestyleProfile and transaction generator.  
All counts and categories follow PLAN.md 5.4.2 and 5.4.3.

**Rules**

- Lists are **ordered from “most common / recognizable” to less common** (approximate popularity, US-biased).
- Each pool respects the **target pool size** from PLAN.md.
- Per-profile generation should:
  - Draw **subsets** from these pools.
  - Keep picks **consistent across the whole dataset** (same profile ⇒ same set of merchants).
- Do **not** invent new merchant names in code; add them here first if needed.

---

## 1. Subscriptions & Digital Services

### 1.1 Streaming (TV / Video) — pool size: 15

1. Netflix  
2. Amazon Prime Video  
3. Disney+  
4. Hulu  
5. Max (HBO / HBO Max)  
6. Peacock  
7. Paramount+  
8. Apple TV+  
9. YouTube TV  
10. YouTube Premium  
11. Sling TV  
12. Crunchyroll  
13. Philo  
14. Starz  
15. ESPN+

---

### 1.2 Music — pool size: 8

1. Spotify  
2. Apple Music  
3. YouTube Music  
4. Amazon Music  
5. Pandora  
6. SoundCloud Go+  
7. Tidal  
8. iHeartRadio Plus

---

### 1.3 Cloud Storage — pool size: 8

1. iCloud+  
2. Google Drive  
3. Dropbox  
4. Microsoft OneDrive  
5. Box  
6. Mega  
7. pCloud  
8. Amazon Photos / Drive

---

### 1.4 Gyms — pool size: 15

1. Planet Fitness  
2. LA Fitness  
3. 24 Hour Fitness  
4. Anytime Fitness  
5. Gold’s Gym  
6. Crunch Fitness  
7. YMCA  
8. Equinox  
9. Life Time Fitness  
10. Orangetheory Fitness  
11. F45 Training  
12. Snap Fitness  
13. Retro Fitness  
14. Blink Fitness  
15. UFC Gym

---

### 1.5 Software / Other Subscriptions — pool size: 20

1. Microsoft 365  
2. Adobe Creative Cloud  
3. Google Workspace  
4. Zoom Pro  
5. Slack Pro  
6. Notion Plus  
7. Evernote Premium  
8. 1Password  
9. LastPass Premium  
10. Duolingo Super  
11. Grammarly Premium  
12. Headspace  
13. Calm  
14. WeightWatchers Digital  
15. Noom  
16. New York Times Digital  
17. Wall Street Journal Digital  
18. GitHub Copilot  
19. ChatGPT Plus  
20. HelloFresh

---

## 2. Financial Institutions & Accounts

### 2.1 Banks — pool size: 20

1. JPMorgan Chase Bank  
2. Bank of America  
3. Wells Fargo Bank  
4. Citibank  
5. U.S. Bank  
6. PNC Bank  
7. Truist Bank  
8. Capital One Bank  
9. TD Bank  
10. Citizens Bank  
11. Fifth Third Bank  
12. KeyBank  
13. Ally Bank  
14. Navy Federal Credit Union  
15. Discover Bank  
16. Charles Schwab Bank  
17. Goldman Sachs Bank USA (Marcus)  
18. Huntington Bank  
19. Regions Bank  
20. BMO Harris Bank

*(Checking, savings, MMSA, and CDs reuse these bank names with different account labels.)*

---

### 2.2 Credit Card Issuers / Card Products — pool size: 20

At least 5 dedicated CC companies; rest are bank or store cards.

1. Chase Freedom Flex  
2. Chase Sapphire Preferred  
3. Chase Sapphire Reserve  
4. Bank of America Customized Cash Rewards  
5. Wells Fargo Active Cash  
6. Citi Double Cash  
7. Citi Premier Card  
8. Capital One Venture Rewards  
9. Capital One Quicksilver  
10. American Express Gold Card  
11. American Express Blue Cash Preferred  
12. American Express Platinum Card  
13. Discover it Cash Back  
14. Discover it Chrome  
15. Barclays Uber Visa  
16. Synchrony Amazon Store Card  
17. Target REDcard Credit  
18. Walmart Rewards Card  
19. Lowe’s Advantage Card  
20. Costco Anywhere Visa Card

---

### 2.3 Bank-Like / P2P Payment Services — flexible pool (no hard cap)

1. PayPal  
2. Cash App  
3. Venmo  
4. Apple Cash  
5. Google Pay  
6. Wise  
7. Western Union  
8. MoneyGram  
9. Remitly  
10. Chime

*(Zelle is intentionally excluded as a separate “account” per spec — it can appear only as transfer memo text.)*

---

### 2.4 Investment Companies / Brokerages — pool size: 6

1. Vanguard  
2. Fidelity Investments  
3. Charles Schwab  
4. Robinhood  
5. E*TRADE  
6. Merrill Edge

---

## 3. Loans, Rent, and Insurance

### 3.1 Loan Servicers — pool size: 20

1. Ally Financial  
2. Capital One Auto Finance  
3. Wells Fargo Auto  
4. Chase Auto Finance  
5. Santander Consumer USA  
6. Toyota Financial Services  
7. Honda Financial Services  
8. Ford Motor Credit  
9. GM Financial  
10. Navient  
11. Nelnet  
12. SoFi  
13. Discover Personal Loans  
14. Marcus by Goldman Sachs (Loans)  
15. Upstart  
16. LendingClub  
17. Rocket Mortgage (servicing)  
18. Freedom Mortgage  
19. Navy Federal Credit Union Loans  
20. OneMain Financial

---

### 3.2 Rent / Mortgage Providers — pool size: 15

1. Greystar Residential  
2. Camden Property Trust  
3. AvalonBay Communities  
4. Equity Residential  
5. Lincoln Property Company  
6. Invitation Homes  
7. Progress Residential  
8. Mid-America Apartment Communities (MAA)  
9. Essex Property Trust  
10. Rocket Mortgage  
11. Wells Fargo Home Mortgage  
12. Chase Home Lending  
13. Bank of America Home Loans  
14. Local Property Management Co.  
15. “Main Street Apartments” (generic complex name)

---

### 3.3 Utilities — pool size: 25

Mix of real Utilities + generic “City of …” handles.

1. Duke Energy  
2. Pacific Gas & Electric (PG&E)  
3. Southern Company  
4. Florida Power & Light  
5. Dominion Energy  
6. Con Edison  
7. National Grid  
8. Xcel Energy  
9. CenterPoint Energy  
10. Entergy  
11. FirstEnergy  
12. PPL Electric Utilities  
13. NV Energy  
14. Georgia Power  
15. Consumers Energy  
16. Reliant Energy  
17. City of [YourTown] Utilities  
18. City of [YourTown] Water & Sewer  
19. City of [YourTown] Gas  
20. County Electric Cooperative  
21. Municipal Electric Authority  
22. Spectrum Utilities (combined bill placeholder)  
23. “Utility Billing Services” (generic)  
24. “Regional Water Authority” (generic)  
25. “Regional Gas & Electric” (generic)

---

### 3.4 Phone Subscriptions — pool size: 10

1. Verizon Wireless  
2. AT&T Wireless  
3. T-Mobile  
4. Google Fi  
5. Xfinity Mobile  
6. Spectrum Mobile  
7. Cricket Wireless  
8. Boost Mobile  
9. Metro by T-Mobile  
10. Mint Mobile

---

### 3.5 Car Insurance — pool size: 10

1. State Farm  
2. GEICO  
3. Progressive  
4. Allstate  
5. USAA  
6. Farmers Insurance  
7. Nationwide  
8. Liberty Mutual  
9. Travelers Insurance  
10. AAA Insurance

---

### 3.6 Life Insurance — pool size: 5

1. New York Life  
2. Northwestern Mutual  
3. Prudential  
4. MetLife  
5. Lincoln Financial Group

---

### 3.7 Home Insurance — pool size: 5

1. State Farm  
2. Allstate  
3. Liberty Mutual  
4. Farmers Insurance  
5. USAA

---

### 3.8 Health Insurance — pool size: 5

1. UnitedHealthcare  
2. Anthem Blue Cross Blue Shield  
3. Cigna  
4. Aetna  
5. Kaiser Permanente

---

## 4. Everyday Spending & Commerce

### 4.1 Rideshare / Transport — pool size: 7

1. Uber  
2. Lyft  
3. Lime Scooters  
4. Bird Scooters  
5. Zipcar  
6. Turo  
7. Enterprise Rent-A-Car

---

### 4.2 Food Delivery — pool size: 15

1. DoorDash  
2. Uber Eats  
3. Grubhub  
4. Postmates  
5. Instacart  
6. Shipt  
7. Seamless  
8. Caviar  
9. Pizza Hut Delivery  
10. Domino’s Delivery  
11. Papa Johns Delivery  
12. Chick-fil-A Delivery  
13. Panera Bread Delivery  
14. Gopuff  
15. Amazon Fresh

---

### 4.3 Gas / Convenience Stores — pool size: 25

1. Shell  
2. Chevron  
3. BP  
4. Exxon  
5. Mobil  
6. Texaco  
7. Valero  
8. Speedway  
9. Circle K  
10. 7-Eleven  
11. Wawa  
12. QuikTrip  
13. Casey’s General Store  
14. Buc-ee’s  
15. Sunoco  
16. Marathon  
17. Phillips 66  
18. Citgo  
19. Cumberland Farms  
20. RaceTrac  
21. Raceway  
22. Sheetz  
23. Kwik Trip  
24. Love’s Travel Stops  
25. Pilot Flying J

---

### 4.4 Grocery Stores — pool size: 30

1. Walmart  
2. Kroger  
3. Costco  
4. Sam’s Club  
5. Target  
6. Aldi  
7. Publix  
8. Whole Foods Market  
9. Trader Joe’s  
10. Safeway  
11. Albertsons  
12. H-E-B  
13. Meijer  
14. WinCo Foods  
15. Food Lion  
16. Giant Food  
17. Giant Eagle  
18. Wegmans  
19. Hy-Vee  
20. Harris Teeter  
21. Fred Meyer  
22. Sprouts Farmers Market  
23. BJ’s Wholesale Club  
24. Ralphs  
25. Smith’s Food & Drug  
26. Vons  
27. Piggly Wiggly  
28. Ingles Markets  
29. King Soopers  
30. Fry’s Food Stores

---

### 4.5 Restaurants (Dine-In) — pool size: 25

1. Olive Garden  
2. Chili’s Grill & Bar  
3. Applebee’s  
4. Texas Roadhouse  
5. Outback Steakhouse  
6. LongHorn Steakhouse  
7. Red Lobster  
8. Cracker Barrel  
9. IHOP  
10. Denny’s  
11. The Cheesecake Factory  
12. Buffalo Wild Wings  
13. Red Robin  
14. TGI Fridays  
15. P.F. Chang’s  
16. Carrabba’s Italian Grill  
17. Bonefish Grill  
18. Logan’s Roadhouse  
19. Waffle House  
20. Perkins Restaurant & Bakery  
21. Ruby Tuesday  
22. BJ’s Restaurant & Brewhouse  
23. Golden Corral  
24. O’Charley’s  
25. Hooters

---

### 4.6 Fast Food — pool size: 30

1. McDonald’s  
2. Burger King  
3. Wendy’s  
4. Taco Bell  
5. KFC  
6. Popeyes  
7. Chick-fil-A  
8. Subway  
9. Domino’s Pizza  
10. Pizza Hut  
11. Little Caesars  
12. Papa Johns  
13. Sonic Drive-In  
14. Jack in the Box  
15. Dairy Queen  
16. Whataburger  
17. Culver’s  
18. Raising Cane’s  
19. Chipotle Mexican Grill  
20. Panera Bread  
21. Five Guys  
22. Jimmy John’s  
23. Jersey Mike’s Subs  
24. Checkers / Rally’s  
25. Hardee’s  
26. Carl’s Jr.  
27. Del Taco  
28. Wingstop  
29. Zaxby’s  
30. In-N-Out Burger

---

### 4.7 Other Food / Drink (Coffee, cafés) — pool size: 15

1. Starbucks  
2. Dunkin’  
3. Tim Hortons  
4. Peet’s Coffee  
5. Caribou Coffee  
6. Dutch Bros Coffee  
7. The Human Bean  
8. Biggby Coffee  
9. Scooter’s Coffee  
10. Blue Bottle Coffee  
11. Philz Coffee  
12. Joe & The Juice  
13. Krispy Kreme  
14. Local Cafe #1 (generic)  
15. Local Cafe #2 (generic)

---

### 4.8 Shopping Stores (Non-Food, In-Person) — pool size: 25

1. Walmart  
2. Target  
3. Best Buy  
4. Home Depot  
5. Lowe’s  
6. Menards  
7. IKEA  
8. Bed Bath & Beyond  
9. Kohl’s  
10. Macy’s  
11. JCPenney  
12. Nordstrom  
13. TJ Maxx  
14. Marshalls  
15. Ross Dress for Less  
16. Burlington  
17. Academy Sports + Outdoors  
18. Dick’s Sporting Goods  
19. REI  
20. Michaels  
21. Hobby Lobby  
22. Staples  
23. Office Depot / OfficeMax  
24. PetSmart  
25. Petco

---

### 4.9 Online Shopping — pool size: 20

1. Amazon  
2. Walmart.com  
3. Target.com  
4. eBay  
5. Etsy  
6. AliExpress  
7. Temu  
8. Shein  
9. StockX  
10. GOAT  
11. Wayfair  
12. Chewy  
13. Wish  
14. Zappos  
15. Generic “Shopify Store”  
16. TikTok Shop  
17. Fashion Nova  
18. ASOS  
19. Newegg  
20. B&H Photo Video

---

### 4.10 Unknown / Random / Other — pool size: 5

Used for noisy “other” or messy transactions.

1. Corner Street Vendor  
2. Local Gift Shop  
3. Downtown Market Stall  
4. Neighborhood Flea Market  
5. Pop-Up Shop

---

## 5. Assets (Portfolio Holdings)

### 5.1 Crypto Assets — pool size: 8

1. Bitcoin (BTC)  
2. Ethereum (ETH)  
3. Solana (SOL)  
4. Ripple (XRP)  
5. Binance Coin (BNB)  
6. Cardano (ADA)  
7. Dogecoin (DOGE)  
8. USD Coin (USDC)

---

### 5.2 Stocks / ETFs — pool size: 50

1. AAPL  
2. MSFT  
3. NVDA  
4. AMZN  
5. META  
6. GOOGL  
7. BRK.B  
8. TSLA  
9. AVGO  
10. JPM  
11. V  
12. JNJ  
13. UNH  
14. PG  
15. XOM  
16. LLY  
17. HD  
18. BAC  
19. COST  
20. WMT  
21. CRM  
22. ADBE  
23. NFLX  
24. PEP  
25. KO  
26. CSCO  
27. INTC  
28. AMD  
29. ORCL  
30. ABNB  
31. SPY  
32. QQQ  
33. IWM  
34. VTI  
35. VOO  
36. SMH  
37. XLK  
38. XLE  
39. XLF  
40. ARKK  
41. NKE  
42. MCD  
43. DIS  
44. T  
45. VZ  
46. PYPL  
47. SQ  
48. SHOP  
49. MRNA  
50. PFE

---

## 6. Notes for Implementers

- PLAN.md §5.4.2 “Target Counts” are **per-profile distinct counts** drawn from these pools.
- PLAN.md §5.4.3 “Pool Size” is the **max universe per category** defined here.
- When extending date ranges, keep the **same LifestyleProfile + merchant picks**; do **not** re-draw from the pool.
- If you ever need a new merchant:
  - Add it here with correct category and keep ordering by approximate popularity.
  - Then use it from the generator — do **not** inline strings in code.
