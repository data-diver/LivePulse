# Overview

This is a real-time Q&A application built for AI learning events. The system allows participants to submit questions via a mobile interface, while moderators can review and approve questions through an admin panel. Approved questions are displayed on a main presentation screen with live voting capabilities. The application features real-time updates using WebSockets, ensuring all participants see live question submissions, approvals, and like counts.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and building
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with WebSocket support for real-time features
- **Storage**: In-memory storage with interface for future database integration
- **Session Management**: Express session middleware with PostgreSQL session store

## Data Storage Solutions
- **Current**: In-memory storage using Map data structure
- **Configured**: Drizzle ORM with PostgreSQL (Neon Database) ready for production
- **Schema**: Questions table with fields for content, author, status, likes, and timestamps
- **Validation**: Zod schemas for type-safe data validation

## Authentication and Authorization
- **Current**: No authentication implemented (suitable for event use case)
- **Session Infrastructure**: Ready for future authentication with express-session
- **Access Control**: Admin routes accessible without authentication for simplicity

## Real-time Communication
- **Technology**: WebSocket server using 'ws' library
- **Architecture**: Single WebSocket endpoint (`/ws`) broadcasting to all connected clients
- **Events**: Question submissions, status updates, and like increments trigger real-time updates
- **Client Management**: Automatic connection/disconnection handling with client count tracking

## API Design
- **RESTful Endpoints**: 
  - GET `/api/questions` - All questions
  - GET `/api/questions/approved` - Public approved questions
  - GET `/api/questions/pending` - Admin pending questions
  - POST `/api/questions` - Submit new question
  - PATCH `/api/questions/:id/status` - Update question status
  - POST `/api/questions/:id/like` - Like a question
  - GET `/api/stats` - System statistics

## Build and Development
- **Development**: Vite dev server with HMR and TSX runtime
- **Production Build**: Vite for client, esbuild for server bundling
- **Type Safety**: Shared TypeScript types between client and server
- **Database Migrations**: Drizzle Kit for schema management

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service configured via `@neondatabase/serverless`
- **Connection**: Environment variable `DATABASE_URL` for database connection

## UI and Component Libraries
- **Radix UI**: Headless UI components for accessibility and behavior
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library built on Radix UI

## Development and Build Tools
- **Vite**: Frontend build tool and development server
- **esbuild**: Fast JavaScript bundler for server-side code
- **TypeScript**: Type checking and compilation
- **Drizzle Kit**: Database schema management and migrations

## Real-time Communication
- **ws**: WebSocket library for real-time bidirectional communication
- **TanStack Query**: Client-side data fetching with real-time invalidation

## Form and Validation
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: Integration between React Hook Form and Zod

## Deployment and Hosting
- **Replit**: Development environment with integrated deployment
- **Node.js**: Server runtime environment
- **Express.js**: Web application framework for API and static file serving