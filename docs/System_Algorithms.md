# CodeHub System Algorithms

This document contains detailed algorithms for all major system operations in the CodeHub platform, including subscription-based access control and premium features.

---

## Algorithm 1: User Authentication and Registration

**Input:** User registration data (name, email, password, confirmPassword)  
**Output:** Authentication token and user object, or error message

1. Start
2. Receive user input data and requested action.
3. If the action is Registration, then:
   1. Check whether the email format is valid.
      - If invalid, display an error message and stop.
   2. Check whether the password length meets the minimum requirement (at least 6 characters).
      - If not, display an error message and stop.
   3. Check whether the password and confirm password match.
      - If they do not match, display an error message and stop.
   4. Check whether the email already exists in the system.
      - If it exists, display an error message and stop.
   5. Encrypt the user password using a secure hashing method (bcrypt).
   6. Create a new user account with:
      - Default role as 'user'
      - Account status as 'active'
      - Email verification status as 'false'
      - **Subscription plan as 'free'**
      - **Subscription status as 'none'**
      - **Code queries remaining: 5**
      - **Tutorial generation remaining: 5**
   7. Generate an email verification token and send verification email.
   8. Generate a JWT authentication token for the user.
   9. Display a success message along with the token and user information.
4. Else if the action is Login, then:
   1. Search for the user using the provided email.
      - If the user does not exist, display an error message and stop.
   2. Check whether the user's email is verified.
      - If not verified, display an error message and stop.
   3. Check whether the user account is active.
      - If suspended or inactive, display an error message and stop.
   4. Compare the entered password with the stored encrypted password.
      - If the password is incorrect, track failed login attempt and display an error message and stop.
   5. Reset failed login attempts counter on successful login.
   6. Generate a JWT authentication token for the user.
   7. Update the user's last login time.
   8. Display a success message along with the token and user information.
5. End

---

## Algorithm 2: Multi-Language Code Execution

**Input:** Code string, programming language, session ID, optional standard input  
**Output:** Execution result with output, errors, and performance metrics

1. Start
2. Receive the source code, selected programming language, session ID, and optional standard input.
3. Check whether the source code is empty or missing.
   - If yes, display an error message and stop.
4. Check whether the selected programming language is supported (Python, C++, JavaScript).
   - If not supported, display an error message and stop.
5. If the session ID is not provided, generate a unique session ID.
6. Sanitize the source code to remove unsafe or malicious content.
7. Check the sanitized code for dangerous patterns.
   - If any dangerous pattern is found, display an error message and stop.
8. Prepare a secure execution environment based on the selected language:
   - Python: Use python-executor Docker image
   - C++: Use cpp-executor Docker image
   - JavaScript: Use javascript-executor Docker image
9. Create an isolated Docker container for code execution.
10. Apply resource limits:
    - Execution timeout: 10 seconds
    - Memory limit: 256 MB
    - Output size limit: 64 KB
11. Record the start time of execution.
12. Execute the sanitized code inside the container with the provided input.
13. Calculate the total execution time.
14. Check whether the output size exceeds the allowed limit.
    - If exceeded, destroy the container, display an error message and stop.
15. Measure the memory usage during execution.
16. Destroy the container to free system resources.
17. Display successful execution results including output, execution time, and memory usage.
18. If an error occurs during execution:
    - Calculate execution time.
    - Destroy the container.
    - Display an appropriate error message based on the error type:
      - Timeout error: Execution exceeded time limit
      - Memory limit error: Memory usage exceeded limit
      - Execution error: Runtime error with error details
19. End

---

## Algorithm 3: Course Enrollment and Progress Tracking

**Input:** User ID, Course ID, action type  
**Output:** Enrollment status and progress information

1. Start
2. Verify that the user exists.
   - If the user is not found, display an error message and stop.
3. Search for the course using the course ID.
   - If the course does not exist, display an error message and stop.
4. Check whether the course is published and available.
   - If the course is not published, display an error message and stop.
5. Check whether the course is archived.
   - If the course is archived, display an error message and stop.
6. If the action is Enroll, then:
   1. **Check whether the course is a premium course.**
      - **If the course is premium, verify that the user has an active premium subscription.**
      - **If the user does not have premium access, display an error message and stop.**
   2. Check whether the user is already enrolled in the course.
      - If already enrolled, display an error message and stop.
   3. Create a new enrollment record with:
      - Current date as enrollment date
      - Initial progress as 0%
      - Status as 'active'
      - Empty section progress array
      - Certificate issued status as false
   4. Increase the course enrollment count by one.
   5. Save the updated course information.
   6. Send an enrollment notification to the user.
   7. Display a success message with enrollment details.
7. Else if the action is Update Progress, then:
   1. Check whether the user is enrolled in the course.
      - If not enrolled, display an error message and stop.
   2. Calculate the progress percentage based on completed lessons in all sections.
   3. Update the enrollment progress and last accessed time.
   4. If progress reaches 100%, mark the course as completed:
      - Set completion date
      - Update status to 'completed'
      - Increment course completed count
      - Send course completion notification
   5. Save the updated enrollment record.
   6. Display a success message with updated progress.
8. Else if the action is Get Progress, then:
   1. Check whether the user is enrolled in the course.
      - If not enrolled, display an error message and stop.
   2. Retrieve the enrollment record with all section and lesson progress details.
   3. Display the user's complete course progress information.
9. End

---

## Algorithm 4: Tutorial Recommendation and Filtering

**Input:** Filter criteria, user preferences  
**Output:** Filtered and sorted list of tutorials

1. Start
2. Initialize an empty query for filtering tutorials.
3. If a programming language filter is provided, add it to the query.
4. If a difficulty level filter is provided, add it to the query.
5. If a concept keyword is provided, include it in the query for matching:
   - Search in tutorial title
   - Search in tutorial description
   - Search in tutorial keywords
6. Restrict the query to include only published and non-archived tutorials.
7. Retrieve the list of tutorials based on the constructed query.
8. If a user ID is provided, then:
   - Retrieve the user information.
   - If the user exists:
     - Obtain the list of tutorials saved by the user.
     - Retrieve the courses completed by the user.
     - Get the user's preferred programming languages.
     - Mark tutorials that the user has saved.
     - Boost recommendation score for tutorials in user's preferred languages.
9. Sort the tutorials based on multiple criteria:
   - Recommendation score (highest first)
   - Average rating (highest first)
   - View count (most viewed first)
   - Creation date (most recent first)
10. If a result limit is provided and greater than zero:
    - Store the total number of tutorials.
    - Limit the tutorial list to the specified number.
11. Otherwise, store the total number of available tutorials.
12. Display the recommended tutorial list along with the total count.
13. End

---

## Algorithm 5: Certificate Display and Print

**Input:** User authentication, certificate requests, print actions  
**Output:** Certificate interface with download/print capabilities

1. Start
2. Initialize the certificate state with empty certificate list, loading status, error state, page number, and total count.
3. Check whether the user is authenticated.
   - If the user is not authenticated, redirect to the sign-in page and terminate the process.
4. Load user certificates by performing the following steps:
   1. Set the loading state to active and clear previous errors.
   2. Request approved certificates for the current page from the system.
   3. If the request is successful:
      - Store the retrieved certificates.
      - Update the total certificate count.
   4. Otherwise, record an error message.
   5. Disable the loading state.
5. When the user requests to download or print a certificate:
   1. Mark the selected certificate as being processed.
   2. Generate a secure download link using the authentication token.
   3. Open the certificate in a new window for printing.
   4. If the window fails to open, redirect the user to the download link.
   5. Clear the printing state.
6. When the user changes the page number:
   1. Update the current page.
   2. Reload the certificate list.
7. Display certificates based on the current state:
   1. Show a loading indicator if certificates are being fetched.
   2. Show an error message if loading fails.
   3. Show an empty message if no certificates are available.
   4. Otherwise, display certificate cards with course and certificate details.
8. When a course is fully completed:
   1. Check if course progress is 100%.
   2. Check if final assessment is completed and passed (if required).
   3. Generate a unique certificate number.
   4. Determine certificate template based on final score:
      - Excellence: Score >= 90%
      - Distinguished: Score >= 75%
      - Standard: Score < 75%
   5. Create certificate record with approval status as 'pending'.
   6. Send certificate request notification.
9. Determine the certificate status display:
   - Pending: Certificate awaiting admin approval
   - Approved: Certificate ready for download
   - Rejected: Certificate request was not approved
10. Return the updated certificate state.
11. End

---

## Algorithm 6: Admin Dashboard Management

**Input:** Admin action type, target data, authentication state  
**Output:** Updated admin interface with operation results

1. Start
2. Verify whether the user is authenticated and has administrator privileges.
   - If the user is not an administrator, redirect to the sign-in page and terminate the process.
3. Initialize the admin system state, including active section, loading status, error state, and data container.
4. When an admin selects a dashboard section:
   1. Update the active section and enable loading mode.
   2. Retrieve data based on the selected section:
      - Load system analytics including:
        - **Total users (active, premium, free)**
        - **Total courses (all, premium courses)**
        - Total tutorials
        - Total enrollments
        - Pending certificates
        - **Monthly revenue from subscriptions**
        - **Active subscription count**
      - Load user information for user management.
      - Load tutorials for content management.
      - Load courses for course management.
      - Load pending certificates for approval.
   3. Disable loading mode after data retrieval.
5. When an admin performs a user-related action:
   1. Validate the requested action.
   2. Prevent administrators from modifying their own critical access.
   3. Apply the requested action:
      - Suspend user: Set account status to 'suspended'
      - Activate user: Set account status to 'active'
      - Change role: Update user role (admin/user)
      - **Upgrade subscription: Set to premium with unlimited usage**
   4. Update the system records and display a confirmation message.
   5. Create admin action log for audit trail.
6. When an admin performs a course-related action:
   1. Validate course data.
   2. Apply requested action:
      - Publish course: Make course visible to users
      - Unpublish course: Hide course from users
      - Archive course: Permanently archive the course
      - **Mark as premium: Toggle premium access requirement**
   3. Update the course record and notify the administrator.
7. When an admin performs a certificate-related action:
   1. Validate the action request.
   2. If approving:
      - Set approval status to 'approved'
      - Record admin who approved and approval date
      - Generate certificate download URL
      - Notify user of approval
   3. If rejecting:
      - Set approval status to 'rejected'
      - Record rejection reason
      - Notify user of rejection
   4. Update certificate records and notify the administrator.
8. Handle any operational errors by displaying appropriate error messages.
9. Return the updated administrative system state.
10. End

---

## Algorithm 7: AI Tutorial Generation with Usage Limits

**Input:** User ID, tutorial topic, authentication state  
**Output:** Generated AI tutorial or usage limit error

1. Start
2. Verify whether the user is authenticated.
   - If the user is not authenticated, display an error message and stop.
3. Receive the tutorial topic provided by the user.
4. Validate the tutorial topic.
   - If the topic is empty or invalid, display an error message and stop.
   - If the topic is too short (less than 3 characters), display an error message and stop.
5. **Check usage limits based on subscription plan:**
   - **If the user has a free plan:**
     - **Check if tutorial generation limit has been reached (tutorialGenRemaining <= 0).**
     - **If limit reached, display upgrade message and stop.**
     - **Otherwise, decrease tutorialGenRemaining by 1.**
   - **If the user has a premium plan:**
     - **Allow unlimited access (no limit check).**
6. Sanitize the tutorial topic to remove unsafe content.
7. Check for inappropriate content in the topic.
   - If inappropriate content detected, display an error message and stop.
8. Send the tutorial topic to the AI tutorial generation system (Gemini API).
9. Generate tutorial content using the AI model based on the given topic.
10. Parse and structure the generated content:
    - Extract introduction/description
    - Extract main content sections
    - Extract code examples
11. Detect programming language from generated content.
12. Assess difficulty level from generated content.
13. Create a tutorial record with:
    - Title from sanitized topic
    - Generated content and structure
    - Detected language and difficulty
    - User ID as generator
    - Status as unpublished/draft
    - Flag as user-generated
14. Save the generated tutorial in the system linked to the requesting user.
15. Send tutorial generation success notification.
16. Display a success message with:
    - The generated tutorial
    - **Remaining generation count (for free users)**
17. If AI generation fails:
    - **Refund the usage count for free users (add 1 back)**
    - Display appropriate error message.
18. End

---

## Algorithm 8: AI Chatbot with Context and Usage Limits

**Input:** User ID, user prompt, context (code/course/tutorial), authentication state  
**Output:** AI response in chatbot panel or usage limit error

1. Start
2. Verify whether the user is authenticated.
   - If the user is not authenticated, display an error message and stop.
3. Receive the user's prompt from the chatbot interface.
4. Validate the user prompt.
   - If the prompt is empty or invalid, display an error message and stop.
   - If the prompt is too long (over 5000 characters), display an error message and stop.
5. **Check usage limits based on subscription plan:**
   - **If the user has a free plan:**
     - **Check if AI chat query limit has been reached (codeQueriesRemaining <= 0).**
     - **If limit reached, display upgrade message and stop.**
     - **Otherwise, decrease codeQueriesRemaining by 1.**
   - **If the user has a premium plan:**
     - **Allow unlimited access (no limit check).**
6. Gather contextual information:
   - If code editor context is available:
     - Extract current code
     - Extract programming language
     - Extract any errors or problems
     - Extract cursor position
   - If course context is available:
     - Extract course name and language
     - Extract current lesson title
   - If tutorial context is available:
     - Extract tutorial name and language
7. Sanitize the user prompt for safety.
8. Check for inappropriate content in the prompt.
   - If inappropriate content detected, display an error message and stop.
9. Construct AI prompt with user message and all gathered context.
10. Send the prompt to the AI chatbot system (Gemini API) with:
    - Maximum token limit: 2000
    - Temperature: 0.7
    - High safety settings
11. Generate a response using the AI model based on the provided prompt and context.
12. Check if the AI response is successfully generated.
    - If not, display an error message and stop.
13. Store the chat interaction in database:
    - User message
    - AI response
    - Context type (general/course/tutorial)
    - Context title and ID if applicable
    - Timestamp
14. Update user's recent AI chat history.
15. Display the AI response in the chatbot panel for the user.
16. Return success with:
    - The AI response
    - **Remaining query count (for free users)**
17. If AI generation fails:
    - **Refund the usage count for free users (add 1 back)**
    - Display appropriate error message.
18. Optionally, log the interaction for analytics or learning purposes.
19. End

---

## Algorithm 9: Subscription Management and Upgrade

**Input:** User ID, subscription action, payment details  
**Output:** Updated subscription status or payment session

1. Start
2. Verify that the user is authenticated.
   - If the user is not authenticated, display an error message and stop.
3. If the action is Upgrade to Premium, then:
   1. Check if the user already has an active premium subscription.
      - If already premium, display an error message and stop.
   2. Create or retrieve Stripe customer ID:
      - If user doesn't have Stripe customer ID, create new customer in Stripe
      - Store Stripe customer ID in user record
   3. Create Stripe checkout session with:
      - Customer ID
      - Premium price ID ($9.99/month)
      - Subscription mode
      - Success and cancel URLs
      - User metadata
   4. Return checkout session ID and URL for payment.
4. Else if the action is Cancel Subscription, then:
   1. Verify user has an active premium subscription.
      - If no active subscription, display an error message and stop.
   2. Check if Stripe subscription ID exists.
      - If not found, display an error message and stop.
   3. Cancel Stripe subscription:
      - Set to cancel at period end (not immediate)
   4. Update user subscription status to 'canceled'.
   5. Store cancellation date (when it will end).
   6. Create cancellation record with reason.
   7. Send cancellation confirmation notification.
   8. Display success message with end date.
5. Else if the action is Check Status, then:
   1. Retrieve current subscription information:
      - Subscription plan (free/premium)
      - Subscription status
      - Stripe customer and subscription IDs
      - Current period end date
      - Cancellation date (if applicable)
   2. If user has free plan:
      - Include remaining AI chat queries
      - Include remaining tutorial generations
      - Include next reset date
   3. Return subscription status information.
6. Else if the action is Restore Subscription, then:
   1. Check if user has a canceled subscription.
      - If no canceled subscription, display an error message and stop.
   2. Check if Stripe subscription ID exists.
      - If not found, display an error message and stop.
   3. Restore subscription in Stripe:
      - Set cancel at period end to false
   4. Update user subscription status to 'active'.
   5. Clear cancellation date.
   6. Send restoration confirmation notification.
   7. Display success message.
7. End

---

## Algorithm 10: Stripe Webhook Handler for Subscription Events

**Input:** Stripe webhook event, event signature  
**Output:** Processed event result and updated user status

1. Start
2. Verify webhook signature for security:
   - Use Stripe webhook secret to verify signature
   - If signature is invalid, display error message and stop
3. Extract event type and event data from verified webhook.
4. If event type is 'checkout.session.completed', then:
   1. Extract customer ID, subscription ID, and user ID from event.
   2. Find user by user ID.
      - If user not found, log error and stop.
   3. Update user subscription:
      - Set subscription plan to 'premium'
      - Set subscription status to 'active'
      - Store Stripe subscription ID
      - Set code queries remaining to unlimited (-1)
      - Set tutorial generation remaining to unlimited (-1)
   4. Save updated user record.
   5. Send welcome to premium notification.
   6. Return success status.
5. Else if event type is 'customer.subscription.updated', then:
   1. Extract subscription ID and status from event.
   2. Find user by Stripe subscription ID.
      - If user not found, log error and stop.
   3. Update user subscription status and current period end date.
   4. If subscription status is 'past_due':
      - Send payment failed notification to user
   5. Save updated user record.
   6. Return success status.
6. Else if event type is 'customer.subscription.deleted', then:
   1. Extract subscription ID from event.
   2. Find user by Stripe subscription ID.
      - If user not found, log error and stop.
   3. Downgrade user to free tier:
      - Set subscription plan to 'free'
      - Set subscription status to 'none'
      - Clear Stripe subscription ID
      - Reset code queries remaining to 5
      - Reset tutorial generation remaining to 5
   4. Save updated user record.
   5. Send subscription ended notification.
   6. Return success status.
7. Else if event type is 'invoice.payment_succeeded', then:
   1. Extract customer ID and payment amount.
   2. Find user by Stripe customer ID.
   3. If user found:
      - Ensure subscription status is 'active'
      - Save user record if updated
   4. Return success status.
8. Else if event type is 'invoice.payment_failed', then:
   1. Extract customer ID and attempt count.
   2. Find user by Stripe customer ID.
   3. If user found:
      - Update subscription status to 'past_due'
      - Save user record
      - Send payment failed notification with attempt count
   4. Return success status.
9. For any unhandled event type:
   - Log event type for monitoring
   - Return success (acknowledge receipt)
10. End

---

## Algorithm 11: Monthly Usage Limit Reset (Scheduled Job)

**Input:** Current date/time, scheduled trigger  
**Output:** Reset usage limits for all free tier users

1. Start (This runs as a scheduled cron job on the 1st of each month at 00:00 UTC)
2. Find all users with free tier subscription (subscriptionPlan = 'free').
3. Initialize counters:
   - Reset count = 0
   - Error count = 0
4. For each free tier user:
   1. Try to reset usage limits:
      - Set code queries remaining to 5
      - Set tutorial generation remaining to 5
      - Update last usage reset timestamp
   2. Save the updated user record.
   3. Increment reset count.
   4. If user had run out of queries or generations:
      - Send usage reset notification to user
      - Inform them their monthly limits have been restored
   5. If any error occurs:
      - Increment error count
      - Log error with user ID and error details
      - Continue with next user
5. Log summary of reset operation:
   - Total number of users reset
   - Number of errors encountered
6. Return success status with:
   - Number of users successfully reset
   - Summary message
7. End

---

## Summary of Subscription-Related Changes

All algorithms have been updated to reflect the current subscription-based features in CodeHub.

### Key Changes by Algorithm:

**Algorithm 1:** User Authentication and Registration

- New users start with free tier subscription
- Default limits: 5 AI queries and 5 tutorial generations per month
- Premium users created with unlimited access

**Algorithm 3:** Course Enrollment and Progress Tracking

- Added premium course access control
- Free users blocked from enrolling in premium courses
- Premium validation before enrollment

**Algorithm 7:** AI Tutorial Generation

- Free users: Limited to 5 generations per month
- Premium users: Unlimited generations
- Usage tracking and refund on failure
- Upgrade prompts when limit reached

**Algorithm 8:** AI Chatbot

- Free users: Limited to 5 queries per month
- Premium users: Unlimited queries
- Context-aware responses (code, course, tutorial)
- Usage tracking with automatic refund on errors

**Algorithm 9:** Subscription Management (NEW)

- Upgrade to premium via Stripe ($9.99/month)
- Cancel subscription (ends at period end)
- Restore canceled subscription
- Check subscription status and usage limits

**Algorithm 10:** Stripe Webhook Handler (NEW)

- Automatic subscription activation on payment
- Handle payment failures and retries
- Automatic downgrade on subscription end
- Real-time status updates

**Algorithm 11:** Monthly Usage Reset (NEW)

- Automated cron job (runs 1st of each month)
- Resets free tier limits to 5/5
- Notifies users when limits restore
- Error handling and logging

### Premium Features:

✅ Unlimited AI chat queries  
✅ Unlimited tutorial generation  
✅ Access to premium courses  
✅ Priority support  
✅ Advanced analytics  
✅ Certificates and portfolio

### Free Tier Limitations:

❌ 5 AI chat queries per month  
❌ 5 tutorial generations per month  
❌ No access to premium courses  
✅ Basic course access (non-premium)  
✅ Community support  
✅ Standard features

### Subscription Plans:

**Free Plan ($0/month)**

- 5 AI chatbot queries per month
- 5 AI tutorial generations per month
- Access to all free courses
- Basic code execution
- Community support
- Resets on 1st of each month

**Premium Plan ($9.99/month)**

- Unlimited AI chatbot queries
- Unlimited AI tutorial generations
- Access to ALL courses (including premium)
- Unlimited code execution
- Priority support
- Advanced progress tracking
- Certificate generation
- Cancel anytime

---

**Document Version:** 2.0 (Updated with Subscription Features)  
**Last Updated:** March 9, 2026  
**Total Algorithms:** 11 (7 original + 4 new subscription-related)
