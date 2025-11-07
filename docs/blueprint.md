# **App Name**: CityZen Complaints

## Core Features:

- User Authentication: Secure login/registration for citizens and admins using bcrypt hashed passwords and secure sessions.
- Complaint Management (CRUD): Citizens can create, view, update (if pending), and delete their own complaints. Admins can read, update, resolve, and delete any complaint.
- Feedback Submission: Users can submit feedback (rating and comments) related to a specific complaint.
- Admin Reporting & Status: Admins can view reports, mark complaint status (Pending, In Progress, Resolved, Rejected), and paginate through complaints.
- Input Validation: Client-side (JS) and server-side (PHP) validation with inline error messages for all form fields. Validates phone number (10 digits), email, and required fields.
- Secure File Uploads: Handling file uploads with type and size validation, storing them securely with randomized names, restricting types to jpg, png, pdf and maximum size.
- AI Powered Sentiment Analyzer: Tool that assesses the sentiment of citizen feedback to better gauge urgent concerns

## Style Guidelines:

- Primary color: #3B82F6 (a vibrant blue) to convey trust and civic responsibility. The color aligns well with concepts of modernity, technology, and community.
- Background color: #F0F9FF (a very light blue, almost white), same hue as primary color but highly desaturated to allow the primary color to stand out while not straining the eyes.
- Accent color: #4ADE80 (a vivid green, similar hue as primary color), which provides contrast to draw attention to key interactive elements
- Font: 'Inter', a sans-serif font that provides a modern and clean look suitable for both headlines and body text.
- Modern, responsive layout using CSS variables for consistent styling. Separate dashboards for users and admins.
- Simple, clear icons to represent complaint categories and status indicators.
- Subtle hover and focus styles for interactive elements to improve usability.