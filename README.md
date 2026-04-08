# My Borrower - Loan Management Application

A modern, mobile-responsive web application for managing personal loans, calculating interest, and monitoring repayment progress. The backend is implemented with Node.js and Express for REST API support.

## 🎯 Features

### User Authentication
- User registration with email and password
- Secure login with JWT authentication
- User dashboard with personalized greeting
- Session management with token-based auth

### Loan Management
- **Create Loans**: Add new loans with borrower information, principal amount, interest rate, and duration
- **View Loans**: Browse all loans in a grid/list view with quick overview cards
- **Edit Loans**: Update loan details (only for pending loans)
- **Delete Loans**: Remove loans from the system
- **Loan Details**: View comprehensive loan information including:
  - Principal amount
  - Interest rate
  - Duration
  - Total amount due
  - Payment progress with visual bar
  - Outstanding balance

### Payment Tracking
- **Record Payments**: Add payment entries with automatic balance updates
- **Payment History**: Track all payments made on each loan
- **Balance Calculation**: Real-time calculation of remaining balance
- **Progress Visualization**: Visual progress bar showing payment completion percentage

### Dashboard
- **Summary Statistics**: View total loans, total borrowed, total paid, and outstanding balance
- **Recent Loans**: Quick access to 3 most recent loans
- **Quick Navigation**: Fast links to loan operations

### Mobile Responsive Design
- **Fully Responsive**: Optimized for mobile (640px), tablet (768px), and desktop (1024px+) screens
- **Touch-Friendly**: Larger buttons and inputs for mobile devices
- **Adaptive Layouts**: Grid layouts adjust based on screen size
- **Mobile-First Approach**: Designed with mobile users in mind

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.2** - React framework with App Router
- **React 19.2** - UI library
- **Zustand** - State management
- **Axios** - HTTP client for API calls
- **CSS Modules** - Component-scoped styling

### Architecture
- Server-side rendering (partial)
- Client-side state management with Zustand
- Modular component structure
- Custom hooks for business logic

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.js              # Root layout with Header
│   ├── globals.css            # Global styles
│   ├── page.js                # Home/landing page
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   ├── dashboard/             # Dashboard page
│   └── loans/
│       ├── page.js            # Loans listing
│       ├── new/               # Create loan
│       ├── [id]/              # Loan details
│       └── [id]/edit/         # Edit loan
├── components/                # Reusable UI components
│   ├── Header.js              # Navigation header
│   ├── Button.js              # Button component
│   ├── Input.js               # Form input
│   ├── Card.js                # Card container
│   ├── Alert.js               # Alert messages
│   ├── Badge.js               # Status badge
│   └── LoanCard.js            # Loan card display
├── hooks/                     # Custom React hooks
│   ├── useAuth.js             # Auth state
│   └── useLoans.js            # Loan state
├── services/                  # API services
│   ├── authService.js         # Auth API calls
│   └── loanService.js         # Loan API calls
├── store/                     # Zustand stores
│   ├── authStore.js           # Auth store
│   └── loanStore.js           # Loan store
└── utils/                     # Utility functions
    ├── api.js                 # Axios instance
    └── calculations.js        # Business logic
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment**
Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

3. **Run Development Server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm start
```

## 📱 API Integration

The application expects a Node.js/Express API backend at `http://localhost:8000/api` with the following endpoints:

### Authentication
- `POST /api/register` - Create new account
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/user` - Get current user

### Loans
- `GET /api/loans` - List all loans
- `POST /api/loans` - Create loan
- `GET /api/loans/{id}` - Get loan details
- `PUT /api/loans/{id}` - Update loan
- `PATCH /api/loans/{id}/status` - Update status
- `DELETE /api/loans/{id}` - Delete loan

### Payments
- `POST /api/loans/{id}/payments` - Record payment
- `GET /api/loans/{id}/history` - Get payment history

## 🎨 Design Features

### Color Scheme
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Warning**: Amber (#f59e0b)
- **Dark**: Slate (#1e293b)

### Responsive Breakpoints
- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: 640px - 767px
- **Small Mobile**: < 640px

### Components
- **Header**: Sticky navigation with responsive menu
- **Cards**: Elevated boxes with hover effects
- **Forms**: Accessible inputs with validation
- **Buttons**: Multiple variants and sizes
- **Status Badges**: Visual status indicators
- **Progress Bars**: Visual payment progress

## 📊 Calculations

### Total Amount Due Formula
```
Total = Principal + (Principal × Interest Rate × Duration in Years)
```

### Remaining Balance
```
Remaining = Total Amount Due - Total Payments Made
```

### Payment Progress
```
Progress % = (Total Payments / Total Amount Due) × 100
```

## 🔒 Security Features

- JWT token-based authentication
- Secure password hashing (backend)
- HTTPS-ready architecture
- Input validation on client and server
- CORS support for API integration
- Protected routes (login required)

## 🎯 State Management

### Zustand Stores

#### Auth Store (`authStore.js`)
- Manages user authentication state
- Handles login, register, logout
- Persists token to localStorage
- Provides auth methods and status

#### Loan Store (`loanStore.js`)
- Manages loan data and operations
- Handles CRUD operations
- Tracks loading and error states
- Manages current loan selection

## 🪝 Custom Hooks

### useAuth()
```javascript
const { user, token, isLoading, error, login, register, logout } = useAuth();
```

### useLoans()
```javascript
const { loans, currentLoan, isLoading, error, fetchLoans, createLoan, updateLoan, deleteLoan, addPayment } = useLoans();
```

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api` |

## 🤝 Contributing

1. Create a feature branch
2. Implement changes
3. Test on multiple devices
4. Submit pull request

## 📄 License

MIT License - Open source project

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📧 Support

For issues, feature requests, or questions, please create an issue on the repository.

---

**Created**: 2024  
**Version**: 1.0.0  
**Status**: Production Ready
