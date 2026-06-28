# RoomConnect Product Requirements Document (PRD)

## Overview

RoomConnect is a web platform that connects property owners with room seekers in Nepal's urban rental market. Owners can post listings for rooms or houses, while seekers can browse, filter, save, and message owners. The product aims to replace informal, unreliable channels with a structured, trustworthy marketplace.

## Goals

- Reduce time and effort to find or fill rental rooms.
- Increase transparency through detailed listings and verified accounts.
- Provide a centralized, role-based platform for owners, seekers, and admins.

## Success Metrics

- Time-to-first-message per listing.
- Listings created per owner per month.
- Search-to-message conversion rate.
- Saved listings per active seeker.
- Active listings occupancy rate (owner-reported).

## Target Users

- Room Seekers: students, professionals, migrants seeking rentals in urban areas.
- Property Owners: owners posting vacant rooms or houses.
- Administrators: manage platform data and users.

## Key User Journeys

1. Seeker browses listings, filters by location and price, saves listings, and sends message.
2. Owner creates a listing, uploads photos, and responds to messages from seekers.
3. Admin reviews listings and user activity.

## Scope

### In Scope

- User registration and login with email/password and email verification (no social login).
- Role-based access: owner, seeker.
- Listing management for owners: create, update, hide, delete.
- Listing discovery for seekers: browse, search, filter, view details.
- Saved listings (favorites) for seekers.
- Messaging between seeker and owner for a listing.
- Local media storage for listing images.
- Admin dashboard for managing users, listings, categories, and locations.
- User reviews and ratings.

### Out of Scope

- Payments and booking transactions.
- Real-time audio/video calls.
- Native Android or iOS apps.

## Functional Requirements

### Authentication and Accounts

- Support email/password login and email verification.
- Profiles for owners and seekers with basic contact info.
- Role-based access control for owner and seeker actions.

### Listings (Owner)

- Create listings with title, description, price, room specs, location, amenities, and photos.
- Edit, hide, or delete listings.
- Mark listings as available/unavailable.

### Discovery (Seeker)

- Browse all available listings.
- Search and filter by location hierarchy (province, district, locality), price, room type/category, size, and availability.
- View listing details with photos and owner contact options.
- Save listings to a personal list.

### Messaging

- Seeker can message an owner from a listing.
- Owner can respond and continue the conversation.
- A single thread per seeker per listing.

## Non-Functional Requirements

- Security: password hashing and email verification.
- Privacy: protect user contact details; share only after messaging intent.
- Performance: listing search results within 2 seconds for typical queries.
- Accessibility: UI meets WCAG AA where feasible.

## Simplicity Guidelines

- Avoid advanced features and frameworks; keep the stack minimal and approachable.
- Favor straightforward, readable code over abstraction or clever patterns.
- Ship basic functionality first; add complexity only when clearly required.
- Keep UI components simple, consistent, and easy to maintain.

## Data Model Alignment

The PRD aligns with the existing database schema:

- users: roles (admin, owner, seeker), verification, contact.
- categories, provinces, districts, localities: admin-managed reference data.
- listings: core listing data, availability, location, specs.
- listing_media: images stored locally with file paths.
- saved_listings: seeker favorites.
- inquiries, inquiry_messages: message threads and messages.
- user_reviews.

## UX and UI Direction

- Style: clean, trustworthy marketplace with a light, airy layout.
- Palette (Sand + Slate): warm ivory background, sand cards, slate text, deep green accent.
- Typography: humanist sans (Source Sans 3 or Work Sans).
- Layout: strong search bar + filters, listing cards with key metadata, clear "Message" CTAs.
- Mobile: filter drawer, stacked cards, persistent "Message" button on detail page.

## Architecture

- Separate folders for codebases:
  - frontend/ (React + Bootstrap with custom theme variables)
  - backend/ (FastAPI + MySQL)
- REST API surface for auth, listings, search, saved listings, and messaging.
- Local file storage for listing images with paths stored in listing_media.

## Risks and Assumptions

- Assumption: users have stable email access for verification.
- Risk: incomplete or inaccurate listings reduce trust.
- Risk: local media storage needs backup and scaling strategy as usage grows.
- Assumption: admin-managed location data is maintained and current.

