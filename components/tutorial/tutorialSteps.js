// Tutorial steps configuration for different user types

export const userTutorialSteps = [
  {
    title: 'Welcome to PawScan! 🐾',
    description: 'Let\'s take a quick tour to help you get started with our pet health monitoring system.',
    icon: { type: 'MaterialIcons', name: 'pets' },
    tip: 'You can skip this tutorial anytime or restart it from your profile settings.',
    position: { top: 150, left: 20, right: 20 },
  },
  {
    title: 'Home Feed',
    description: 'See posts from the pet community including health analyses and updates. Search for specific posts using the search icon.',
    icon: { type: 'FontAwesome', name: 'home' },
    tip: 'Tap the search icon to find posts by pet name, owner, or disease.',
    position: { top: 120, left: 20, right: 20 },
  },
  {
    title: 'Disease Information',
    description: 'Access our comprehensive database of pet diseases. Tap the info icon to browse conditions, symptoms, and treatments.',
    icon: { type: 'FontAwesome', name: 'info-circle' },
    tip: 'Bookmark diseases for quick access and compare similar conditions.',
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Scan History',
    description: 'View your past scans by tapping the history icon. Track your pet\'s health over time.',
    icon: { type: 'FontAwesome', name: 'history' },
    tip: 'Regular scans help detect health changes early.',
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Notifications',
    description: 'Stay updated with comments, likes, and responses from veterinarians via the notification bell.',
    icon: { type: 'MaterialIcons', name: 'notifications' },
    position: { top: 120, left: 20, right: 20 },
  },
  {
    title: 'Camera Scan',
    description: 'Tap the camera tab to scan your pet for health issues. Our AI will analyze the image and provide insights.',
    icon: { type: 'FontAwesome', name: 'camera' },
    tip: 'Make sure your pet is well-lit and the camera is focused for best results.',
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Chat with Vets',
    description: 'Get professional advice from licensed veterinarians. Tap the chat tab to start a conversation.',
    icon: { type: 'FontAwesome', name: 'comment' },
    tip: 'Check vet availability and specialties before starting a chat.',
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Your Profile',
    description: 'Manage your account, view scan history, and access settings from your profile.',
    icon: { type: 'FontAwesome', name: 'user' },
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'You\'re All Set!',
    description: 'You\'re ready to start using PawScan. Remember, our AI analysis is for reference only - always consult a vet for serious concerns.',
    icon: { type: 'MaterialIcons', name: 'check-circle' },
    tip: 'You can restart this tutorial anytime from Settings.',
    position: { top: 200, left: 20, right: 20 },
  },
];

export const vetTutorialSteps = [
  {
    title: 'Welcome, Veterinarian! 👨‍⚕️',
    description: 'Thank you for joining PawScan. Let\'s show you how to use the platform to help pet owners.',
    icon: { type: 'MaterialIcons', name: 'local-hospital' },
    tip: 'Your professional input is valuable to the pet community.',
    position: { top: 150, left: 20, right: 20 },
  },
  {
    title: 'Community Feed',
    description: 'Review posts from pet owners. You can provide professional comments and insights on health concerns.',
    icon: { type: 'FontAwesome', name: 'home' },
    tip: 'Your vet badge will appear on all your comments and posts.',
    position: { top: 120, left: 20, right: 20 },
  },
  {
    title: 'Disease Database',
    description: 'Access comprehensive disease information to support your diagnoses and educate pet owners.',
    icon: { type: 'FontAwesome', name: 'info-circle' },
    tip: 'Reference this during consultations for accurate information.',
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Professional Analysis',
    description: 'You can also scan pets and share your professional analysis with enhanced credibility.',
    icon: { type: 'FontAwesome', name: 'camera' },
    tip: 'Your analyses will be marked as "Verified by Veterinarian".',
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Chat with Pet Owners',
    description: 'Respond to inquiries from pet owners. Set your availability schedule in the profile settings.',
    icon: { type: 'FontAwesome', name: 'comment' },
    tip: 'You can manage your consultation hours and response preferences.',
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Vet Profile',
    description: 'Maintain your professional profile with credentials, specialties, and availability schedule.',
    icon: { type: 'FontAwesome', name: 'user' },
    tip: 'A complete profile builds trust with pet owners.',
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Ready to Help!',
    description: 'You\'re all set to start helping pet owners. Remember to always provide responsible professional advice.',
    icon: { type: 'MaterialIcons', name: 'check-circle' },
    position: { top: 200, left: 20, right: 20 },
  },
];

export const cameraTutorialSteps = [
  {
    title: 'Pet Health Scanner',
    description: 'Use your camera to scan your pet for potential health issues. Our AI will analyze the image.',
    icon: { type: 'FontAwesome', name: 'camera' },
    position: { top: 150, left: 20, right: 20 },
  },
  {
    title: 'Choose Photo Source',
    description: 'Take a new photo with your camera or choose an existing one from your gallery.',
    icon: { type: 'MaterialIcons', name: 'photo-library' },
    tip: 'Clear, well-lit photos work best for accurate analysis.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Camera Tips',
    description: 'For best results: ensure good lighting, focus on the affected area, and keep your pet still.',
    icon: { type: 'MaterialIcons', name: 'lightbulb-outline' },
    tip: 'Multiple angles can help with more accurate diagnoses.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'AI Analysis',
    description: 'Once you submit the photo, our AI will analyze it and provide insights about potential health concerns.',
    icon: { type: 'MaterialIcons', name: 'analytics' },
    tip: 'Analysis usually takes 5-10 seconds.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Review Results',
    description: 'Read the analysis carefully, including disease likelihood, symptoms, and recommendations.',
    icon: { type: 'FontAwesome', name: 'file-text' },
    tip: 'AI results are for reference only - consult a vet for diagnosis.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Share Results',
    description: 'You can share your analysis with the community or keep it private in your history.',
    icon: { type: 'MaterialIcons', name: 'share' },
    tip: 'Sharing helps other pet owners recognize similar conditions.',
    position: { top: 180, left: 20, right: 20 },
  },
];

export const historyTutorialSteps = [
  {
    title: 'Scan History',
    description: 'View all your previous pet health scans and their analysis results in one place.',
    icon: { type: 'MaterialIcons', name: 'history' },
    position: { top: 150, left: 20, right: 20 },
  },
  {
    title: 'Track Progress',
    description: 'Monitor your pet\'s health over time by comparing past scans and analyses.',
    icon: { type: 'MaterialIcons', name: 'trending-up' },
    tip: 'Regular scans help detect health changes early.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Detailed View',
    description: 'Tap any scan to see detailed analysis, recommendations, and any vet comments.',
    icon: { type: 'MaterialIcons', name: 'info' },
    tip: 'You can reshare or delete old analyses from the details view.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Filter & Sort',
    description: 'Use filters to view scans by date, urgency level, or pet name if you have multiple pets.',
    icon: { type: 'FontAwesome', name: 'filter' },
    position: { top: 180, left: 20, right: 20 },
  },
];

export const diseaseInfoTutorialSteps = [
  {
    title: 'Disease Information Database',
    description: 'Access comprehensive information about pet diseases, symptoms, and treatments.',
    icon: { type: 'FontAwesome', name: 'info-circle' },
    position: { top: 150, left: 20, right: 20 },
  },
  {
    title: 'Search Diseases',
    description: 'Use the search bar to find specific diseases, symptoms, or affected species.',
    icon: { type: 'FontAwesome', name: 'search' },
    tip: 'Search works for disease names, symptoms, and keywords.',
    position: { top: 120, left: 20, right: 20 },
  },
  {
    title: 'Filter by Category',
    description: 'Filter diseases by category: Skin Conditions, Infections, Parasites, Allergies, Tumors, and more.',
    icon: { type: 'FontAwesome', name: 'filter' },
    tip: 'Categories help narrow down potential conditions.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Disease Details',
    description: 'Tap any disease card to view detailed information including symptoms, causes, and treatment options.',
    icon: { type: 'MaterialIcons', name: 'info' },
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Bookmark Diseases',
    description: 'Save important diseases for quick reference by tapping the bookmark icon.',
    icon: { type: 'FontAwesome', name: 'bookmark' },
    tip: 'Bookmarked diseases appear at the top of your list.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Compare Diseases',
    description: 'Compare similar diseases side-by-side to understand differences in symptoms and treatments.',
    icon: { type: 'FontAwesome', name: 'exchange' },
    tip: 'Useful when narrowing down possible diagnoses.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Severity Indicators',
    description: 'Each disease shows a severity level to help you understand urgency: low, medium, or high.',
    icon: { type: 'FontAwesome', name: 'exclamation-triangle' },
    position: { top: 180, left: 20, right: 20 },
  },
];

export const chatTutorialSteps = [
  {
    title: 'Chat with Veterinarians',
    description: 'Get professional advice from licensed veterinarians through our chat feature.',
    icon: { type: 'FontAwesome', name: 'comment' },
    position: { top: 150, left: 20, right: 20 },
  },
  {
    title: 'Browse Available Vets',
    description: 'View a list of veterinarians, their specialties, ratings, and availability status.',
    icon: { type: 'FontAwesome', name: 'list' },
    tip: 'Green status means the vet is currently available.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'View Vet Profiles',
    description: 'Tap on a vet to see their full profile including credentials, experience, and specializations.',
    icon: { type: 'FontAwesome', name: 'user-md' },
    tip: 'Choose a vet whose specialty matches your pet\'s needs.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Start a Conversation',
    description: 'Tap "Start Chat" to begin a conversation. Describe your pet\'s symptoms clearly.',
    icon: { type: 'MaterialIcons', name: 'chat' },
    tip: 'Include relevant photos and scan results for better advice.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Send Photos & Files',
    description: 'Share photos of your pet, scan results, or previous medical records directly in the chat.',
    icon: { type: 'FontAwesome', name: 'paperclip' },
    tip: 'Visual information helps vets provide more accurate advice.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Chat History',
    description: 'All your conversations are saved. Return anytime to review past advice and recommendations.',
    icon: { type: 'MaterialIcons', name: 'history' },
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'Important Note',
    description: 'While vets provide professional advice, emergency cases should always be taken to a physical clinic immediately.',
    icon: { type: 'FontAwesome', name: 'warning' },
    tip: 'Use chat for advice, not emergency situations.',
    position: { top: 180, left: 20, right: 20 },
  },
];

export const homeFeedTutorialSteps = [
  {
    title: 'Home Feed Features',
    description: 'Explore the community feed where pet owners share their health analyses and experiences.',
    icon: { type: 'FontAwesome', name: 'home' },
    position: { top: 150, left: 20, right: 20 },
  },
  {
    title: 'Search Posts',
    description: 'Tap the search icon to find posts by pet name, owner name, or disease.',
    icon: { type: 'FontAwesome', name: 'search' },
    tip: 'Search helps you find similar cases to your pet\'s condition.',
    position: { top: 120, left: 20, right: 20 },
  },
  {
    title: 'View Disease Info',
    description: 'Tap the info icon to access the disease information database anytime.',
    icon: { type: 'FontAwesome', name: 'info-circle' },
    position: { top: 120, left: 20, right: 20 },
  },
  {
    title: 'Check History',
    description: 'Tap the history icon to quickly access your scan history.',
    icon: { type: 'FontAwesome', name: 'history' },
    position: { top: 120, left: 20, right: 20 },
  },
  {
    title: 'Help Button',
    description: 'Tap "Help" in the header anytime to restart this tutorial or get assistance.',
    icon: { type: 'MaterialIcons', name: 'help-outline' },
    position: { top: 120, left: 20, right: 20 },
  },
  {
    title: 'Interact with Posts',
    description: 'Like, comment on, and share posts from the community. Your engagement helps others!',
    icon: { type: 'FontAwesome', name: 'heart' },
    tip: 'Veterinarians often comment with professional advice.',
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'View Vet Profiles',
    description: 'Tap on a vet\'s name or badge to view their profile and credentials.',
    icon: { type: 'FontAwesome', name: 'user-md' },
    position: { top: 180, left: 20, right: 20 },
  },
];

export const profileTutorialSteps = [
  {
    title: 'Your Profile',
    description: 'Manage your account information, view your activity, and access app settings.',
    icon: { type: 'FontAwesome', name: 'user' },
    position: { top: 150, left: 20, right: 20 },
  },
  {
    title: 'Profile Photo',
    description: 'Tap your profile photo to change it. This helps personalize your account.',
    icon: { type: 'MaterialIcons', name: 'photo-camera' },
    position: { top: 180, left: 20, right: 20 },
  },
  {
    title: 'View Your Posts',
    description: 'See all the analyses you\'ve shared with the community in the Posts tab.',
    icon: { type: 'FontAwesome', name: 'th' },
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Scan History',
    description: 'Switch to the History tab to view all your pet scans, including private ones.',
    icon: { type: 'FontAwesome', name: 'history' },
    tip: 'History shows both shared and private scans.',
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Edit Profile',
    description: 'Update your name, location, bio, and pet information to personalize your profile.',
    icon: { type: 'MaterialIcons', name: 'edit' },
    position: { top: 200, left: 20, right: 20 },
  },
  {
    title: 'Settings',
    description: 'Access app settings to change your email, password, or restart tutorials.',
    icon: { type: 'FontAwesome', name: 'cog' },
    tip: 'Find the Tutorial option here to restart this guide.',
    position: { top: 200, left: 20, right: 20 },
  },
];
