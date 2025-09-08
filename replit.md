# Overview

This is a full-stack chess application built with React and Express, featuring AI-powered gameplay and position analysis. The application allows users to play chess against an AI opponent powered by Google's Gemini AI, analyze positions, and manage game history. It includes a modern chess board interface with piece movement, legal move highlighting, and comprehensive game state management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS custom properties for theming, using a warm color palette with neutral tones
- **State Management**: 
  - React hooks for local component state
  - TanStack Query for server state management and API caching
  - Custom chess engine hook (`useChess`) for game state management
- **Routing**: Wouter for lightweight client-side routing
- **Chess Logic**: chess.js library for move validation, game rules, and board state management

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints for chess AI moves, position analysis, and game management
- **Development Server**: Vite integration for hot module replacement in development mode
- **Error Handling**: Centralized error middleware with structured error responses

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: 
  - Users table for player management with rating system
  - Games table for storing PGN notation and game results
  - Game analysis table for storing AI evaluations and best moves
- **Development Storage**: In-memory storage implementation for development/testing
- **Migration System**: Drizzle Kit for database schema migrations

## Authentication and Authorization
- Session-based authentication (indicated by connect-pg-simple dependency)
- User management with username/password system
- Rating system for player skill tracking

## Chess Engine Integration
- **AI Provider**: Google Gemini AI (gemini-2.5-pro model) for move generation and position analysis
- **Chess Logic**: chess.js for game state validation and move legality
- **Fallback System**: Local AI move generation when external AI fails
- **Analysis Features**: 
  - Position evaluation in centipawns
  - Best move suggestions
  - Strategic position analysis
  - Move history tracking

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18+ with TypeScript, Vite for build tooling
- **UI Framework**: shadcn/ui with Radix UI primitives for component foundation
- **Styling**: Tailwind CSS with PostCSS for processing

### Chess-Specific Dependencies
- **chess.js**: Chess game logic, move validation, and FEN/PGN handling
- **Chess AI**: Google Gemini AI via @google/genai SDK

### Database and ORM
- **Database**: PostgreSQL via @neondatabase/serverless for cloud database connectivity
- **ORM**: Drizzle ORM with drizzle-kit for migrations and schema management
- **Session Storage**: connect-pg-simple for PostgreSQL session storage

### API and State Management
- **HTTP Client**: Fetch API with custom wrapper for API requests
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod resolver for validation

### Development Tools
- **Build Tool**: Vite with React plugin and TypeScript support
- **Replit Integration**: Replit-specific plugins for development environment
- **Error Handling**: Runtime error overlay for development debugging

### Utility Libraries
- **Date Handling**: date-fns for date manipulation and formatting
- **Styling Utilities**: clsx and class-variance-authority for conditional styling
- **Icons**: Lucide React for consistent iconography