# Store Management System - LAROZA

## Overview

This is a full-stack web application for LAROZA (لاروزا), an internal store management system designed for Arabic-speaking employees. The system provides comprehensive inventory management, sales tracking, returns processing, and accounting features specifically tailored for a fashion retail business.

The application follows a modern web architecture with React frontend, Express.js backend, and PostgreSQL database, utilizing TypeScript throughout for type safety and better development experience. The UI is designed with RTL (right-to-left) support and Arabic localization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: Shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with RTL support and Arabic color scheme (primary: burgundy, accent: emerald green)
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Layout**: Responsive design with sidebar navigation optimized for Arabic interface

### Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **Language**: TypeScript with strict type checking
- **API Design**: RESTful endpoints following REST conventions
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Development**: Hot reloading with Vite integration for seamless full-stack development
- **Logging**: Custom request logging middleware for API monitoring

### Database Architecture
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Migration Strategy**: Drizzle Kit for schema migrations and database management
- **Schema Design**: Normalized relational structure with proper foreign key relationships
- **Key Tables**:
  - Products: Core product information with unique model numbers
  - Product Inventory: Multi-dimensional inventory (color × size × quantity matrix)
  - Sales: Transaction records with channel-specific payment methods
  - Sale Items: Line items linking products to sales with pricing
  - Returns: Return transactions with refund/exchange tracking
  - Return Items: Individual returned items for inventory restoration

### Business Logic Architecture
- **Inventory Management**: Multi-color/multi-size product variants with real-time stock tracking
- **Sales Processing**: Dual-channel sales (in-store vs online) with payment method-specific fee calculations
- **Returns System**: Intelligent inventory restoration with accounting adjustments for refunds vs exchanges
- **Status Calculation**: Dynamic product status based on inventory levels (in-stock/low-stock/out-of-stock)

### Component Architecture
- **Modular Design**: Feature-based component organization (products, sales, returns, layout)
- **Reusable Components**: Shared UI components from Shadcn/ui library
- **Form Components**: Specialized form components for complex inventory management
- **Modal System**: Dialog-based forms for data entry operations

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with hooks and modern patterns
- **Express.js**: Backend web framework for Node.js
- **TypeScript**: Static type checking for both frontend and backend
- **Vite**: Frontend build tool and development server

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with RTL support
- **Radix UI**: Headless UI components for accessibility
- **Shadcn/ui**: Pre-built component library with consistent design
- **Lucide React**: Icon library for modern interface icons

### Database and Data Management
- **PostgreSQL**: Primary database (configured for Neon Database)
- **Drizzle ORM**: Type-safe ORM with automatic migrations
- **TanStack Query**: Server state management and caching
- **Zod**: Runtime type validation for API contracts

### Development Tools
- **ESBuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Autoprefixer
- **React Hook Form**: Performance-optimized form library
- **Date-fns**: Date manipulation and formatting utilities

### Hosting and Deployment
- **Replit Environment**: Development and hosting platform
- **Neon Database**: Serverless PostgreSQL hosting
- **Node.js Runtime**: Server-side JavaScript execution