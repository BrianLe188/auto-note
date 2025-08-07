# Overview

TranscribeAI is a meeting automation platform that provides audio transcription and action item extraction services. The application uses AI-powered transcription through OpenAI's Whisper API to convert meeting recordings into text and then automatically extracts actionable items from the transcripts. It features A/B testing capabilities to compare different transcription models and prompts for optimization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture

- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured error handling and request logging middleware
- **File Handling**: Multer for multipart file uploads with validation for audio file types (MP3, MP4, WAV, M4A)
- **Development Setup**: Vite integration for hot module replacement in development mode

## Data Storage Solutions

- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless driver for PostgreSQL connectivity
- **Fallback Storage**: In-memory storage implementation for development/testing scenarios

## Database Schema Design

- **Meetings Table**: Stores meeting metadata, file information, transcription status, and A/B test group assignments
- **Action Items Table**: Stores extracted action items with assignee, priority, due date, and completion status
- **A/B Tests Table**: Defines different transcription models and prompts for testing
- **Test Results Table**: Tracks performance metrics like accuracy rates and processing times for each test variant

## Export Functionality

- **Export API Endpoints**: Comprehensive file export system with multiple format options (CSV, JSON, TXT)
- **Meetings Export**: `/api/export/meetings` with filtering by status and date range
- **Action Items Export**: `/api/export/action-items` with filtering by priority and completion status
- **Individual Meeting Export**: `/api/export/meeting/:id` for complete meeting transcripts with action items
- **Format Support**: CSV for data analysis, JSON for data interchange, TXT for readable transcripts
- **Authentication**: Optional authentication with JWT token support for secure exports
- **Client Integration**: Export utility functions with automatic file downloads and user notifications

## External Dependencies

### AI Services

- **OpenAI API**: Whisper model for audio transcription and GPT models for action item extraction
- **Model Variants**: Support for different OpenAI models (gpt-4o, gpt-4o-mini) for A/B testing scenarios

### Development Tools

- **Build System**: Vite with React plugin and custom error overlay for development
- **Code Quality**: TypeScript for static typing with strict configuration
- **Styling**: PostCSS with Tailwind CSS and Autoprefixer for cross-browser compatibility

### Infrastructure

- **Session Management**: Connect-pg-simple for PostgreSQL-based session storage
- **File Upload**: Temporary file storage in uploads directory with configurable size limits
- **Environment Configuration**: Environment variable-based configuration for database URLs and API keys

## A/B Testing Framework

The application implements a comprehensive A/B testing system that allows comparison of different transcription approaches:

- **Test Variants**: Support for multiple models (default, enhanced, speed) with different prompts
- **Metrics Tracking**: Accuracy rates, processing times, and action item extraction counts
- **Random Assignment**: Automatic assignment of meetings to test groups for unbiased results

