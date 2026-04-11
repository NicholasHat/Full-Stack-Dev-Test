# Field Estimate Tool

## The Problem

Our HVAC technicians are losing time on every service call.

Right now, when a tech gets to a job site and needs to give the customer an estimate, here's what happens: they flip through a product binder or scroll through a spreadsheet on their phone, look up equipment costs, try to remember the labor rates for different job types, factor in the specifics of the property, and then scribble numbers on a notepad or punch them into a calculator. Sometimes they call the office to double-check pricing. Sometimes they guess and adjust later.

The customer is standing there the whole time.

A simple repair estimate might take 10-15 minutes. A full system replacement quote can take 30-45 minutes on-site, and that's before the tech has to go back to their truck to write it up in a way the customer can actually read. Some techs text a photo of their handwritten notes to the office and have someone there type it up. Others just wing it and send a "real" estimate later that evening.

We've got about 40 technicians in the field. If each one does 4-6 estimates a day, that's a lot of wasted time — and a lot of customers standing around waiting. We've heard from customers that the wait makes the whole experience feel less professional, and we've definitely lost jobs because a competitor got a clean estimate out faster.

## What We Have

In the `data/` folder, you'll find some of the information our techs work with:

- **equipment.json** — Our catalog of HVAC equipment and parts with pricing
- **labor_rates.json** — What we charge for different types of work
- **customers.json** — A sample of customer and property records

This is real-ish data pulled from our systems. It's not perfect — some of it was exported from different tools at different times, so it might not all look the same.

## What We're Asking

Build something that helps.

Fork this repo, build your solution, and include a short write-up explaining your approach — what you built, why you made the choices you did, and what you'd do differently with more time.

# HVAC Estimator Demo Plan

## Repo Structure

- apps/mobile
    Expo + Reach Native + TypeScript
- apps.api
    FastAPI + Python
- data 
    Original JSON data + bundles (common repair templates)

### Backend Foundation
- FastAPI + Pydantic + SQLite
- Endpoints:
    GET /health
    GET /catalog/equipment
    GET /catalog/labor-rates
    GET /catalog/bundles
- CORS
- Normalize source inconsistences when loading JSON (base_cost and baseCost)

## SQLite Storage Tables

- customers
- estimates 
    includes: 
        **IDS**: estimate ID, jobID, customerID
        **Lifecycle**: status, version, createdAt, updatedAt
        **JSON contents**: labor, equipmentLines, adjustments, totals
        **Special Notes**
- job 
    includes job estimate(s) and customer + who/where/when/status

## CRUD endpoints

- Customers:
    POST /customers
    GET /customers?query=
    GET /customers/{id}
    PATCH /customers/{id}
- Jobs:
    POST /jobs
    GET /jobs?customerID=
    GET /jobs/{id}
    PATCH /estimates/{id}

## Determine Pricing

- Server computes all totals but technician finalizes and confirms everything

Labor: hours chosen (midpoint of min and max)
Equipment: baseCost + ?
Adjustments: rush service, extra hours, permits?
Endpoint: reprice

## Mobile Demo

- Expo + TypeScript + React Navigation + React Native Paper
- React Hook Form + Zod
- expo-sqlite for local draft/offline cache
- **Screens**
    customer list/create/edit
    job list/create/edit
    estimate builder/review
- **Estimate builder**
    pick labor from catalog
    pick hours in
    add/search equipment
    special notes
    call reprice and show totals

## Bundles
- bundle picker from bundles.json
- applying a bundle will fill labor, equipment lines, and notes template but allow revision

## Finalization + PDF

- POST /estimates/{id}/finalize
- GET /estimates/{id}/pdf
Mobile share through expo-sharing

## AI integration (Gemini 2.5 Flash)

- POST /ai/voice-to-draft
    audio upload --> transcript --> to fill in JSONs
- POST /ai/notes-image-to-draft
    image upload --> to fill in JSONS
- Validate AI output with Pydantic; retry on invalid output
- AI never computes totals



