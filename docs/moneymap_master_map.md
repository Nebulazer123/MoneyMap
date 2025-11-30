# MoneyMap Master Map

## 1. Purpose

This file is the entry point for MoneyMap.  
Any new chat or tool that works on this project should read this file first before touching code or changing plans.

It explains  
* what MoneyMap is trying to do  
* how data and privacy work  
* how the repo is structured  
* how ChatGPT and Codex should behave

If another document disagrees with this one, this master map wins unless you explicitly decide to update it.

## 2. Quick picture of the product

MoneyMap is a browser based demo that shows people a clear picture of where their money goes using only fake statement data.

* Audience  
  * Normal people who feel stressed by money and do not track every dollar  
  * Curious employers or friends who want to see the concept

* Promise  
  * No real account links  
  * No uploads  
  * No storage of personal bank data in this phase

* Main flow for a user  
  1. Land on a calm dark themed home page and see that this is a demo with sample data only  
  2. Generate a messy fake bank statement for a chosen month and year  
  3. Press Analyze to see a dashboard that separates spending, income, transfers, subscriptions, and fees  
  4. Explore tabs and edit the statement to see how changes affect the result

## 3. Tech stack and repo basics

* Stack  
  * Next js app router  
  * React with TypeScript  
  * Tailwind for styling  
  * Node and npm for local dev

* Repo layout high level  
  * `src/app` contains route folders such as `page.tsx` for each route  
  * `src/app/dashboard` is the main demo dashboard page  
  * `src/lib` contains fake data and analytics helpers  
  * `docs` contains all project docs including this master map

You run the app with

```bash
npm install
npm run dev
