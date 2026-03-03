export const testData = {
  users: {
    investor: {
      _id: 'investor-123',
      phoneNumber: '+1234567890',
      email: 'investor@example.com',
      name: 'John Investor',
      role: 'investor',
      verified: true,
      preferences: {
        maxPrice: 500000,
        minBedrooms: 3,
        locations: ['Miami', 'NYC'],
      },
    },
    agent: {
      _id: 'agent-123',
      phoneNumber: '+1234567891',
      email: 'agent@example.com',
      name: 'Jane Agent',
      role: 'agent',
      licenseNumber: 'FL-123456',
      verified: true,
      rating: 4.8,
    },
    admin: {
      _id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      permissions: ['manage_users', 'manage_properties', 'view_analytics'],
    },
  },

  properties: [
    {
      _id: 'prop-1',
      title: 'Luxury Beachfront Penthouse',
      description: 'Stunning 5-bedroom penthouse with ocean views',
      price: 1500000,
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 5000,
      location: {
        address: '123 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        country: 'USA',
        coordinates: {
          lat: 25.8102,
          lng: -80.1267,
        },
      },
      amenities: ['pool', 'gym', 'parking', 'concierge', 'security'],
      images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
      agentId: 'agent-123',
      status: 'active',
    },
    {
      _id: 'prop-2',
      title: 'Modern Downtown Condo',
      description: '3-bedroom condo in the heart of downtown',
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2000,
      location: {
        address: '456 Main Street',
        city: 'Miami',
        state: 'FL',
        country: 'USA',
        coordinates: {
          lat: 25.7617,
          lng: -80.1918,
        },
      },
      amenities: ['gym', 'parking', 'rooftop'],
      images: ['image1.jpg', 'image2.jpg'],
      agentId: 'agent-123',
      status: 'active',
    },
    {
      _id: 'prop-3',
      title: 'Charming Residential Home',
      description: '4-bedroom house in quiet neighborhood',
      price: 650000,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 3500,
      location: {
        address: '789 Elm Street',
        city: 'Miami',
        state: 'FL',
        country: 'USA',
        coordinates: {
          lat: 25.7949,
          lng: -80.2107,
        },
      },
      amenities: ['garage', 'patio', 'garden'],
      images: ['image1.jpg', 'image2.jpg'],
      agentId: 'agent-123',
      status: 'active',
    },
  ],

  bookings: [
    {
      _id: 'booking-1',
      propertyId: 'prop-1',
      investorId: 'investor-123',
      agentId: 'agent-123',
      scheduledTime: new Date(Date.now() + 86400000 * 3),
      duration: 60,
      status: 'confirmed',
      notes: 'Interested in viewing',
      createdAt: new Date(),
    },
    {
      _id: 'booking-2',
      propertyId: 'prop-2',
      investorId: 'investor-123',
      agentId: 'agent-123',
      scheduledTime: new Date(Date.now() + 86400000 * 7),
      duration: 45,
      status: 'pending',
      createdAt: new Date(),
    },
  ],

  messages: [
    {
      _id: 'msg-1',
      conversationId: 'conv-1',
      phoneNumber: '+1234567890',
      content: 'Hello, I am looking for a 3-bedroom property',
      type: 'incoming',
      timestamp: new Date(Date.now() - 3600000),
      processed: true,
      metadata: { source: 'whatsapp' },
    },
    {
      _id: 'msg-2',
      conversationId: 'conv-1',
      phoneNumber: 'bot',
      content: 'Hello! I found 5 properties matching your criteria',
      type: 'outgoing',
      timestamp: new Date(Date.now() - 1800000),
      processed: true,
      metadata: { source: 'bot' },
    },
  ],

  payments: [
    {
      _id: 'payment-1',
      bookingId: 'booking-1',
      amount: 5000,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'credit_card',
      transactionId: 'txn-12345',
      createdAt: new Date(),
    },
    {
      _id: 'payment-2',
      bookingId: 'booking-2',
      amount: 3000,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'bank_transfer',
      createdAt: new Date(),
    },
  ],

  credentials: {
    validLogin: {
      email: 'investor@example.com',
      password: 'SecurePassword123!',
    },
    validAgent: {
      email: 'agent@example.com',
      password: 'AgentPassword123!',
    },
    invalidLogin: {
      email: 'wrong@example.com',
      password: 'WrongPassword123!',
    },
  },

  phoneNumbers: {
    valid: [
      '+1234567890',
      '+919876543210',
      '+441234567890',
      '+33123456789',
    ],
    invalid: [
      '123', // too short
      'not-a-phone', // invalid format
      '+1234', // too short
    ],
  },

  searchQueries: [
    {
      query: 'Miami 3 bedroom',
      expectedResults: ['prop-2', 'prop-3'],
    },
    {
      query: 'luxury penthouse',
      expectedResults: ['prop-1'],
    },
    {
      query: 'under 500000',
      expectedResults: ['prop-2'],
    },
  ],

  conversationScenarios: [
    {
      name: 'Simple property search',
      messages: [
        'I am looking for properties in Miami',
        'I have a budget of $500,000',
        'I need at least 3 bedrooms',
      ],
    },
    {
      name: 'Booking inquiry with negotiation',
      messages: [
        'Is this property still available?',
        'Can we discuss the price?',
        'When can I schedule a viewing?',
      ],
    },
    {
      name: 'Follow-up after viewing',
      messages: [
        'I viewed the property yesterday',
        'Can you send me the documents?',
        'How do we proceed with the offer?',
      ],
    },
  ],

  performanceTargets: {
    appStartup: 2000, // ms
    apiResponse: 1000, // ms
    searchResponse: 500, // ms
    messageProcessing: 100, // ms
  },

  regressionScenarios: [
    {
      name: 'Property image upload failure',
      setup: 'Create property with invalid images',
      expectedBehavior: 'Should show error and allow retry',
    },
    {
      name: 'Payment processing timeout',
      setup: 'Initiate payment with slow network',
      expectedBehavior: 'Should show timeout message and option to retry',
    },
    {
      name: 'Message delivery failure',
      setup: 'Send message when service is unavailable',
      expectedBehavior: 'Should queue message and retry',
    },
  ],
};

export const generateTestUser = (overrides: any = {}) => ({
  ...testData.users.investor,
  ...overrides,
});

export const generateTestProperty = (overrides: any = {}) => ({
  ...testData.properties[0],
  ...overrides,
});

export const generateTestBooking = (overrides: any = {}) => ({
  ...testData.bookings[0],
  ...overrides,
});
