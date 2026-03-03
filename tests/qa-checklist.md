# PuraEstate QA Checklist

## Manual Testing Scenarios

### Authentication & Authorization
- [ ] User can sign up with valid email
- [ ] User cannot sign up with existing email
- [ ] User can login with correct credentials
- [ ] User cannot login with incorrect password
- [ ] User receives password reset email
- [ ] User can reset password via email link
- [ ] Session persists after app restart
- [ ] User can logout successfully
- [ ] Unauthorized users cannot access admin panel
- [ ] Agents cannot access investor-only features

### Property Management (Agent)
- [ ] Agent can add new property with all details
- [ ] Agent can upload multiple property images
- [ ] Agent can edit property details
- [ ] Agent can delete property (if no bookings)
- [ ] Property appears in search results
- [ ] Agent can manage property status (active/inactive)
- [ ] Agent can view all their properties
- [ ] Agent can filter properties by status
- [ ] Agent can search properties by location
- [ ] Property images load correctly on listing

### Property Search (Investor)
- [ ] Investor can view property listings
- [ ] Investor can search by location
- [ ] Investor can filter by price range
- [ ] Investor can filter by bedrooms/bathrooms
- [ ] Investor can filter by amenities
- [ ] Search results display correctly
- [ ] Search results are paginated
- [ ] Investor can sort results (price, newest, popularity)
- [ ] Investor can view property details
- [ ] Property gallery shows all images

### Booking Management
- [ ] Investor can schedule property viewing
- [ ] Booking shows in investor's calendar
- [ ] Booking shows in agent's schedule
- [ ] Agent receives booking notification
- [ ] Investor receives booking confirmation
- [ ] Investor can view booking details
- [ ] Investor can cancel booking (before scheduled time)
- [ ] Agent can reschedule booking
- [ ] Agent can confirm/reject pending booking
- [ ] Cancelled bookings are removed from calendar

### Payment Processing
- [ ] Investor can initiate payment for booking
- [ ] Payment processing shows loading state
- [ ] Failed payment shows error message
- [ ] Successful payment shows confirmation
- [ ] Payment receipt is generated
- [ ] Payment receipt is emailable
- [ ] Refund can be processed (admin)
- [ ] Payment history is accessible
- [ ] Multiple payments can be made
- [ ] Payment validation shows errors

### WhatsApp Integration
- [ ] User receives WhatsApp message notifications
- [ ] User can reply to WhatsApp messages
- [ ] Property suggestions are sent via WhatsApp
- [ ] Booking confirmations are sent via WhatsApp
- [ ] Messages are logged in conversation history
- [ ] Agent can respond to WhatsApp inquiries
- [ ] Attachments (images) are sent correctly
- [ ] Message delivery status is tracked
- [ ] Conversation history is searchable
- [ ] Blocked numbers are handled correctly

### User Profile
- [ ] User can view their profile
- [ ] User can edit their name
- [ ] User can update their email
- [ ] User can change their password
- [ ] User can upload profile picture
- [ ] User can set preferences (for investors)
- [ ] User can view verification status
- [ ] User can request verification
- [ ] User preferences are saved
- [ ] Profile changes are reflected immediately

### Admin Dashboard
- [ ] Admin can view total users count
- [ ] Admin can view total properties count
- [ ] Admin can view total bookings count
- [ ] Admin can view revenue metrics
- [ ] Admin can view daily active users
- [ ] Admin can search users by email
- [ ] Admin can view user details
- [ ] Admin can disable user account
- [ ] Admin can view system logs
- [ ] Admin can generate reports

### Error Handling
- [ ] Network error shows appropriate message
- [ ] Timeout shows retry option
- [ ] Invalid input shows validation errors
- [ ] Permission denied shows error message
- [ ] 404 errors handled gracefully
- [ ] 500 errors show error message
- [ ] Database connection failure handled
- [ ] API failure handled with fallback
- [ ] Incomplete forms show validation errors
- [ ] Duplicate submissions prevented

### Performance
- [ ] App loads within 2 seconds
- [ ] Search results load within 1 second
- [ ] Images load quickly
- [ ] Messages send/receive within 1 second
- [ ] Large file uploads handle gracefully
- [ ] App remains responsive under load
- [ ] No memory leaks after extended use
- [ ] Animations are smooth (60fps)
- [ ] Push notifications arrive quickly
- [ ] Background tasks don't freeze UI

---

## Device Testing Matrix

### iOS Devices
- [ ] iPhone SE (smallest screen)
- [ ] iPhone 12/13/14
- [ ] iPhone 15 Pro Max (largest screen)
- [ ] iPad (tablet testing)

### Android Devices
- [ ] Pixel 4a (5.8")
- [ ] Pixel 6/7 (6.1")
- [ ] Samsung Galaxy S21 (6.2")
- [ ] OnePlus 9 (6.7")
- [ ] Budget device (Redmi Note)
- [ ] Tablet (Samsung Tab)

### Screen Sizes
- [ ] 5.0" display
- [ ] 5.5" display
- [ ] 6.0" display
- [ ] 6.5" display
- [ ] Tablet 7.9"
- [ ] Tablet 10.5"

### Orientations
- [ ] Portrait mode all devices
- [ ] Landscape mode all devices
- [ ] Rotation transitions smooth
- [ ] Data persists after rotation
- [ ] UI adapts to rotation correctly

---

## OS Version Testing

### iOS Versions
- [ ] iOS 14.x
- [ ] iOS 15.x
- [ ] iOS 16.x
- [ ] iOS 17.x (latest)

### Android Versions
- [ ] Android 10
- [ ] Android 11
- [ ] Android 12
- [ ] Android 13
- [ ] Android 14 (latest)

### OS-Specific Features
- [ ] iOS dark mode works
- [ ] Android dark mode works
- [ ] iOS notifications work
- [ ] Android notifications work
- [ ] Face ID works (iOS)
- [ ] Fingerprint works (Android)
- [ ] Location services work
- [ ] Camera permissions work

---

## Network Condition Testing

### Connection Types
- [ ] WiFi (5G and 2.4G)
- [ ] 4G LTE
- [ ] 5G
- [ ] 3G (if applicable)
- [ ] Edge/GPRS (slow)

### Network Conditions
- [ ] Perfect network (no issues)
- [ ] Slow network (>1s latency)
- [ ] Unstable network (frequent drops)
- [ ] Offline mode
- [ ] Network switch (WiFi to 4G)
- [ ] Low bandwidth
- [ ] High latency
- [ ] Packet loss

### Behavior Under Poor Network
- [ ] App shows appropriate loading states
- [ ] Offline features work
- [ ] Syncs when connection restored
- [ ] Errors are user-friendly
- [ ] Retries are automatic
- [ ] Queue messages for sending
- [ ] Cache works without network

---

## Payment Testing (Sandbox)

### Credit Card Tests
- [ ] Visa card processing
- [ ] Mastercard processing
- [ ] Amex card processing
- [ ] Test card success
- [ ] Test card failure
- [ ] Expired card handling
- [ ] Invalid CVC handling
- [ ] Incorrect amount handling
- [ ] Declined card handling
- [ ] Refund processing

### Payment Flows
- [ ] Single payment
- [ ] Multiple payments same session
- [ ] Payment after cart update
- [ ] Payment cancellation
- [ ] Payment modification
- [ ] Payment retry
- [ ] Payment confirmation email
- [ ] Payment invoice generation

### Sandbox Credentials
```
Stripe Test Cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Requires Auth: 4000 0025 0000 3155
- Expired: 4000 0000 0000 9995

Expiry: Any future date
CVC: Any 3 digits
```

---

## Regression Testing

### Critical Paths
- [ ] Login → Search → Booking → Payment
- [ ] Agent adds property → Investor finds it → Books viewing
- [ ] WhatsApp message → Property suggestion → Booking
- [ ] User profile update saved correctly
- [ ] Payment receipt generated and emailed

### Previous Issues
- [ ] Image upload fails handled (if applicable)
- [ ] Message delivery delays handled
- [ ] Booking cancellation edge cases
- [ ] Payment timeout scenarios
- [ ] Session expiry handling

---

## Accessibility Testing

### WCAG 2.1 Compliance
- [ ] Color contrast meets standards
- [ ] All buttons are keyboard accessible
- [ ] Form labels associated with inputs
- [ ] Touch targets minimum 44x44px
- [ ] Focus indicators visible
- [ ] Error messages accessible
- [ ] Images have alt text
- [ ] Videos have captions

### Screen Reader Testing
- [ ] Navigation menus readable
- [ ] Form inputs announced correctly
- [ ] Buttons and links announced
- [ ] Alerts announced immediately
- [ ] Dynamic content updates announced

---

## Security Testing Checklist

### Authentication
- [ ] No credentials stored locally in plaintext
- [ ] Sessions timeout after inactivity
- [ ] Logout clears sensitive data
- [ ] HTTPS/TLS enforced
- [ ] Password validation enforced
- [ ] Two-factor authentication works
- [ ] Token expiration enforced
- [ ] CSRF tokens present on forms

### Data Protection
- [ ] Sensitive data encrypted
- [ ] Personal information not logged
- [ ] API keys not exposed in logs
- [ ] No sensitive data in URLs
- [ ] Secure headers present
- [ ] SQL injection prevented
- [ ] XSS vulnerabilities addressed
- [ ] CORS properly configured

### Permissions
- [ ] Users can't access others' data
- [ ] Agents limited to their properties
- [ ] Investors limited to their bookings
- [ ] Admin properly restricted
- [ ] Permission checks on backend
- [ ] Frontend permission checks
- [ ] Role-based access enforced
- [ ] Least privilege principle followed

---

## Localization Testing

### Languages
- [ ] English UI complete
- [ ] All text properly translated
- [ ] Date formats localized
- [ ] Currency displays correctly
- [ ] Phone numbers formatted correctly
- [ ] RTL languages supported (if applicable)

### Regions
- [ ] US region settings
- [ ] EUR region settings
- [ ] Asia region settings
- [ ] Time zones handled correctly
- [ ] Regional payment methods work

---

## Analytics & Monitoring

### Tracking
- [ ] Page views tracked
- [ ] User actions tracked
- [ ] Errors logged
- [ ] Performance metrics collected
- [ ] Conversion funnels tracked
- [ ] User attribution working

### Alerts
- [ ] High error rate alerts
- [ ] Performance degradation alerts
- [ ] Payment failure alerts
- [ ] System down alerts
- [ ] Unusual activity alerts

---

## Browser Compatibility (Web if applicable)

### Desktop Browsers
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest

### Mobile Browsers
- [ ] Safari iOS latest
- [ ] Chrome Android latest
- [ ] Firefox Android latest

### Compatibility
- [ ] No console errors
- [ ] No console warnings
- [ ] UI renders correctly
- [ ] Responsive design works
- [ ] All features functional

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Coverage meets threshold (80%+)
- [ ] No console errors/warnings
- [ ] No memory leaks detected
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Code review approved
- [ ] Changelog updated

### Post-Deployment
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Check user feedback
- [ ] Monitor payment processing
- [ ] Verify all features working
- [ ] Monitor WhatsApp integration
- [ ] Check Firebase connectivity
- [ ] Monitor database performance

---

## Sign-Off

- [ ] QA Lead: _____________________ Date: _______
- [ ] Product Manager: _____________________ Date: _______
- [ ] Engineering Lead: _____________________ Date: _______

---

## Notes

Document any issues or observations here:

```



```
